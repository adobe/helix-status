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

async function report() {
  const start = Date.now();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
    body: `<pingdom_http_custom_check>
    <status>OK</status>
    <response_time>${Math.abs(Date.now() - start)}</response_time>
</pingdom_http_custom_check>`,
  };
}

function wrap(func, checks) {
  return (params) => {
    // eslint-disable-next-line no-underscore-dangle
    if (params.__ow_methd === 'get') {
      return report(checks);
    }
    return func(params);
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
    return report(paramsorfunction);
  }
  throw new Error('Invalid Arguments: expected function or object');
}

module.exports = { main, wrap };
