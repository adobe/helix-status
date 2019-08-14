# Helix Status

> Report status for OpenWhisk Microservices for Pingdom (and others) Uptime (HTTP) checks

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-status.svg)](https://codecov.io/gh/adobe/helix-status)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-status.svg)](https://circleci.com/gh/adobe/helix-status)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-status.svg)](https://github.com/adobe/helix-status/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-status.svg)](https://github.com/adobe/helix-status/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-status.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-status)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![Greenkeeper badge](https://badges.greenkeeper.io/adobe/helix-status.svg)](https://greenkeeper.io/)

## Problem

You have a microservice that is deployed as an OpenWhisk HTTP action or even a number of these microservices and you want to establish monitoring of service uptime using Pingdom.

In case the service is down, you want to quickly understand if it is a problem with

- the OpenWhisk runtime, which may be unreachable or overloaded
- one of your backend API providers which might be unreachable
- your own service which could be broken (for instance due to a deployment change)

Finally, you know that there are [Uptime (HTTP) Checks](https://help.pingdom.com/hc/en-us/articles/203679631-How-to-set-up-an-uptime-HTTP-check) in Pingdom, and similar services such as [New Relic Synthetics](https://docs.newrelic.com/docs/synthetics) but you do not want to keep repeating the same code for returning a status check in each of your micro services.

## Solution

`helix-status` is:

1. a micro service (running as an OpenWhisk HTTP action) that responds to Pingdom Uptime (HTTP) Checks (and similar)
2. a library that allows you to wrap your own actions to get a standardized monitoring response

# Helix Status (as a Service)

## Usage

The service is installed and available for Adobe I/O Runtime at `https://adobeioruntime.net/api/v1/web/helix/helix-services/status@latest`.

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/status@latest/_status_check/pingdom.xml
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/status@latest/_status_check/healthcheck.json
```

If you want to monitor the availability of Adobe I/O Runtime, just add a new [Uptime (HTTP) Check](https://help.pingdom.com/hc/en-us/articles/203679631-How-to-set-up-an-uptime-HTTP-check) in Pingdom, using the `https://` protocol, and `adobeioruntime.net/api/v1/web/helix/helix-services/status@latest/_status_check/pingdom.xml` as the URL.

## Deployment in your own Namespace

If you want to use the service in your own namespace or an OpenWhisk instance that is not Adobe I/O Runtime, make sure your `~/.wskprops` is set up correctly and run:

```bash
$ npm install
$ npm run build
$ npm run deploy
```

# Helix Pingdom Status (as a Library)

## Installation

```bash
$ npm install -S @adobe/helix-status
```

## Usage

In the entry point of your action, add

```javascript
const { wrap } = require('@adobe/helix-status');
```

to the top of your file and override the `module.exports.main` with:

```javascript
module.exports.main = wrap(main);
```

All `GET /_status_check/pingdom.xml` requests to your service will now respond with an XML response similar to below:

```xml
<pingdom_http_custom_check>
  <status>OK</status>
  <response_time>0</response_time>

</pingdom_http_custom_check
```

> **Note**: While the XML response format is similar to the one described in [Pingdom Custom HTTP Check](https://help.pingdom.com/hc/en-us/articles/115000431709-HTTP-Custom-Check) the `/_status_check/pingdom.xml` request is intented to be used for standard Pingdom UPTIME Checks only. It's _not_ suitable for Custom HTTP Checks which  expect an HTTP Status 200 XML response whereas UPTIME Checks determine the status of a service (UP/DOWN) based on the HTTP Status code of the response. For more information see [#21](https://github.com/adobe/helix-status/issues/21) and [here](https://help.pingdom.com/hc/en-us/articles/203749792-What-is-a-check-).

You can also specify a list of checks to run by passing second argument to `wrap`:

```javascript
module.exports.main = wrap(main, { example: 'http://www.example.com'})
```

you will then see results like this:

```xml
<pingdom_http_custom_check>
  <status>OK</status>
  <response_time>181</response_time>
  <example>176</example>
</pingdom_http_custom_check>
```

It is a good idea to use URLs that are representative of the API endpoints your service is calling in normal operation as checks.

# Usage with New Relics Synthetics

[New Relic Synthetics](https://docs.newrelic.com/docs/synthetics) is a service that is similar to Pingdom, but more capable. It can be used with `helix-status` by creating an API Check script like this:

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

# Development

## Deploying Helix Pingdom Status

Deploying Helix Pingdom Status requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to master that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/status@ci<num>` and tagged with the CI build number.
