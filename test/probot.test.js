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
import express from 'express';
import request from 'supertest';
import nock from 'nock';
import { probotStatus } from '../src/index.js';

process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

describe('Probot Tests', async () => {
  before(() => {
    // supertest internally starts a server, so we need to enable network connections in case
    // other nock tests ran before
    nock.enableNetConnect();
  });
  it('probotStatus returns a function', () => {
    assert.equal(typeof probotStatus(), 'function');
  });

  it('probotStatus does not interfere with regular app code', async () => {
    const app = express();

    app.get('/foo', (req, res) => {
      res.send('bar');
    });

    probotStatus({})({
      getRouter: () => app,
    });

    const ret = await request(app).get('/foo');

    assert.strictEqual(ret.status, 200);
    assert.strictEqual(ret.text, 'bar');
  });

  it('probotStatus serves JSON status', async () => {
    const app = express();

    app.get('/foo', (req, res) => {
      res.send('bar');
    });

    probotStatus()({
      getRouter: () => app,
    });

    const ret = await request(app).get('/_status_check/healthcheck.json');
    assert.strictEqual(ret.status, 200);
    assert.strictEqual(ret.header['content-type'], 'application/json; charset=utf-8');
    assert.strictEqual(JSON.parse(ret.text).status, 'OK');
  });
});
