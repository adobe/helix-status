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

const assert = require('assert');
const path = require('path');
const { AssertionError } = require('assert');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const { setupMocha: setupPolly } = require('@pollyjs/core');
const FSPersister = require('@pollyjs/persister-fs');
const index = require('../src/index.js').main;
const {
  wrap, report, PINGDOM_XML_PATH, xml, HEALTHCHECK_PATH,
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
        exclude: ['user-agent'],
      },
    },
  });


  it('index function returns function for function', async () => {
    const wrapped = await index(() => 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(wrapped(), 'foo');
  });

  it('wrap function takes over when called with pingdom status path', async () => {
    const wrapped = wrap(({ name } = {}) => name || 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(wrapped(), 'foo', 'calling without Pingdom status path passes through');

    const result = await wrapped({ __ow_path: `${PINGDOM_XML_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with Pingdom status path get reports');
    assert.equal(result.headers['Content-Type'], 'application/xml');
    assert.equal(typeof result.body, 'string');

    const result1 = await wrapped({ __ow_path: `${PINGDOM_XML_PATH}`, FOO_BAR: 'baz' });
    assert.equal(result1.statusCode, 200, 'calling with Pingdom status path get reports');

    const result2 = await wrapped({ name: 'boo' });
    assert.equal(result2, 'boo');
  });

  it('wrap function takes over when called with health check path', async () => {
    const wrapped = wrap(({ name } = {}) => name || 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');

    const result1 = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}`, FOO_BAR: 'baz' });
    assert.equal(result1.statusCode, 200, 'calling with health check path get reports');

    const result2 = await wrapped({ name: 'boo' });
    assert.equal(result2, 'boo');
  });

  it('wrap function supports function check', async () => {
    let triggered = false;
    const wrapped = wrap(({ name } = {}) => name || 'foo', {
      funccheck: () => {
        triggered = true;
      },
    });

    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');
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
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');

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
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');
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
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
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
    assert.deepEqual(wrapped(), 'foo', 'calling without health check path passes through');

    const result = await wrapped({ __ow_path: `${HEALTHCHECK_PATH}` });
    assert.equal(result.statusCode, 200, 'calling with health check path get reports');
    assert.equal(result.headers['Content-Type'], 'application/json');
    assert.equal(typeof result.body, 'object');
  });

  it('index function returns status code for objects', async () => {
    const result = await index({});
    assert.equal(result.statusCode, 200);
    assert.ok(result.body.match(/<version>\d+\./));
  });

  it('index function returns status code for objects as JSON', async () => {
    const result = await index({ __ow_path: HEALTHCHECK_PATH });
    assert.equal(result.statusCode, 200);
    assert.equal(typeof result.body, 'object');
  });

  it('index function returns n/a for missing package.json', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { main } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_package'));
      const result = await main({});
      assert.equal(result.statusCode, 200);
      assert.ok(result.body.match(/<version>n\/a<\/version>/));
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns correct package version', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { main } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'custom_package'));
      const result = await main({});
      assert.equal(result.statusCode, 200);
      assert.ok(result.body.match(/<version>10.42-beta<\/version>/));
      assert.equal(result.headers['X-Version'], '10.42-beta');
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for corrupt package.json', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { main } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_valid_package_json'));
      const result = await main({});
      assert.equal(result.statusCode, 200);
      assert.ok(result.body.match(/<version>n\/a<\/version>/));
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function returns n/a for missing package version', async () => {
    delete require.cache[require.resolve('../src/index.js')];
    // eslint-disable-next-line global-require
    const { main } = require('../src/index.js');
    const pwd = process.cwd();
    try {
      process.chdir(path.resolve(__dirname, 'fixtures', 'no_package_version'));
      const result = await main({});
      assert.equal(result.statusCode, 200);
      assert.ok(result.body.match(/<version>n\/a<\/version>/));
    } finally {
      process.chdir(pwd);
    }
  });

  it('index function makes HTTP requests', async () => {
    const result = await index({ example: 'http://www.example.com' });
    const { body } = result;

    assert.ok(body.match(/<example>/));
    assert.ok(result.body.match(/<version>\d+\./));
    assert.equal(result.statusCode, 200);
  });

  it('index function returns error status code', async () => {
    const ERROR_STATUS = 503;
    const result = await index({ example: `http://httpstat.us/${ERROR_STATUS}` });

    assert.ok(result.body.match(/<version>\d+\./));
    assert.ok(result.body.match(/<status>failed/));
    assert.ok(result.body.match(new RegExp(`<statuscode>${ERROR_STATUS}`)));
    assert.equal(result.statusCode, 502);
  });

  it('index function fails with useful error message', async function test() {
    const { server } = this.polly;

    server.get('http://www.fail.com/').intercept((_, res) => res.sendStatus(500).json({}));

    const result = await index({
      example: 'http://www.example.com',
      fail: 'http://www.fail.com/',
    });

    assert.ok(result.body.match(/<statuscode>500/));
    assert.ok(result.body.match(/<status>failed/));
    assert.ok(result.body.match(/<version>\d+\./));
    assert.equal(result.statusCode, 502);
  });

  it('index function throws if passed invalid arguments', async () => {
    try {
      await index();
      assert.fail('this should never happen');
    } catch (e) {
      if (e instanceof AssertionError) {
        throw e;
      }
      assert.equal(e.message, 'Invalid Arguments: expected function or object');
    }
  });

  it('User agent string contains helix-status/', async function test() {
    const { server } = this.polly;

    let ua;
    server.get('http://localhost/test').intercept((req) => {
      ua = req.headers['user-agent'];
    });

    await index({
      localhost: 'http://localhost/test',
    });

    assert.ok(ua);
    assert.ok(ua.match(/helix-status\//));
  });
});

describe('Test mini-XML generator', () => {
  it('Generates XML from String', () => {
    assert.equal(xml('Hello World', 'foo'), '<foo>Hello World</foo>');
  });

  it('Generates XML from Number', () => {
    assert.equal(xml(12, 'foo'), '<foo>12</foo>');
  });

  it('Generates XML from Object', () => {
    assert.equal(xml({ hey: 'ho', bar: 'baz', zip: { zap: 'zup' } }, 'foo'), `<foo><hey>ho</hey>
<bar>baz</bar>
<zip><zap>zup</zap></zip></foo>`);
  });
});

describe('Timeout Tests', () => {
  it('index function reports timeouts with status 504', async () => {
    const result = await index({ example: 'http://httpstat.us/200?sleep=15000' });

    assert.ok(result.body.match(/<version>\d+\./));
    assert.ok(result.body.match(/<status>failed/));
    assert.equal(result.statusCode, 504);
  }).timeout(20000);

  it('index function fails after timeout', async () => {
    const result = await report({
      snail: 'https://httpstat.us/200?sleep=1000',
    }, {}, 10);

    assert.ok(result.body.match(/<status>failed/));
    assert.ok(result.body.match(/<version>\d+\./));

    // error can be ESOCKETTIMEDOUT or ETIMEDOUT
    assert.ok(result.body.match(/<body>Error: E(SOCKET)?TIMEDOUT<\/body>/));
    assert.equal(result.statusCode, 504);
  });
});
