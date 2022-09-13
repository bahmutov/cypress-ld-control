if (!Cypress.isLaunchDarklyControlInitialized) {
  Cypress.isLaunchDarklyControlInitialized =
    function isLaunchDarklyControlInitialized() {
      return Boolean(Cypress.env('haveLaunchDarklyApi'))
    }

  Cypress.Commands.add('getFeatureFlag', (featureFlagKey) => {
    return cy.task('cypress-ld-control:getFeatureFlag', featureFlagKey, {
      log: false,
    })
  })

  Cypress.Commands.add(
    'setFeatureFlagForUser',
    (featureFlagKey, userId, variationIndex) => {
      return cy.task(
        'cypress-ld-control:setFeatureFlagForUser',
        { featureFlagKey, userId, variationIndex },
        {
          log: false,
        },
      )
    },
  )

  Cypress.Commands.add('removeUserTarget', (featureFlagKey, userId) => {
    return cy.task(
      'cypress-ld-control:removeUserTarget',
      { featureFlagKey, userId },
      {
        log: false,
      },
    )
  })
}