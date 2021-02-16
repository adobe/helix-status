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

'use strict';

const http = require('http');
const assert = require('assert');
const path = require('path');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const { setupMocha: setupPolly } = require('@pollyjs/core');
const FSPersister = require('@pollyjs/persister-fs');
const pkgJson = require('../package.json');

const TEST_ACTIVATION_ID = '1234';

// eslint-disable-next-line no-underscore-dangle
process.env.__OW_ACTIVATION_ID = TEST_ACTIVATION_ID;
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const {
  main: index, wrap, report, HEALTHCHECK_PATH,
} = require('../src/index.js');

describe('Index Tests', () => {
  setupPolly({
    recordIfMissing: false,
    recordFailedRequests: false,
    logging: false,
    adapters: [NodeHttpAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, 'fixtures/recordings'),
      },
    },
    matchRequestsBy: {
      headers: {
        exclude: ['user-agent', 'accept', 'accept-encoding', 'connection'],
      },
    },
  });

  it('wrap function takes over when called with health check path', async () => {
    const wrapped = wrap(({ name } = {}) => name || 'foo');
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
    const wrapped = wrap(({ name } = {}) => name || 'foo');
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
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

  it('index function returns status code for objects', async () => {
    const result = await index({}, {});
    assert.equal(result.status, 200);
    assert.equal(typeof result.body, 'object');
  });

  it('index function returns status code for objects as JSON', async () => {
    const result = await report({ __ow_path: HEALTHCHECK_PATH });
    assert.equal(result.statusCode, 200);
    assert.equal(typeof result.body, 'object');
  });

  it('index function returns n/a for missing package.json', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { report: localReport } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_package'));
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
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { report: localReport } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'custom_package'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, '10.42-beta');
      assert.equal(result.headers['X-Version'], '10.42-beta');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for corrupt package.json', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { report: localReport } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_valid_package_json'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, 'n/a');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for missing package version', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { report: localReport } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_package_version'));
      const result = await localReport({});
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.version, 'n/a');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function makes HTTP requests', async () => {
    const result = await report({ example: 'http://www.example.com' });

    assert.ok(/\d+/.test(result.body.example));
    assert.equal(result.body.version, pkgJson.version);
    assert.equal(result.statusCode, 200);
  });

  it('index function returns error status code', async () => {
    const ERROR_STATUS = 503;
    const result = await report({ example: `http://httpstat.us/${ERROR_STATUS}` });

    delete result.body.response_time;
    assert.deepEqual(result.body, {
      error: {
        body: '503 Service Unavailable',
        statuscode: 503,
        url: 'http://httpstat.us/503',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 502);
  });

  it('index function fails with useful error message', async function test() {
    const { server } = this.polly;

    server.get('http://www.fail.com/').intercept((_, res) => res.sendStatus(500).json({}));

    const result = await report({
      fail: 'http://www.fail.com/',
    });
    delete result.body.response_time;

    assert.deepEqual(result.body, {
      error: {
        body: '{}',
        statuscode: 500,
        url: 'http://www.fail.com/',
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 502);
  });

  it('User agent string contains helix-status/', async function test() {
    const { server } = this.polly;

    let ua;
    server.get('http://example.com/test').intercept((req) => {
      ua = req.headers['user-agent'];
    });

    await report({
      localhost: 'http://example.com/test',
    });

    assert.ok(ua);
    assert.ok(ua.match(/helix-status\//));
  });
});

describe('Timeout Tests', () => {
  let port;
  let svr;
  beforeEach(async () => {
    // use custom server, since polly interferes with request.timeout.
    svr = await new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        setTimeout(() => {
          res.statusCode = 200;
          res.end('200');
        }, url.searchParams.get('sleep'));
      });
      server.listen(0, () => {
        port = server.address().port;
        resolve(server);
      });
    });
  });

  afterEach(async () => {
    svr.close();
    return new Promise((resolve) => {
      svr.on('close', resolve);
    });
  });

  it('index function reports timeouts with status 504', async () => {
    const url = `http://localhost:${port}/?sleep=11000`;
    const result = await report({ example: url });
    assert.ok(result.body.response_time > 10000 || result.body.error, `Got response: ${JSON.stringify(result.body, 2)}, expected response_time > 10000`);
    delete result.body.response_time;
    assert.deepEqual(result.body, {
      error: {
        body: 'Error: ETIMEDOUT',
        statuscode: undefined,
        url,
      },
      process: {
        activation: TEST_ACTIVATION_ID,
      },
      status: 'failed',
      version: pkgJson.version,
    });
    assert.equal(result.statusCode, 504);
    svr.close();
  }).timeout(20000);

  it('index function fails after timeout', async () => {
    const url = `http://localhost:${port}/?sleep=100`;
    const result = await report({
      snail: url,
    }, {}, 10);

    assert.ok(result.body.response_time >= 10 || result.body.error);
    delete result.body.response_time;

    assert.deepEqual(result.body, {
      error: {
        body: 'Error: ETIMEDOUT',
        statuscode: undefined,
        url,
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
