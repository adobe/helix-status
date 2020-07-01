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

/* eslint-disable no-underscore-dangle */
const escape = require('xml-escape');
const fs = require('fs');
const { error } = require('@adobe/helix-log');
const fetchAPI = require('@adobe/helix-fetch');
const pkgversion = require('../package.json').version;

const PINGDOM_XML_PATH = '/_status_check/pingdom.xml';
const HEALTHCHECK_PATH = '/_status_check/healthcheck.json';

function memoize(fn) {
  let val;
  return () => {
    if (!val) {
      val = fn();
    }
    return val;
  };
}

function xml(o, name) {
  let value = o;
  if (typeof o === 'object') {
    value = Object.keys(o).map((k) => xml(o[k], k)).join('\n');
  } else if (typeof o === 'string') {
    value = escape(o);
  }
  return `<${name}>${value}</${name}>`;
}

const getPackage = memoize(() => new Promise((resolve) => {
  fs.readFile('package.json', 'utf-8', (err, data) => {
    if (err) {
      error('error while reading package.json:', err);
      resolve({});
    } else {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        error('error while parsing package.json:', e);
        resolve({});
      }
    }
  });
}));

const getVersion = memoize(async () => (await getPackage()).version || 'n/a');

const getName = memoize(async () => (await getPackage()).name || 'n/a');

const getFetchContext = memoize(() => {
  /* istanbul ignore next */
  if (process.env.HELIX_FETCH_FORCE_HTTP1) {
    return fetchAPI.context({
      httpProtocol: 'http1',
      httpsProtocols: ['http1'],
    });
  } else {
    /* istanbul ignore next */
    return fetchAPI;
  }
});

/**
 * Use fetch to emulate a request call as it is used in this code.
 * @param {object} opts Request options.
 * @returns {object} a response object.
 */
async function request(opts) {
  const { uri } = opts;
  if (!uri) {
    throw new Error('request needs uri parameter.');
  }
  const options = {
    cache: 'no-store',
    ...opts,
  };

  delete options.uri;
  const context = getFetchContext();

  if (options.timeout) {
    options.signal = context.timeoutSignal(options.timeout);
    delete options.timeout;
  }

  const start = Date.now();
  let response;
  let body;
  try {
    response = await context.fetch(uri, options);
    body = await response.text();
  } catch (e) {
    /* istanbul ignore next */
    if (e instanceof fetchAPI.AbortError) {
      e.options = options;
      e.message = 'Error: ETIMEDOUT';
    }
    // this is needed, otherwise the sockets hang
    await context.disconnectAll();
    throw e;
  }
  const end = Date.now();

  const requestResponse = {
    statusCode: response.status,
    url: response.url,
    headers: response.headers,
    body,
    timings: {
      end: end - start,
    },
  };

  if (response.ok) {
    return requestResponse;
  } else {
    const err = new Error();
    err.options = opts;
    err.response = requestResponse;
    throw err;
  }
}

async function uricheck(key, uri, timeout) {
  const version = await getVersion();
  const name = await getName();

  const response = await request({
    uri,
    timeout,
    headers: {
      'user-agent': `helix-status/${pkgversion} (${name}@${version})`,
    },
  });
  return {
    key,
    response,
  };
}

function seal(obj = {}, init, params) {
  return Object.keys(obj).reduce((p, key) => {
    const value = obj[key];
    if (typeof value === 'function') {
      // eslint-disable-next-line no-param-reassign
      p[key] = value(params);
    } else {
      // eslint-disable-next-line no-param-reassign
      p[key] = value;
    }
    return p;
  }, init);
}

async function requestcheck(key, opts, timeout, params) {
  const version = await getVersion();
  const name = await getName();

  const requestoptions = seal(opts, {}, params);
  requestoptions.headers = seal(opts.headers, {
    'user-agent': `helix-status/${pkgversion} (${name}@${version})`,
  }, params);

  const response = await request(requestoptions);
  return {
    key,
    response,
  };
}

async function funccheck(key, func, params) {
  const start = Date.now();
  const result = await func(params);
  const end = Date.now();

  return {
    key,
    response: {
      result,
      timings: {
        end: end - start,
      },
    },
  };
}

