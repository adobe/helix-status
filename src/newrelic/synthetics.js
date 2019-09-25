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

const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');

const MONITOR_FREQUENCY = 15;
const MONITOR_STATUS = 'ENABLED';
const MONITOR_THRESHOLD = 7;
const MONITOR_LOCATIONS = [
  'AWS_AP_NORTHEAST_1',
  'AWS_AP_SOUTHEAST_2',
  'AWS_EU_CENTRAL_1',
  'AWS_EU_WEST_2',
  'AWS_SA_EAST_1',
  'AWS_US_EAST_1',
  'AWS_US_WEST_1',
];
const MONITOR_TYPE = 'SCRIPT_API';

/* eslint-disable no-console */

async function getMonitors(auth, monitorname) {
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

async function updateMonitor(auth, monitor, url) {
  console.log('Updating locations for monitor', monitor.name);
  try {
    await request.patch(`https://synthetics.newrelic.com/synthetics/api/v3/monitors/${monitor.id}`, {
      json: true,
      headers: {
        'X-Api-Key': auth,
      },
      body: {
        locations: MONITOR_LOCATIONS,
      },
    });
  } catch (e) {
    console.error('Unable to update locations for monitor:', e.message);
  }

  console.log('Updating script for monitor', monitor.name);

  const scriptText = Buffer.from(fs
    .readFileSync(path.resolve(__dirname, 'monitor_script.js'))
    .toString()
    .replace('$$$URL$$$', url))
    .toString('base64');
  try {
    await request.put(`https://synthetics.newrelic.com/synthetics/api/v3/monitors/${monitor.id}/script`, {
      json: true,
      headers: {
        'X-Api-Key': auth,
      },
      body: {
        scriptText,
      },
    });
  } catch (e) {
    console.error('Unable to update script for monitor:', e.message);
  }
}

async function updateOrCreateMonitor(auth, name, url) {
  const [monitor] = await getMonitors(auth, name);

  if (monitor) {
    // update
    await updateMonitor(auth, monitor, url);
  } else {
    // create
    console.log('Creating monitor', name);
    try {
      await request.post('https://synthetics.newrelic.com/synthetics/api/v3/monitors', {
        json: true,
        headers: {
          'X-Api-Key': auth,
        },
        body: {
          name,
          type: MONITOR_TYPE,
          frequency: MONITOR_FREQUENCY,
          locations: MONITOR_LOCATIONS,
          status: MONITOR_STATUS,
          slaThreshold: MONITOR_THRESHOLD,
        },
      });
      return await updateOrCreateMonitor(auth, name, url);
    } catch (e) {
      console.error('Monitor creation failed:', e.message);
      process.exit(1);
    }
  }
  return monitor.id;
}

module.exports = {
  updateOrCreateMonitor,
};
