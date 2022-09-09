/// <reference types="cypress" />

describe('Cypress LaunchDarkly control', () => {
  if (Cypress.env('haveLaunchDarklyApi')) {
    const featureFlagKey = 'testing-launch-darkly-control-from-cypress'

    it('fetches the feature flag')

    it('sets the flag for a user')

    it('deletes user target from the flag')
  } else {
    it('has no LD API')
  }
})
