/// <reference types="cypress" />

const { initLaunchDarklyApiClient } = require('../../src')

/**
 * @type {Cypress.PluginConfig}
 */
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
