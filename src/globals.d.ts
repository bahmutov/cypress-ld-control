declare namespace Cypress {
  interface Cypress {
    /**
     * Returns true if the plugins or config file (in Node)
     * has LaunchDarkly API key and project and has configured
     * the LD client.
     * @example if (Cypress.isLaunchDarklyControlInitialized()) { ... }
     */
    isLaunchDarklyControlInitialized(): boolean
  }

  interface Chainable {
    /**
     * Returns information about the given feature flag
     */
    getFeatureFlag(featureFlagKey: string): Chainable<any>
  }
}
