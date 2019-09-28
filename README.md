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

## Usage with Probot

If you are using [Probot](https://probot.github.io) for instance through [Serverless Probot on OpenWhisk](https://github.com/adobe/probot-serverless-openwhisk), the usage is slighly different:

```javascript
// import the probot status app
const { probotStatus } = require('@adobe/helix-status');

probot
  .withApp(yourApp)
  .withApp(probotStatus()) //add a status check app 
```

`probotStatus()` accepts the same `checks` object that has been described above, so you can pass an array of URL checks.

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

## Automated Monitoring

`helix-status` provides the following command line tools intended to be run as part of your deployment pipeline to automate your monitoring:

### Statuspage: Automated Update of Components

`statuspage` allows to automatically create components in Statuspage.

Usage:

```bash
$ npx statuspage
statuspage <cmd>

Commands:
  statuspage setup  Create or reuse a Statuspage component

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
  --auth     Statuspage API Key (or env $STATUSPAGE_AUTH)    [string] [required]
  --page_id  Statuspage Page ID (or env $STATUSPGAGE_PAGE_ID)[string] [required]
  --name     The name of the component                                  [string]
  --group    The name of an existing component group                    [string]
  --silent   Reduce output to automation email only   [boolean] [default: false]

$ npx statuspage setup --group "Delivery"
Creating component @adobe/helix-status in group Delivery
Automation email: component+id@notifications.statuspage.io
done.
```

You can pre-configure the `name` and `group` arguments in your `package.json`:
```json
"statuspage": {
  "name": "Helix Status",
  "group": "Delivery"
}
```
By default, the check will use the package `name` from your `package.json`, and leave group empty.

`statuspage` requires a Statuspage [API Key](https://developer.statuspage.io/#section/Authentication) that should be passed using either the `--auth` parameter or the `STATUSPAGE_AUTH` environment variable, as well as a Statuspage [Page ID] that should be passed using either the `--page_id` parameter or the `STATUSPAGE_PAGE_ID` environment variable. 

### New Relic: Automated Update of Synthetics Checks, Alert Policies and Notification Channels

`newrelic` automates the following New Relic features:
1. creation or update of monitors in New Relics Synthetics
1. creation of notification channels in New Relic Alerts
1. creation or update of alert policies and conditions in New Relic Alerts
1. wiring alert policies to notification channels and conditions to monitors

Usage:

```bash
$ npx newrelic
newrelic <cmd> url email

Commands:
  newrelic setup url email  Create or update a New Relic setup

Positionals:
  url    The URL to check                                    [string] [required]
  email  The email address to send alerts to                 [string] [required]

Options:
  --auth          Admin API Key (or env var $NEWRELIC_AUTH)   [string][required]
  --name          The name of the monitor, channel and policy           [string]
  --group_policy  The name of a common policy to add the monitor to     [string]
  --version       Show version number                                  [boolean]
  --help          Show help                                            [boolean]

$ npx newrelic setup \
  https://adobeioruntime.net/api/v1/web/namespace/package/action@v1/_status_check/healthcheck.json \
  component+id@notifications.statuspage.io --group_policy "Delivery"
Creating monitor @adobe/helix-status
Updating locations for monitor @adobe/helix-status
Updating script for monitor @adobe/helix-status
Creating notification channel @adobe/helix-status
Creating alert policy @adobe/helix-status
Linking notification channel to alert policy @adobe/helix-status
Creating condition in alert policy
Verifying group alert policy Delivery
Updating alert policy condition
done.
```

By default, the check will use the `name` from your `package.json`, but you can override it using the `--name` parameter.

`newrelic` requires a New Relic [Admin's API Key](https://docs.newrelic.com/docs/apis/get-started/intro-apis/understand-new-relic-api-keys#admin) (read the docs, it's different from your API key, even when you are an Admin) that should be passed using either the `--auth` parameter or the `NEWRELIC_AUTH` environment variable.

Note: you need to have [Multi-location Synthetics alert conditions](https://rpm.newrelic.com/api/explore/alerts_location_failure_conditions) enabled for your account. More information can be found [here](https://docs.newrelic.com/docs/multi-location-synthetics-alert-conditions).

# Development

## Deploying Helix Status

Deploying Helix Status requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to master that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/status@ci<num>` and tagged with the CI build number.
