# Helix Pingdom Status

> Report status for OpenWhisk Microservices in a Pingdom-custom-check-friendly format

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-pingdom-status.svg)](https://codecov.io/gh/adobe/helix-pingdom-status)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-pingdom-status.svg)](https://circleci.com/gh/adobe/helix-pingdom-status)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-pingdom-status.svg)](https://github.com/adobe/helix-pingdom-status/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-pingdom-status.svg)](https://github.com/adobe/helix-pingdom-status/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-pingdom-status.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-pingdom-status)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![Greenkeeper badge](https://badges.greenkeeper.io/adobe/helix-pingdom-status.svg)](https://greenkeeper.io/)

## Problem

You have a microservice that is deployed as an OpenWhisk HTTP action or even a number of these microservices and you want to establish monitoring of service uptime using Pingdom.

In case the service is down, you want to quickly understand if it is a problem with

- the OpenWhisk runtime, which may be unreachable or overloaded
- one of your backend API providers which might be unreachable
- your own service which could be broken (for instance due to a deployment change)

Finally, you know that there are [HTTP Custom Checks](https://help.pingdom.com/hc/en-us/articles/115000431709-HTTP-Custom-Check) in Pingdom, but you do not want to keep repeating the same code for returning a status check in each of your micro services.

## Solution

`helix-pingdom-status` is:

1. a micro service (running as an OpenWhisk HTTP action) that provides an HTTP Custom Check for Pingdom
2. a library that allows you to wrap your own actions to get a standardized monitoring response

# Helix Pingdom Status (as a Service)

## Usage

The service is installed and available for Adobe I/O Runtime at `https://adobeioruntime.net/api/v1/web/helix/helix-services/pingdom-status@v1`. 

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/pingdom-status@v1
```

If you want to monitor the availability of Adobe I/O Runtime, just add a new [HTTP Custom Check](https://help.pingdom.com/hc/en-us/articles/115000431709-HTTP-Custom-Check) in Pingdom, using the `https://` protocol, and `adobeioruntime.net/api/v1/web/helix/helix-services/pingdom-status@v1` as the URL.

## Deployment in your own Namespace

If you want to use the service in your own namespace or an OpenWhisk instance that is not Adobe I/O Runtime, make sure your `~/.wskprops` is set up correctly and run:

```bash
$ npm install
$ npm run build
$ npm run deploy
```

This will 

# Helix Pingdom Status (as a Library)

## Installation

```bash
$ npm install -S @adobe/helix-pingdom-status
```

## Usage

In the entry point of your action, add

```javascript
const { wrap } = require('@adobe/helix-pingdom-status');
```

to the top of your file and override the `module.exports.main` with:

```javascript
module.exports.main = wrap(main);
```

All `GET ` requests to your service will now respond with a Pingdom Custom Check XML like this:

```xml
<pingdom_http_custom_check>
  <status>OK</status>
  <response_time>0</response_time>

</pingdom_http_custom_check
```

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

# Development

## Deploying Helix Static

Deploying Helix Service requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to master that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/service@ci<num>` and tagged with the CI build number.
