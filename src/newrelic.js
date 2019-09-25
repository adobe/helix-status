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

/* eslint-disable no-console, camelcase */

const yargs = require('yargs');
const fs = require('fs');
const { updateOrCreateMonitor } = require('./newrelic/synthetics.js');
const { updateOrCreatePolicies, reuseOrCreateChannel } = require('./newrelic/alerts.js');

const config = {};
let packageJSON = {};

// load config
try {
  packageJSON = JSON.parse(fs.readFileSync('package.json'));
  if (packageJSON.newrelic) {
    config.packageName = packageJSON.newrelic.name || packageJSON.name || undefined;
    config.groupPolicy = packageJSON.newrelic.group_policy;
  } else {
    config.packageName = packageJSON.name;
  }
} catch (e) {
  config.packageName = undefined;
}

function baseargs(y) {
  return y
    .positional('url', {
      type: 'string',
      describe: 'The URL to check',
      required: true,
    })
    .positional('email', {
      type: 'string',
      describe: 'The email address to send alerts to',
      required: true,
    })
    .option('auth', {
      type: 'string',
      describe: 'Admin API Key (or env var $NEWRELIC_AUTH)',
      required: true,
    })
    .option('name', {
      type: 'string',
      describe: 'The name of the monitor, channel and policy',
      required: config.packageName === undefined,
      default: config.packageName,
    })
    .option('group_policy', {
      type: 'string',
      describe: 'The name of a common policy to add the monitor to',
      default: config.groupPolicy,
      required: false,
    });
}

function run() {
  return yargs
    .scriptName('newrelic')
    .usage('$0 <cmd>')
    .command('setup url email', 'Create or update a New Relic setup', (y) => baseargs(y), async ({
      auth, name, url, email, group_policy,
    }) => {
      await updateOrCreatePolicies(auth, name, group_policy,
        await updateOrCreateMonitor(auth, name, url),
        email ? await reuseOrCreateChannel(auth, name, email) : null);
      console.log('done.');
    })
    .help()
    .strict()
    .demandCommand(1)
    .env('NEWRELIC')
    .argv;
}

run();
