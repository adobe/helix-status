# Helix Status

> Report status for OpenWhisk Microservices for New Relic (and others) Uptime (HTTP) checks

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-status.svg)](https://codecov.io/gh/adobe/helix-status)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-status.svg)](https://circleci.com/gh/adobe/helix-status)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-status.svg)](https://github.com/adobe/helix-status/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-status.svg)](https://github.com/adobe/helix-status/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-status.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-status)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Problem

You have a microservice that is deployed as an OpenWhisk HTTP action or even a number of these 
microservices and you want to establish monitoring of service uptime using New Relic.

In case the service is down, you want to quickly understand if it is a problem with

- the OpenWhisk runtime, which may be unreachable or overloaded
- one of your backend API providers which might be unreachable
- your own service which could be broken (for instance due to a deployment change)

Finally, you know that there are [New Relic Synthetics](https://docs.newrelic.com/docs/synthetics) but you 
do not want to keep repeating the same code for returning a status check in each of your micro services.

## Solution

`helix-status` is a library that allows you to wrap your own actions to get a standardized monitoring response

## Installation

```bash
$ npm install -S @adobe/helix-status
```

## Usage 

In the entry point of your action, add

```javascript
const { helixStatus } = require('@adobe/helix-status');
```

to the top of your file and override the `module.exports.main` with:

```javascript
module.exports.main = helixStatus(main);
```

All `GET /_status_check/healthcheck.json` requests to your service will now respond with an XML response similar to below:

```json
{
  "status": "OK",
  "version": "1.5.4",
  "response_time": 6,
  "process": {}
}
```

You can also specify a list of checks to run by passing second argument to `wrap`:

```javascript
module.exports.main = helixStatus(main, { example: 'http://www.example.com'})
```

you will then see results like this:

```json
{
  "status": "OK",
  "version": "1.5.4",
  "response_time": 249,
  "process": {
    "activation": "7ef3047190924313b3047190923313e9"
  },
  "example": 247
}
```

It is a good idea to use URLs that are representative of the API endpoints your service is calling in normal operation as checks.

## Usage with Probot

If you are using [Probot](https://probot.github.io) for instance through [Serverless Probot on OpenWhisk](https://github.com/adobe/probot-serverless-openwhisk), the usage is slightly different:

```javascript
// import the probot status app
const { probotStatus } = require('@adobe/helix-status');

probot
  .withApp(yourApp)
  .withApp(probotStatus()) //add a status check app 
```

`probotStatus()` accepts the same `checks` object that has been described above, so you can pass an array of URL checks.

# Usage with New Relic Synthetics

[New Relic Synthetics](https://docs.newrelic.com/docs/synthetics) is a service that is similar to Pingdom. It can be used with `helix-status` by creating an API Check script like this:

```javascript
const assert = require('assert');

// replace the URL with your check URL
$http.get('https://adobeioruntime.net/api/v1/web/helix/helix-services/status@v3/_status_check/heathcheck.json',
  // Callback
  function (err, response, body) {
    assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
    const health = JSON.parse(body);
    assert.equal(health.status, 'OK', 'Expected an OK health check status');
    for (const v in health) {
      if (['status', 'process', 'version'].indexOf(v)===-1) {
        $util.insights.set(v, parseInt(health[v]));
      }
    }
    for (const h in ['x-openwhisk-activation-id', 'x-request-id', 'x-version']) {
      $util.insights.set(h, response.headers[h]);
    }
  }
);
```

# Advanced Checks

By default, `helix-status` will take a map of URLs and make a `GET` request for each URL provided. In some scenarios, you need to provide additional detail to craft the request and `helix-status` supports three types of advanced checks for that:

## Request Options

If you need to adjust things like request method (from `GET` to `POST`) or set request headers (e.g. `Accept`), instead of providing a URL as string, you can provide a [request options object, according to the `request/request` documentation](https://github.com/request/request#requestoptions-callback).

Make sure not to forget the `uri`.

```javascript
module.exports.main = wrap(main, 
  { example: {
    uri: 'http://www.example.com',
    method: 'POST',
    headers: {
      accept: 'application/json'
    }
  }});
```

## Custom Status Check Function

For more advanced use cases, you can provide a `function` in your checks. This function will be executed with the `params` of your OpenWhisk function when requested with the status check or health check URLs.

Keep in mind that the check function should execute reasonably fast, but it can be async.

```javascript
module.exports.main = wrap(main, 
  { example: function(params) => params.foo === params.bar });
```

## Request Options with Dynamic Values

A combination of the two techniques above is the usage of request options with Dynamic Values. This can be used if you need to populate properties of the request object or request headers with values provided in the `params` of the execution.

A typical example would be making a call to an API that requires an API key, where the API key would be stored in the default parameters of the OpenWhisk action.

To achieve this, provide a request options object as described in [Request Options](#request-options), but note that values both of the `options` and the `options.headers` object can be `function`s. Each property that is a function will be replaced with the value that function returns when called with the action's parameters.

```javascript
module.exports.main = wrap(main, 
  { example: {
    uri: 'http://www.example.com',
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: params => `Bearer ${params.EXAMPLE_API_TOKEN}`
    }
  }});
```

The example above shows how to extract the `EXAMPLE_API_TOKEN` value from the action's (default) parameters and applies it to the `Authorization` header.

# Status Codes

The health check reports following HTTP status codes:

- `200` (OK): all health checks performed successfully
- `504` (Gateway Timeout): the health check took too long to execute
- `502` (Gateway Error): the health check got an error response from the checked URL
- `500` (Server Error): the generic check function did not execute successfully

# Development

## Deploying Helix Status

Deploying Helix Status requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to main that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get committed as `/helix-services/status@ci<num>` and tagged with the CI build number.
