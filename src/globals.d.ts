/// <reference types="cypress" />

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
    getFeatureFlag(featureFlagKey: string, projectKey?: string): Chainable<any>

    /**
     * Sets the feature flag value for the given user.
     */
    setFeatureFlagForUser(
      featureFlagKey: string,
      userId: string,
      variationIndex: number,
    ): Chainable<any>

    /**
     * Removes the custom user target for the given feature flag.
     */
    removeUserTarget(featureFlagKey: string, userId: string): Chainable<void>
  }
}
