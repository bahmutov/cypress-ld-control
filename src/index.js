const debug = require('debug')('cypress-ld-control')
const got = require('got')

function initLaunchDarklyApiClient(options = {}) {
  const { projectKey, authToken, environment } = options
  const env = environment || 'dev'
  debug('creating LD client for project %s environment "%s"', projectKey, env)

  if (!projectKey) {
    throw new Error('LaunchDarkly project key is missing')
  }
  if (!authToken) {
    throw new Error('LaunchDarkly auth token is missing')
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
      limit: 10,
      methods: ['GET', 'PATCH'],
      statusCodes: [429],
    },
  })

  function print(json) {
    console.dir(json, { depth: null })
    return json
  }

  // high-level methods
  // Note: each method should return a value or a null
  // so it can be used as a Cypress task
  async function getFeatureFlag(featureFlagKey) {
    if (!featureFlagKey) {
      throw new Error('featureFlagKey is required')
    }

    try {
      const response = await ldRestApi.get(featureFlagKey)
      const json = JSON.parse(response.body)
      // console.dir(json, { depth: null })
      return json
    } catch (e) {
      console.error(
        'Error fetching feature flag %s in LD project %s environment "%s"',
        featureFlagKey,
        projectKey,
        env,
      )
      console.error(e.message)
      if (e.message.includes('404')) {
        throw new Error(
          `Could not find feature flag ${featureFlagKey} in ${projectKey} environment "${env}"`,
        )
      }
      throw e
    }
  }

  async function getFeatureFlags() {
    const response = await ldRestApi.get()
    const json = JSON.parse(response.body)
    console.dir(json, { depth: null })
    return json
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
    return null
  }

  async function removeUserTarget({ featureFlagKey, userId }) {
    if (typeof featureFlagKey !== 'string') {
      throw new Error('featureFlagKey must be a string')
    }
    if (typeof userId !== 'string') {
      throw new Error('userId must be a string')
    }

    const featureFlag = await getFeatureFlag(featureFlagKey)
    const targets = featureFlag.environments[env].targets
    const existingUserTargetIndex = targets.findIndex((target) =>
      target.values.includes(userId),
    )
    if (existingUserTargetIndex === -1) {
      // nothing to remove
      return null
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
    if (typeof userId !== 'string') {
      throw new Error('userId must be a string')
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
    return null
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

function initLaunchDarklyApiTasks(options) {
  const ldApi = initLaunchDarklyApiClient(options)
  if (!ldApi) {
    throw new Error('failed to init LaunchDarkly API client')
  }

  const tasks = {}
  const namespace = 'cypress-ld-control'

  Object.keys(ldApi).forEach((key) => {
    const taskName = `${namespace}:${key}`
    tasks[taskName] = ldApi[key]
  })

  return tasks
}

function initLaunchDarklyApiTasksMultipleProjects(projects, options) {
  // each LD client is stored by its name
  const ldApiClients = {}

  projects.forEach((project) => {
    const projectKey = project.projectKey
    if (!projectKey) {
      throw new Error('Missing LD project key')
    }

    const projectOptions = {
      ...options,
      projectKey,
      environment: project.environment || 'test',
    }
    const ldApi = initLaunchDarklyApiClient(projectOptions)
    ldApiClients[projectKey] = ldApi
  })

  const tasks = {
    'cypress-ld-control:getFeatureFlag'({ projectKey, featureFlagKey }) {
      if (!projectKey) {
        throw new Error(
          `Missing LD project key when fetching the flag ${featureFlagKey}`,
        )
      }
      const ldApi = ldApiClients[projectKey]
      if (!ldApi) {
        throw new Error(`Cannot find LD project ${projectKey}`)
      }
      return ldApi.getFeatureFlag(featureFlagKey)
    },

    'cypress-ld-control:removeUserTarget'({
      projectKey,
      featureFlagKey,
      userId,
    }) {
      if (!projectKey) {
        throw new Error(
          `Missing LD project key when removing the user target from feature ${featureFlagKey}`,
        )
      }
      const ldApi = ldApiClients[projectKey]
      if (!ldApi) {
        throw new Error(`Cannot find LD project ${projectKey}`)
      }
      return ldApi.removeUserTarget({ featureFlagKey, userId })
    },

    'cypress-ld-control:setFeatureFlagForUser'(options) {
      const { projectKey } = options
      if (!projectKey) {
        throw new Error(
          `Missing LD project key when setting user feature flag ${featureFlagKey}`,
        )
      }
      const ldApi = ldApiClients[projectKey]
      if (!ldApi) {
        throw new Error(`Cannot find LD project ${projectKey}`)
      }
      return ldApi.setFeatureFlagForUser(options)
    },
  }

  return tasks
}

function initCypress(on, config) {
  if (
    process.env.LAUNCH_DARKLY_PROJECT_KEY &&
    process.env.LAUNCH_DARKLY_AUTH_TOKEN
  ) {
    // the name of your environment to use
    const environment =
      'LAUNCH_DARKLY_ENVIRONMENT' in process.env &&
      process.env.LAUNCH_DARKLY_ENVIRONMENT
        ? process.env.LAUNCH_DARKLY_ENVIRONMENT
        : 'test'
    console.log(
      'cypress-ld-control: initializing LD client for environment "%s"',
      environment,
    )
    const options = {
      projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
      authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
      environment,
    }
    const ldApiTasks = initLaunchDarklyApiTasks(options)
    if (!ldApiTasks) {
      throw new Error('failed to init LaunchDarkly tasks')
    }

    // register all tasks with Cypress
    on('task', ldApiTasks)

    // set the flag in the Cypress.env object to let the specs know
    config.env.haveLaunchDarklyApi = true
  } else {
    console.log('Skipping cypress-ld-control plugin')
    config.env.haveLaunchDarklyApi = false
  }

  return config
}

function initCypressMultipleProjects(projects, on, config) {
  if (!Array.isArray(projects)) {
    throw new Error('Missing list of LD projects')
  }
  if (process.env.LAUNCH_DARKLY_AUTH_TOKEN) {
    const names = projects.map((p) => p.projectKey)
    console.log(
      'cypress-ld-control: initializing LD client for %d project(s): %s',
      projects.length,
      names.join(', '),
    )
    const options = {
      authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
    }
    const ldApiTasks = initLaunchDarklyApiTasksMultipleProjects(
      projects,
      options,
    )
    if (!ldApiTasks) {
      throw new Error('failed to init LaunchDarkly tasks')
    }

    // register all tasks with Cypress
    on('task', ldApiTasks)

    // set the flag in the Cypress.env object to let the specs know
    config.env.haveLaunchDarklyApi = true
  } else {
    console.log('Skipping cypress-ld-control plugin')
    config.env.haveLaunchDarklyApi = false
  }

  return config
}

module.exports = {
  initLaunchDarklyApiClient,
  initLaunchDarklyApiTasks,
  initCypress,
  initCypressMultipleProjects,
}
