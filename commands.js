if (!Cypress.isLaunchDarklyControlInitialized) {
  Cypress.isLaunchDarklyControlInitialized =
    function isLaunchDarklyControlInitialized() {
      return Boolean(Cypress.env('haveLaunchDarklyApi'))
    }
}
