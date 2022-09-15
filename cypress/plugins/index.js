/// <reference types="cypress" />

const { initCypress, initCypressMultipleProjects } = require('../../src')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  // initCypress(on, config)

  // list all the LD projects you want to use
  const projects = [
    {
      projectKey: 'demo-project',
      environment: 'test',
    },
  ]
  initCypressMultipleProjects(projects, on, config)

  // IMPORTANT: return the updated config object
  return config
}
