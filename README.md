# cypress-ld-control ![cypress version](https://img.shields.io/badge/cypress-9.5.1-brightgreen) [![ci](https://github.com/bahmutov/cypress-ld-control/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bahmutov/cypress-ld-control/actions/workflows/ci.yml)

> Set LaunchDarkly feature flags from Cypress tests

## Install

Add this plugin as a dev dependency

```bash
# install using NPM
$ npm i -D cypress-ld-control
# install using Yarn
$ yarn add -D cypress-ld-control
```

## API

This plugin provides the following functions

### getFeatureFlags

### getFeatureFlag

### setFeatureFlagForUser

### removeTarget

### removeUserTarget

## Use without Cypress

You can use this plugin by itself to control LaunchDarkly flags

```js
// https://github.com/bahmutov/cypress-ld-control
const { initLaunchDarklyApiClient } = require('cypress-ld-control')
const ldApi = initLaunchDarklyApiClient({
  projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
  authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
  environment: 'dev', // the name of your environment to use
})
const flag = await ldApi.getFeatureFlag('my-flag-key')
await ldApi.setFeatureFlagForUser({
  featureFlagKey: 'my-flag-key',
  userId: '1234567',
  variationIndex: 0, // index of the variant to use
})
```

See [demo/index.js](./demo/index.js)

## Use from Cypress

Add the plugin to your Cypress plugins file by grabbing an object with tasks.

**Tip:** you might want to check if the environment variables `and` are set and only initialize the tasks in that case.

```js
// cypress/plugins/index.js
const { initLaunchDarklyApiTasks } = require('cypress-ld-control')
module.exports = (on, config) => {
  const tasks = {
    // add your other Cypress tasks if any
  }

  // https://github.com/bahmutov/cypress-ld-control
  if (
    process.env.LAUNCH_DARKLY_PROJECT_KEY &&
    process.env.LAUNCH_DARKLY_AUTH_TOKEN
  ) {
    const ldApiTasks = initLaunchDarklyApiTasks({
      projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
      authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
      environment: 'dev', // the name of your environment to use
    })
    // copy all LaunchDarkly methods as individual tasks
    Object.assign(tasks, ldApiTasks)
  } else {
    console.log('Skipping cypress-ld-control plugin')
  }

  // register all tasks with Cypress
  on('task', tasks)

  // IMPORTANT: return the updated config object
  return config
}
```

Each method from the API (see above) has a matching task prefixed with `cypress-ld-control:` string. For example, to see a particular flag from your spec call:

```js
// you Cypress spec file
cy.task('cypress-ld-control:getFeatureFlag', 'my-flag-key').then(flag => ...)
```

## Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2022

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)
- [Cypress Tips & Tricks Newsletter](https://cypresstips.substack.com/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/cypress-ld-control/issues) on Github

## MIT License

Copyright (c) 2022 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
