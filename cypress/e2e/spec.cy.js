/// <reference path="../../src/globals.d.ts" />
// @ts-check

import '../../commands'

describe('Cypress LaunchDarkly control', () => {
  if (Cypress.isLaunchDarklyControlInitialized()) {
    const featureFlagKey = 'testing-launch-darkly-control-from-cypress'

    it('fetches the feature flag', () => {
      cy.getFeatureFlag(featureFlagKey)
    })

    it('sets the flag for a user')

    it('deletes user target from the flag')

    // SKIP only for showing the error message
    it.skip('shows an error for non-existent feature flag', () => {
      cy.getFeatureFlag('this-flag-does-not-exist')
    })
  } else {
    it('has no LD API')
  }
})
