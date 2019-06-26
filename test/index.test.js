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
const { wrap } = require('../src/index.js');

describe('Index Tests', () => {
  setupPolly({
    recordIfMissing: false,
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
    const result = await wrapped({ __ow_method: 'get' });
    assert.equal(result.statusCode, 200);
  });

  it('wrap function takes over when no other params are given', async () => {
    const wrapped = wrap(({name} = {}) => name || 'foo');
    assert.deepEqual(typeof wrapped, 'function');
    assert.deepEqual(wrapped(), 'foo', 'calling without params passes through');
    
    const result = await wrapped({ __ow_method: 'get' });
    assert.equal(result.statusCode, 200, 'calling with method get reports');

    const result2 = await wrapped({ __ow_method: 'get', name: 'boo' });
    assert.equal(result2, 'boo');
  });

  it('index function returns status code for objects', async () => {
    const result = await index({});
    assert.deepEqual(result.statusCode, 200);
    assert.ok(result.body.match(/<version>1./));
  });

  it('index function makes HTTP requests', async () => {
    const result = await index({ example: 'http://www.example.com', __ow_method: 'get' });
    const { body } = result;
    assert.ok(body.match(/<example>/));
    assert.ok(result.body.match(/<version>1./));
    assert.deepEqual(result.statusCode, 200);
  });

  it('index function fails with useful error message', async function test() {
    const { server } = this.polly;

    server.get('http://www.fail.com/').intercept((_, res) => res.sendStatus(500).json({}));

    const result = await index({
      example: 'http://www.example.com',
      fail: 'http://www.fail.com/',
      __ow_method: 'get',
    });

    assert.ok(result.body.match(/<statuscode>500/));
    assert.ok(result.body.match(/<status>failed/));
    assert.ok(result.body.match(/<version>1./));
    assert.deepEqual(result.statusCode, 503);
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
