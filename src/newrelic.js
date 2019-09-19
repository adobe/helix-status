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
const path = require('path');
const request = require('request-promise-native');

const frequency = 15;
const status = 'ENABLED';
const slaThreshold = 7;
const locations = ['AWS_AP_NORTHEAST_1',
  'AWS_AP_NORTHEAST_2',
  'AWS_AP_SOUTH_1',
  'AWS_AP_SOUTHEAST_1',
  'AWS_AP_SOUTHEAST_2',
  'AWS_CA_CENTRAL_1',
  'AWS_EU_CENTRAL_1',
  'AWS_EU_WEST_1',
  'AWS_EU_WEST_2',
  'AWS_EU_WEST_3',
  'AWS_SA_EAST_1',
  'AWS_US_EAST_1',
  'AWS_US_EAST_2',
  'AWS_US_WEST_1',
  'AWS_US_WEST_2'];
const monitorType = 'SCRIPT_API';
const channelType = 'email';
const incidentPreference = 'PER_POLICY';
const conditionName = 'Multiple location failures';

let packageName;

try {
  packageName = JSON.parse(fs.readFileSync('package.json')).name;
} catch (e) {
  packageName = undefined;
}


async function getMonitors(auth, monitorid, monitorname) {
  try {
    let more = true;
    const loadedmonitors = [];
    while (more) {
      // eslint-disable-next-line no-await-in-loop
      const response = await request.get(`https://synthetics.newrelic.com/synthetics/api/v3/monitors?limit=100&offset=${loadedmonitors.length}`, {
        headers: {
          'X-Api-Key': auth,
        },
        json: true,
      });
      if (response.count < 10) {
        more = false;
      }
      loadedmonitors.push(...response.monitors);
    }

    const monitors = loadedmonitors.map(({ id, name }) => ({ id, name }));
    if (monitorid) {
      return monitors.filter((monitor) => monitor.id === monitorid);
    }
    if (monitorname) {
      return monitors.filter((monitor) => monitor.name === monitorname);
    } else {
      return [];
    }
  } catch (e) {
    console.error('Unable to retrieve monitors:', e.message);
    return [];
  }
}

async function updateScript(auth, monitor, url) {
  console.log('Updating script for monitor', monitor.name);

  const scriptText = Buffer.from(fs
    .readFileSync(path.resolve(__dirname, 'synthetics.js'))
    .toString()
    .replace('$$$URL$$$', url))
    .toString('base64');

  await request.put(`https://synthetics.newrelic.com/synthetics/api/v3/monitors/${monitor.id}/script`, {
    json: true,
    headers: {
      'X-Api-Key': auth,
    },
    body: {
      scriptText,
    },
  });
}

async function updateOrCreateMonitor(auth, name, monitorId, url) {
  const [monitor] = await getMonitors(auth, monitorId, name);

  if (monitor) {
    // update
    await updateScript(auth, monitor, url);
  } else {
    // create
    console.log('Creating new monitor', name);
    try {
      await request.post('https://synthetics.newrelic.com/synthetics/api/v3/monitors', {
        json: true,
        headers: {
          'X-Api-Key': auth,
        },
        body: {
          name,
          type: monitorType,
          frequency,
          locations,
          status,
          slaThreshold,
        },
      });
      return await updateOrCreateMonitor(auth, name, monitorId, url);
    } catch (e) {
      console.error('Monitor creation failed:', e.message);
      process.exit(1);
    }
  }
  return monitor.id;
}

async function getChannels(auth, channelName, email) {
  try {
    const response = await request.get('https://api.newrelic.com/v2/alerts_channels.json', {
      headers: {
        'X-Api-Key': auth,
      },
      json: true,
    });
    return response.channels.filter((channel) => channel.type === channelType
        && channel.name === channelName
        && channel.configuration.recipients === email);
  } catch (e) {
    console.error('Unable to retrieve channels:', e.message);
    return [];
  }
}

