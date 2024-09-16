/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
import assert from 'assert';
import path from 'path';
import esmock from 'esmock';

import pkgJson from '../src/package.cjs';
import { report, helixStatus, HEALTHCHECK_PATH } from '../src/index.js';
import { Nock } from './utils.js';

const TEST_ACTIVATION_ID = '1234';

// eslint-disable-next-line no-underscore-dangle
process.env.__OW_ACTIVATION_ID = TEST_ACTIVATION_ID;
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

describe('Index Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock().env();
  });

  afterEach(() => {
    nock.done();
  });

  it('wrap function takes over when called with health check path', async () => {
    const wrapped = helixStatus(({ name } = {}) => name || 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');

    const result1 = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}`, FOO_BAR: 'baz' });
    assert.equal(result1.statusCode, 200, 'calling with health check path get reports');

    const result2 = await wrapped({ name: 'boo' });
    assert.equal(result2, 'boo');
  });

  it('wrap function takes over when called with health check path (universal deploy)', async () => {
    const wrapped = helixStatus(({ name } = {}) => name || 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped(/* Request */ {}, {
      pathInfo: {
        suffix: HEALTHCHECK_PATH,
      },
    });
    assert.equal(result.status, 200, 'calling with health check path get reports');
    assert.equal(result.headers.get('Content-Type'), 'application/json');
    assert.equal(typeof result.body, 'object');
  });

  it('wrap function supports function check', async () => {
    let triggered = false;
    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      funccheck: () => {
        triggered = true;
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');
    assert.ok(!triggered);

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
    assert.ok(triggered);
  });

  it('wrap function reports failure for failing function check', async () => {
    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      funccheck: () => {
        throw new Error('Boom!');
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 500, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
  });

  it('wrap function supports function check with options', async () => {
    let triggered = false;
    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      funccheck: (opts) => {
        triggered = opts;
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');
    assert.ok(!triggered);

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
    assert.ok(triggered);
  });

  it('wrap function supports request options check', async () => {
    nock('https://www.example.com')
      .post('/')
      .reply(200);
    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      optscheck: {
        uri: 'https://www.example.com',
        method: 'POST',
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
  });

  it('wrap function rejects options check with no uri', async () => {
    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      optscheck: {
        method: 'POST',
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 500);
    delete result.body.process;
    delete result.body.response_time;
    delete result.body.version;
    assert.deepEqual(result.body, {
      error: {
        body: 'request needs uri parameter.',
        statuscode: undefined,
        url: undefined,
      },
      status: 'failed',
    });
  });

  it('wrap function supports request options check with functions', async () => {
    nock('https://www.example.com')
      .post('/')
      .reply(200);

    const wrapped = helixStatus(({ name } = {}) => name || 'foo', {
      optscheck: {
        uri: 'https://www.example.com',
        method: 'POST',
        headers: {
          Referer: (params) => params.__ow_path,
        },
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(await wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
  });

  it('index function returns n/a for missing package.json', async () => {
    nock('https://www.example.com')
      .get('/')
      .reply(200);

    const { report: localReport } = await esmock('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__testdir, 'fixtures', 'no_package'));
      const result = await localReport({
        example: 'https://www.example.com',
      });
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, 'n/a');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns correct package version', async () => {
    const { report: localReport } = await esmock('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__testdir, 'fixtures', 'custom_package'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, '10.42-beta');
      assert.equal(result.headers['X-Version'], '10.42-beta');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for corrupt package.json', async () => {
    const { report: localReport } = await esmock('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__testdir, 'fixtures', 'no_valid_package_json'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, 'n/a');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for missing package version', async () => {
    const { report: localReport } = await esmock('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__testdir, 'fixtures', 'no_package_version'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, 'n/a');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function makes HTTP requests', async () => {
    nock('https://www.example.com')
      .get('/')
      .reply(200);
    const result = await report({ example: 'https://www.example.com' });

    assert.ok(/\d+/.test(result.body.example));
    assert.equal(result.body.version, pkgJson.version);
    assert.equal(result.statusCode, 200);
  });

  it('index function returns error status code', async () => {
    nock('https://httpstat.us/')
      .get('/503')
      .reply(503, '503 Service Unavailable');
    const result = await report({ example: 'https://httpstat.us/503' });

    delete result.body.response_time;
    assert.deepStrictEqual(result.body, {
      error: {
        body: '503 Service Unavailable',
        statuscode: 503,
        url: 'https://httpstat.us/503',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 502);
  });

  it('index function fails with useful error message', async () => {
    nock('https://www.fail.com/')
      .get('/')
      .reply(500, {});

    const result = await report({
      fail: 'https://www.fail.com/',
    });
    delete result.body.response_time;

    assert.deepEqual(result.body, {
      error: {
        body: '{}',
        statuscode: 500,
        url: 'https://www.fail.com/',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 502);
  });

  it('User agent string contains helix-status/', async () => {
    let ua;
    nock('https://example.com')
      .get('/test')
      .reply(function req() {
        ua = this.req.headers['user-agent'];
        return [200];
      });

    await report({
      localhost: 'https://example.com/test',
    });
    assert.match(ua, /helix-status\//);
  });
});

describe('Timeout Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock().env();
  });

  afterEach(() => {
    nock.done();
  });

  it('index function reports timeouts with status 504', async () => {
    nock('https://example.com')
      .get('/test')
      .delay(11000)
      .reply(200);

    const result = await report({ example: 'https://example.com/test' });
    assert.ok(result.body.response_time <= 10000 * 1.01, `response time should be greater than 10s, but was ${result.body.response_time}ms`);
    delete result.body.response_time;
    assert.deepEqual(result.body, {
      error: {
        body: 'Error: ETIMEDOUT',
        statuscode: undefined,
        url: 'https://example.com/test',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 504);
  }).timeout(20000);

  it('index function fails after timeout', async () => {
    nock('https://example.com')
      .get('/test')
      .delay(100)
      .reply(200);

    const result = await report({
      snail: 'https://example.com/test',
    }, {}, 10);

    assert.ok(result.body.response_time >= 10);
    delete result.body.response_time;

    assert.deepEqual(result.body, {
      error: {
        body: 'Error: ETIMEDOUT',
        statuscode: undefined,
        url: 'https://example.com/test',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 504);
  });
});
