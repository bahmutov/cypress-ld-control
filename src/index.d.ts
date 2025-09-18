/// <reference types="cypress" />

import './globals'

/**
 * Initializes a single LD client using `LAUNCH_DARKLY_PROJECT_KEY`
 * and `LAUNCH_DARKLY_AUTH_TOKEN` environment variables, plus
 * optional `LAUNCH_DARKLY_ENVIRONMENT`. Registers Cypress tasks.
 */
export function initCypress(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Cypress.PluginConfigOptions

interface LaunchDarklyProject {
  projectKey: string
  environment: string
}

/**
 * Creates a separate LaunchDarkly API client for each project
 * specified in the `projects` array. Grabs the LD API auth token
 * from the environment variable `LAUNCH_DARKLY_AUTH_TOKEN`.
 */
export function initCypressMultipleProjects(
  projects: LaunchDarklyProject[],
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Cypress.PluginConfigOptions

export type FlagDifference = {
  projectKey: string
  environment: string
  key: string
  name: string
  description: string
  diff: string
}