async function createChannel(auth, name, email) {
  let [channel] = await getChannels(auth, name, email);

  if (channel) {
    console.log(`Reusing notification channel ${channel.name}`);
  } else {
    console.log('Creating new notification channel', email);

    try {
      const response = await request.post('https://api.newrelic.com/v2/alerts_channels.json', {
        json: true,
        headers: {
          'X-Api-Key': auth,
        },
        body: {
          channel: {
            name,
            type: channelType,
            configuration: {
              recipients: email,
              include_json_attachment: false,
            },
          },
        },
      });
      [channel] = response.channels;
    } catch (e) {
      console.error('Notification channel creation failed:', e.message);
      process.exit(1);
    }
  }
  return channel ? channel.id : null;
}

async function getPolicies(auth, policyId, policyName) {
  try {
    const response = await request.get('https://api.newrelic.com/v2/alerts_policies.json', {
      headers: {
        'X-Api-Key': auth,
      },
      json: true,
    });

    const policies = response.policies.map(({ id, name }) => ({ id, name }));
    if (policyId) {
      return policies.filter((policy) => policy.id === policyId);
    }
    if (policyName) {
      return policies.filter((policy) => policy.name === policyName);
    } else {
      return [];
    }
  } catch (e) {
    console.error('Unable to retrieve alert policies:', e.message);
    return [];
  }
}

async function updatePolicy(auth, policy, monitorId, channelId) {
  console.log('Updating alert policy', policy.name);

  // TODO: remove existing notification channels
  // add notification channel
  try {
    await request.put('https://api.newrelic.com/v2/alerts_policy_channels.json', {
      headers: {
        'X-Api-Key': auth,
      },
      form: {
        channel_ids: channelId,
        policy_id: policy.id,
      },
    });
  } catch (e) {
    console.error('Unable to add notification channel to alert policy', e.message);
  }
  // TODO: remove existing conditions
  // add synthetics condition
  try {
    await request.post(`https://api.newrelic.com/v2/alerts_synthetics_conditions/policies/${policy.id}.json`, {
      json: true,
      headers: {
        'X-Api-Key': auth,
      },
      body: {
        synthetics_condition: {
          name: conditionName,
          monitor_id: monitorId,
          enabled: true,
        },
      },
    });
    // TODO: specify condition type (multiple) and threshold (2)
  } catch (e) {
    console.error('Unable to add condition to alert policy', e.message);
  }
}

async function updateOrCreatePolicy(auth, name, policyId, monitorId, channelId) {
  let [policy] = await getPolicies(auth, policyId, name);

  if (policy) {
    // update
    await updatePolicy(auth, policy, monitorId, channelId);
  } else {
    // create
    console.log('Creating new alert policy', name);
    try {
      policy = await request.post('https://api.newrelic.com/v2/alerts_policies.json', {
        json: true,
        headers: {
          'X-Api-Key': auth,
        },
        body: {
          policy: {
            name,
            incident_preference: incidentPreference,
          },
        },
      });
      await updateOrCreatePolicy(auth, name, policy.id, monitorId, channelId);
    } catch (e) {
      console.error('Alert policy creation failed:', e.message);
      process.exit(1);
    }
  }
}

async function updateOrCreate({
  auth, name, url, email, monitor_id, policy_id,
}) {
  const monitorId = await updateOrCreateMonitor(auth, name, monitor_id, url);
  const channelId = email ? await createChannel(auth, name, email) : null;
  await updateOrCreatePolicy(auth, name, policy_id, monitorId, channelId);

  console.log('done.');
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
      describe: 'New Relic API Key (or env var $NEWRELIC_AUTH)',
      required: true,
    })
    .option('name', {
      type: 'string',
      describe: 'The name of the monitor and alert policy',
      required: packageName === undefined,
      default: packageName,
    });
}

function run() {
  return yargs
    .scriptName('newrelic')
    .usage('$0 <cmd> url email')
    .command('create url email', 'Create a new New Relic setup', (y) => baseargs(y), updateOrCreate)
    .command('update url email', 'Update an existing New Relic setup', (y) => baseargs(y)
      .option('monitor_id', {
        type: 'string',
        describe: 'The ID of the monitor to update',
      })
      .option('policy_id', {
        type: 'string',
        describe: 'The ID of the alert policy to update',
      }), updateOrCreate)
    .help()
    .strict()
    .demandCommand(1)
    .env('NEWRELIC')
    .argv;
}

run();
