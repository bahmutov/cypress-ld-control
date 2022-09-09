/// <reference types="cypress" />

const { initCypress } = require('../../src')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  initCypress(on, config)

  // IMPORTANT: return the updated config object
  return config
}
