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

/* eslint-disable no-console */
/* eslint-disable camelcase */

const yargs = require('yargs');
const fs = require('fs');
const request = require('request-promise-native');

const status = 'operational';

let packageName;

try {
  packageName = JSON.parse(fs.readFileSync('package.json')).name;
} catch (e) {
  packageName = undefined;
}

async function getComponents(auth, pageid, groupid, name) {
  console.log(auth, pageid, groupid, name);
  try {
    const loadedcomponents = await request.get(`https://api.statuspage.io/v1/pages/${pageid}/components`, {
      headers: {
        Authorization: auth,
      },
      json: true,
    });

    const result = {};
    const cfilter = loadedcomponents.filter((comp) => {
      if (comp.name === name) {
        if (groupid && groupid !== comp.group_id) {
          // wrong group, no match
          return false;
        }
        return true;
      } else {
        return false;
      }
    });
    result.component = cfilter.length > 0 ? cfilter[0] : undefined;

    if (groupid) {
      // look for the group component
      const gfilter = loadedcomponents.filter((comp) => comp.group && comp.id === groupid);
      result.group = gfilter.length > 0 ? gfilter[0] : undefined;
    }
    return result;
  } catch (e) {
    console.error('Unable to retrieve components', e.message);
    return {};
  }
}

async function createComponent({
  auth, page_id, group_id, name,
}) {
  let comp;
  const { component, group } = await getComponents(auth, page_id, group_id, name);
  if (component) {
    console.warn(`Component "${name}" already exists`);
    comp = component;
  } else {
    if (group_id && group === undefined) {
      console.error(`Component group "${group_id}" not found`);
      process.exit(1);
    }
    // create component
    let msg = `Creating a new component ${name}`;
    if (group) {
      msg += ` in group ${group.name}`;
    }
    console.log(msg);
    try {
      comp = await request.post(`https://api.statuspage.io/v1/pages/${page_id}/components`, {
        json: true,
        headers: {
          Authorization: auth,
        },
        body: {
          component: {
            name,
            group_id,
            status,
            only_show_if_degraded: false,
            showcase: true,
            description: '',
          },
        },
      });
    } catch (e) {
      console.error('Component creation failed', e.message);
      process.exit(1);
    }
    console.log('Automation email:', comp.automation_email);
  }
  console.log('done.');
}

function baseargs(y) {
  return y
    .positional('page_id', {
      type: 'string',
      describe: 'The ID of the page to add the component to',
      required: true,
    })
    .option('auth', {
      type: 'string',
      describe: 'your Statuspage API Key (alternatively use $STATUSPAGE_AUTH env var)',
      required: true,
    })
    .option('page_id', {
      type: 'string',
      describe: 'the ID of the page to add the component to',
      required: true,
    })
    .option('name', {
      type: 'string',
      describe: 'the name of the component (defaults to package name)',
      required: packageName === undefined,
      default: packageName,
    })
    .option('group_id', {
      type: 'string',
      describe: 'the ID of an existing component group',
      required: false,
    });
}

function run() {
  return yargs
    .scriptName('statuspage')
    .usage('$0 <cmd>')
    .command('create', 'Create a new component', (y) => baseargs(y), createComponent)
    .help()
    .strict()
    .demandCommand(1)
    .env('STATUSPAGE')
    .argv;
}

run();
