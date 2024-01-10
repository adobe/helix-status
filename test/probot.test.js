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

import assert from 'assert';
import express from 'express';
import { expect } from 'chai';
import * as chai from 'chai';
import chaiHttp from 'chai-http';
import { probotStatus } from '../src/index.js';

const { request } = chai.use(chaiHttp);

process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

chai.use(chaiHttp);

describe('Probot Tests', async () => {
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

    await request(app).get('/foo').then((res) => {
      expect(res).to.have.status(200);
      expect(res.text).to.equal('bar');
    });
  });

  it('probotStatus serves JSON status', async () => {
    const app = express();

    app.get('/foo', (req, res) => {
      res.send('bar');
    });

    probotStatus()({
      getRouter: () => app,
    });

    await request(app).get('/foo').then((res) => {
      expect(res).to.have.status(200);
      expect(res.text).to.equal('bar');
    });

    await request(app).get('/_status_check/healthcheck.json').then((res) => {
      expect(res).to.have.status(200);
      expect(res).to.have.header('content-type', 'application/json; charset=utf-8');
    });
  });
});
