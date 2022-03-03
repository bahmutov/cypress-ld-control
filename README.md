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

Add the plugin to your Cypress plugins file. You might want to check if the environment variables `and` are set

```js
// cypress/plugins/index.js
const { initLaunchDarklyApiClient } = require('cypress-ld-control')
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  // TODO init LaunchDarkly API client and mock network calls to test it

  const tasks = {
    // add your other Cypress tasks if any
  }

  // https://github.com/bahmutov/cypress-ld-control
  if (
    process.env.LAUNCH_DARKLY_PROJECT_KEY &&
    process.env.LAUNCH_DARKLY_AUTH_TOKEN
  ) {
    const ldApi = initLaunchDarklyApiClient({
      projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
      authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
      environment: 'dev', // the name of your environment to use
    })
    // copy all LaunchDarkly methods as individual tasks
    Object.assign(tasks, ldApi)
  } else {
    console.log('Skipping cypress-ld-control plugin')
  }

  // register all tasks with Cypress
  on('task', tasks)

  // IMPORTANT: return the updated config object
  return config
}
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
