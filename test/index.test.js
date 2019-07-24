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
const { wrap, report, PINGDOM_XML_PATH } = require('../src/index.js');

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

    const result1 = await wrapped({ __ow_path: `${PINGDOM_XML_PATH}`, FOO_BAR: 'baz' });
    assert.equal(result1.statusCode, 200, 'calling with Pingdom status path get reports');

    const result2 = await wrapped({ name: 'boo' });
    assert.equal(result2, 'boo');
  });

  it('index function returns status code for objects', async () => {
    const result = await index({});
    assert.equal(result.statusCode, 200);
    assert.ok(result.body.match(/<version>2./));
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
    assert.ok(result.body.match(/<version>2./));
    assert.equal(result.statusCode, 200);
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
    assert.ok(result.body.match(/<version>2./));
    assert.equal(result.statusCode, 200);
  });

  it('index function fails after timeout', async function test() {
    // polly seems to somehow interfere with the timeout handling in request.
    // so we disable it here.
    this.polly.disconnectFrom('node-http');
    const result = await report({
      snail: 'https://raw.githubusercontent.com/adobe/helix-pingdom-status/master/README.md',
    }, 10);

    assert.ok(result.body.match(/<status>failed/));
    assert.ok(result.body.match(/<version>2./));

    // error can be ESOCKETTIMEDOUT or ETIMEDOUT
    assert.ok(result.body.match(/<body><!\[CDATA\[Error: E(SOCKET)?TIMEDOUT]]><\/body>/));
    assert.equal(result.statusCode, 200);
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
});
