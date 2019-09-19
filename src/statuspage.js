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
const request = require('request-promise-native');

const status = 'operational';

let logger = console;
let packageJSON = {};
let defaultName;
let defaultGroup;

try {
  packageJSON = JSON.parse(fs.readFileSync('package.json'));
  if (packageJSON.statuspage) {
    defaultName = packageJSON.statuspage.name || packageJSON.name || undefined;
    defaultGroup = packageJSON.statuspage.group || undefined;
  } else {
    defaultName = packageJSON.name;
    defaultGroup = undefined;
  }
} catch (e) {
  defaultName = undefined;
}

function setLogger(silent) {
  function log(...args) {
    if (args.length < 2) {
      return;
    }
    if (args[0] === 'Automation email:' && args[1].indexOf('@') > 0) {
      // only log email in 2nd argument
      console.log(args[1]);
    }
  }
  function ignore() { }
  if (silent) {
    logger = {
      log,
      debug: ignore,
      warn: ignore,
      error: ignore,
      trace: ignore,
      info: ignore,
    };
  } else {
    logger = console;
  }
}

async function getComponents(auth, pageid, group, name) {
  try {
    const loadedcomponents = await request.get(`https://api.statuspage.io/v1/pages/${pageid}/components`, {
      headers: {
        Authorization: auth,
      },
      json: true,
    });

    const result = {};
    [result.component] = loadedcomponents.filter((comp) => comp.name === name);

    if (group) {
      // look for the group component
      [result.compGroup] = loadedcomponents.filter((comp) => comp.group && comp.name === group);
    }
    return result;
  } catch (e) {
    logger.error('Unable to retrieve components:', e.message);
    return {};
  }
}

async function createComponent({
  auth, page_id, group, name, silent,
}) {
  setLogger(silent);

  let comp;
  const { component, compGroup } = await getComponents(auth, page_id, group, name);
  if (component) {
    logger.warn(`Component "${name}" already exists`);
    comp = component;
  } else {
    if (group && compGroup === undefined) {
      logger.error(`Component group "${group}" not found`);
      process.exit(1);
    }
    // create component
    const body = {
      component: {
        name,
        status,
        only_show_if_degraded: false,
        showcase: true,
        description: '',
      },
    };
    let msg = `Creating new component ${name}`;
    if (group) {
      msg += ` in group ${group}`;
      body.component.group_id = compGroup.id;
    }
    logger.log(msg);
    try {
      comp = await request.post(`https://api.statuspage.io/v1/pages/${page_id}/components`, {
        json: true,
        headers: {
          Authorization: auth,
        },
        body,
      });
    } catch (e) {
      logger.error('Component creation failed:', e.message);
      process.exit(1);
    }
  }
  if (comp) {
    logger.log('Automation email:', comp.automation_email);
  }
  logger.log('done.');
}

function baseargs(y) {
  return y
    .option('auth', {
      type: 'string',
      describe: 'Statuspage API Key (or env $STATUSPAGE_AUTH)',
      required: true,
    })
    .option('page_id', {
      type: 'string',
      describe: 'Statuspage Page ID (or env $STATUSPGAGE_PAGE_ID)',
      required: true,
    })
    .option('name', {
      type: 'string',
      describe: 'The name of the component',
      required: defaultName === undefined,
      default: defaultName,
    })
    .option('group', {
      type: 'string',
      describe: 'The name of an existing component group',
      required: false,
      default: defaultGroup,
    })
    .option('silent', {
      type: 'boolean',
      describe: 'Reduce output to automation email only',
      required: false,
      default: false,
    });
}

function run() {
  return yargs
    .scriptName('statuspage')
    .usage('$0 <cmd>')
    .command('create', 'Create a new Statuspage component', (y) => baseargs(y), createComponent)
    .help()
    .strict()
    .demandCommand(1)
    .env('STATUSPAGE')
    .argv;
}

run();
