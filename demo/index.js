const { initLaunchDarklyApiClient } = require('..')

const ldApi = initLaunchDarklyApiClient({
  projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
  authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
  environment: 'dev',
})
// ldApi.getFeatureFlag('web-cvv-verification-phase1')
// ldApi.getFeatureFlags()
// ldApi.setFeatureFlagForUser({
//   featureFlagKey: 'testing-launch-darkly-control-from-cypress',
//   userId: '1001',
//   variationIndex: 2,
// })

const featureFlagKey = 'testing-launch-darkly-control-from-cypress'
// ldApi.getFeatureFlag(featureFlagKey)

async function scenario1() {
  // replaces each target
  const userId = '1001'
  await ldApi.setFeatureFlagForUser({
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  await ldApi.setFeatureFlagForUser({
    featureFlagKey,
    userId,
    variationIndex: 1,
  })
  await ldApi.setFeatureFlagForUser({
    featureFlagKey,
    userId,
    variationIndex: 2,
  })
  await ldApi.setFeatureFlagForUser({
    featureFlagKey,
    userId: '2002',
    variationIndex: 2,
  })
  // back user 1001 to variation 0
  await ldApi.setFeatureFlagForUser({
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  await ldApi.getFeatureFlag(featureFlagKey)

  const feature = await ldApi.getFeatureFlag(featureFlagKey)
  console.dir(feature.environments.dev.targets, { depth: null })
}
// scenario1()

// ldApi.removeTarget({
//   featureFlagKey,
//   targetIndex: 0,
// })

// ldApi.removeUserTarget({ featureFlagKey, userId: '1001' })

// ldApi.setFeatureFlagForUser({
//   featureFlagKey,
//   userId: '2002',
//   variationIndex: 2,
// })

ldApi.setFeatureFlagForUser({
  featureFlagKey,
  userId: '156090742',
  variationIndex: 2,
})
