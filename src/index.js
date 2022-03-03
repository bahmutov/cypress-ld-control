const debug = require('debug')('cypress-ld-control')
const got = require('got')

function initLaunchDarklyApiClient(options = {}) {
  const { projectKey, authToken, environment } = options

  const env = environment || 'dev'
  if (!projectKey) {
    throw new Error('LAUNCH_DARKLY_PROJECT_KEY is not set')
  }
  if (!authToken) {
    throw new Error('LAUNCH_DARKLY_AUTH_TOKEN is not set')
  }

  // create a new instance wrapping common options
  // see LaunchDarkly API docs for more info
  // https://apidocs.launchdarkly.com/
  const ldRestApi = got.extend({
    prefixUrl: `https://app.launchdarkly.com/api/v2/flags/${projectKey}`,
    headers: {
      'content-type': 'application/json',
      authorization: authToken,
    },
    searchParams: {
      env,
    },
    retry: {
      // LaunchDarkly API has rate limits, thus we want to retry the requests
      // https://apidocs.launchdarkly.com/#section/Overview/Rate-limiting
      limit: 3,
      methods: ['GET', 'PATCH'],
      statusCodes: [429],
    },
  })

  function print(json) {
    console.dir(json, { depth: null })
    return json
  }

  // high-level methods
  async function getFeatureFlag(featureFlagKey) {
    if (!featureFlagKey) {
      throw new Error('featureFlagKey is required')
    }

    const response = await ldRestApi.get(featureFlagKey)
    const json = JSON.parse(response.body)
    // console.dir(json, { depth: null })
    return json
  }

  async function getFeatureFlags() {
    const response = await ldRestApi.get()
    const json = JSON.parse(response.body)
    console.dir(json, { depth: null })
  }

  async function removeTarget({ featureFlagKey, targetIndex }) {
    console.log(
      'removing target %d for feature %s',
      targetIndex,
      featureFlagKey,
    )

    const removePatch = {
      op: 'remove',
      path: `/environments/${env}/targets/${targetIndex}`,
    }
    console.log(removePatch)
    await ldRestApi.patch(featureFlagKey, {
      body: JSON.stringify([removePatch]),
    })
  }

  async function removeUserTarget({ featureFlagKey, userId }) {
    const featureFlag = await getFeatureFlag(featureFlagKey)
    const targets = featureFlag.environments[env].targets
    const existingUserTargetIndex = targets.findIndex((target) =>
      target.values.includes(userId),
    )
    if (existingUserTargetIndex === -1) {
      // nothing to remove
      return
    }

    const existingUserTarget = targets[existingUserTargetIndex]
    if (existingUserTarget.values.length === 1) {
      // a single user in the target, need to remove the entire target
      console.log('removing the entire target %o', existingUserTarget)
      await removeTarget({
        featureFlagKey,
        targetIndex: existingUserTargetIndex,
      })
      // recursively continue removing the user targets
      // since the same user can have multiple targets
      return removeUserTarget({ featureFlagKey, userId })
    }

    // remove the user from the list of values for the found target
    const userIndex = existingUserTarget.values.indexOf(userId)
    console.log(
      'target %d %o has user %s at index %d',
      existingUserTargetIndex,
      existingUserTarget,
      userId,
      userIndex,
    )
    const removePatch = {
      op: 'remove',
      path: `/environments/${env}/targets/${existingUserTargetIndex}/values/${userIndex}`,
    }
    console.log(removePatch)
    await ldRestApi.patch(featureFlagKey, {
      body: JSON.stringify([removePatch]),
    })
    // recursively continue removing the user targets
    // since the same user can have multiple targets
    return removeUserTarget({ featureFlagKey, userId })
  }

  async function setFeatureFlagForUser({
    featureFlagKey,
    userId,
    variationIndex,
  }) {
    console.log(
      'setting feature flag "%s" for user "%s" to variation %d',
      featureFlagKey,
      userId,
      variationIndex,
    )
    if (!featureFlagKey) {
      throw new Error('featureFlagKey is required')
    }
    if (!userId) {
      throw new Error('userId is required')
    }
    if (isNaN(variationIndex) || variationIndex < 0) {
      throw new Error('variationIndex is required')
    }

    // remove any existing targets for the user
    await ldApi.removeUserTarget({ featureFlagKey, userId })

    // for now assume "dev" environment
    const featureFlag = await getFeatureFlag(featureFlagKey)
    if (!('environments' in featureFlag)) {
      throw new Error(`feature flag ${featureFlagKey} is missing environments`)
    }

    if (!(env in featureFlag.environments)) {
      throw new Error(
        `Cannot find environment "${env}" in feature flag ${featureFlagKey}`,
      )
    }
    if (!Array.isArray(featureFlag.variations)) {
      throw new Error(
        `Cannot find variations in feature flag ${featureFlagKey}`,
      )
    }
    if (variationIndex >= featureFlag.variations.length) {
      throw new Error(
        `Cannot set variation ${variationIndex} for feature flag ${featureFlagKey}`,
      )
    }

    if (!featureFlag.environments[env].targets) {
      throw new Error(
        `Cannot find targets in feature flag ${featureFlagKey} under environment ${env}`,
      )
    }

    const targets = featureFlag.environments[env].targets
    const existingTargetIndex = targets.findIndex(
      (target) => target.variation === variationIndex,
    )
    if (existingTargetIndex === -1) {
      console.log(
        'adding new target for feature flag "%s" variation %d with single user %s',
        featureFlagKey,
        variationIndex,
        userId,
      )
      const jsonPatch = {
        op: 'add',
        path: `/environments/${env}/targets/-`,
        value: {
          variation: variationIndex,
          values: [userId],
        },
      }
      console.log(jsonPatch)
      await ldRestApi.patch(featureFlagKey, {
        body: JSON.stringify([jsonPatch]),
      })
    } else {
      const existingTarget = targets[existingTargetIndex]
      console.log(
        'adding user %s to the existing target %o',
        userId,
        existingTarget,
      )
      const jsonPatch = {
        op: 'add',
        path: `/environments/${env}/targets/${existingTargetIndex}/values/-`,
        value: userId,
      }
      console.log(jsonPatch)
      await ldRestApi.patch(featureFlagKey, {
        body: JSON.stringify([jsonPatch]),
      })
    }
    console.log(
      'added new user %s target for feature flag "%s"',
      userId,
      featureFlagKey,
    )
  }

  const ldApi = {
    getFeatureFlags,
    getFeatureFlag,
    setFeatureFlagForUser,
    removeTarget,
    removeUserTarget,
  }

  return ldApi
}

module.exports = { initLaunchDarklyApiClient }
