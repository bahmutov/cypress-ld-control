if (!Cypress.isLaunchDarklyControlInitialized) {
  Cypress.isLaunchDarklyControlInitialized =
    function isLaunchDarklyControlInitialized() {
      return Boolean(Cypress.env('haveLaunchDarklyApi'))
    }

  Cypress.Commands.add('getFeatureFlag', (featureFlagKey, projectKey) => {
    if (projectKey) {
      // multiple LD projects
      return cy.task(
        'cypress-ld-control:getFeatureFlag',
        { featureFlagKey, projectKey },
        {
          log: false,
        },
      )
    }

    return cy.task('cypress-ld-control:getFeatureFlag', featureFlagKey, {
      log: false,
    })
  })

  Cypress.Commands.add(
    'setFeatureFlagForUser',
    (featureFlagKey, userId, variationIndex, projectKey) => {
      cy.log(
        `cypress-ld-control: set feature **${projectKey}:${featureFlagKey}** to **${variationIndex}** for user ${userId}`,
      )
      return cy.task(
        'cypress-ld-control:setFeatureFlagForUser',
        { featureFlagKey, userId, variationIndex, projectKey },
        {
          log: false,
        },
      )
    },
  )

  Cypress.Commands.add(
    'removeUserTarget',
    (featureFlagKey, userId, projectKey) => {
      cy.log(
        `cypress-ld-control: remove user target **${projectKey}:${featureFlagKey}** for user ${userId}`,
      )

      return cy.task(
        'cypress-ld-control:removeUserTarget',
        { featureFlagKey, userId, projectKey },
        {
          log: false,
        },
      )
    },
  )
}
