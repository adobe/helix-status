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
let defaultDescription;
let defaultGroup;

try {
  packageJSON = JSON.parse(fs.readFileSync('package.json'));
  if (packageJSON.statuspage) {
    defaultName = packageJSON.statuspage.name || packageJSON.name || undefined;
    defaultDescription = packageJSON.statuspage.description || packageJSON.description || undefined;
    defaultGroup = packageJSON.statuspage.group || undefined;
  } else {
    defaultName = packageJSON.name;
    defaultDescription = packageJSON.description;
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

async function createComponent(auth, pageid, name, description, group) {
  // create component
  const component = {
    name,
    description,
    status,
    only_show_if_degraded: false,
    showcase: true,
  };
  let msg = `Creating component ${name}`;
  if (group) {
    msg += ` in group ${group.name}`;
    component.group_id = group.id;
  }
  logger.log(msg);
  try {
    return await request.post(`https://api.statuspage.io/v1/pages/${pageid}/components`, {
      json: true,
      headers: {
        Authorization: auth,
      },
      body: {
        component,
      },
    });
  } catch (e) {
    logger.error('Component creation failed:', e.message);
    process.exit(1);
  }
  return null;
}

async function updateComponent(auth, pageid, comp, description, group) {
  const component = {};
  if (comp.description !== description) {
    component.description = description;
  }
  if (group && comp.group_id !== group.id) {
    component.group_id = group.id;
  }
  if (Object.keys(component).length > 0) {
    console.log('Updating component', comp.name);
    try {
      return await request.patch(`https://api.statuspage.io/v1/pages/${pageid}/components/${comp.id}`, {
        json: true,
        headers: {
          Authorization: auth,
        },
        body: {
          component,
        },
      });
    } catch (e) {
      console.error('Component update failed:', e);
    }
  }
  return comp;
}

async function updateOrCreateComponent({
  auth, page_id, group, name, description, silent,
}) {
  setLogger(silent);

  let comp;
  const { component, compGroup } = await getComponents(auth, page_id, group, name);
  if (component) {
    logger.log('Reusing existing component', name);
    // update component
    comp = await updateComponent(auth, page_id, component, description, compGroup);
  } else {
    // create component
    comp = await createComponent(auth, page_id, name, description, compGroup);
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
      alias: 'pageId',
      describe: 'Statuspage Page ID (or env $STATUSPAGE_PAGE_ID)',
      required: true,
    })
    .option('name', {
      type: 'string',
      describe: 'The name of the component',
      required: defaultName === undefined,
      default: defaultName,
    })
    .option('description', {
      type: 'string',
      describe: 'The description of the component',
      default: defaultDescription,
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
    .command('setup', 'Create or reuse a Statuspage component', (y) => baseargs(y), updateOrCreateComponent)
    .help()
    .strict()
    .demandCommand(1)
    .env('STATUSPAGE')
    .argv;
}

run();