function makechecker(timeout, params) {
  return async function checker([key, check]) {
    if (typeof check === 'string') {
      return uricheck(key, check, timeout);
    } else if (typeof check === 'function') {
      return funccheck(key, check, params);
    }
    return requestcheck(key, check, timeout, params);
  };
}

async function report(checks = {}, params, timeout = 10000, decorator = { body: xml, mime: 'application/xml', name: 'pingdom_http_custom_check' }) {
  const start = Date.now();
  const version = await getVersion();

  try {
    const runchecks = Object.keys(checks)
      .filter((key) => key.match('^[a-z0-9]+$'))
      .map((key) => [key, checks[key]])
      .map(makechecker(timeout, params));

    const checkresults = await Promise.all(runchecks);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': decorator.mime,
        'X-Version': version,
      },
      body: decorator.body({
        status: 'OK',
        version,
        response_time: Math.abs(Date.now() - start),
        process: {
          activation: process.env.__OW_ACTIVATION_ID,
        },
        ...checkresults.reduce((p, { key, response }) => {
          // eslint-disable-next-line no-param-reassign
          p[key] = Math.floor(response.timings.end);
          return p;
        }, {}),
      }, decorator.name),
    };
  } catch (e) {
    let statusCode = 502; // gateway error
    if (e instanceof fetchAPI.AbortError) {
      statusCode = 504; // gateway timeout
    }
    const body = (e.response ? e.response.body : '') || e.message;
    return {
      statusCode: e.options ? statusCode : 500,
      headers: {
        'Content-Type': decorator.mime,
        'X-Version': version,
      },
      body: decorator.body({
        status: 'failed',
        version,
        response_time: Math.abs(Date.now() - start),
        error: {
          url: e.options ? e.options.uri : undefined,
          statuscode: e.response ? e.response.statusCode : undefined,
          body,
        },
        process: {
          activation: process.env.__OW_ACTIVATION_ID,
        },
      }, decorator.name),
    };
  }
}

function wrap(func, checks) {
  return (params) => {
    // Pingdom status check?
    if (params
      && params.__ow_path === PINGDOM_XML_PATH) {
      return report(checks, params);
    }
    // New Relic status check?
    if (params
      && params.__ow_path === HEALTHCHECK_PATH) {
      return report(checks, params, 10000, {
        body: (j) => j,
        mime: 'application/json',
      });
    }
    return func(params);
  };
}

/**
 * Status Checks as a Probot "app": call with a map of checks
 * and get a function that can be passed into Probot's `withApp`
 * function.
 * @param {object} checks A map of checks to perform. Each key is a name of the check,
 * each value a URL to ping
 * @returns {function} a probot app function that can be added to any given bot
 */
function probotStatus(checks = {}) {
  return (probot) => {
    const [, baseroute, pingroute] = PINGDOM_XML_PATH.split('/');
    const healthroute = HEALTHCHECK_PATH.split('/')[2];

    const router = probot.route(`/${baseroute}`);

    router.get(`/${pingroute}`, async (_, res) => {
      const r = await report(checks, {});

      res.set(r.headers);
      res.send(r.body);
    });

    router.get(`/${healthroute}`, async (_, res) => {
      const r = await report(checks, {}, 10000, {
        body: (j) => j,
        mime: 'application/json',
      });

      res.set(r.headers);
      res.send(r.body);
    });
  };
}

/**
 * This is the main function
 * @param {object|function} paramsorfunction a params object (if called as an OpenWhisk action)
 * or a function to wrap.
 * @param {object} checks a map of checks to perfom. Each key is a name of the check,
 * each value a URL to ping
 * @returns {object|function} a status report for Pingdom or a wrapped function
 */
function main(paramsorfunction, checks = {}) {
  if (typeof paramsorfunction === 'function') {
    return wrap(paramsorfunction, checks);
  } else if (typeof paramsorfunction === 'object') {
    // New Relic status check?
    if (paramsorfunction
      && paramsorfunction.__ow_path === HEALTHCHECK_PATH) {
      return report(paramsorfunction, {}, 10000, {
        body: (j) => j,
        mime: 'application/json',
      });
    }
    return report(paramsorfunction);
  }
  throw new Error('Invalid Arguments: expected function or object');
}

module.exports = {
  main, wrap, report, PINGDOM_XML_PATH, xml, HEALTHCHECK_PATH, probotStatus,
};
