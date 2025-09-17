#!/usr/bin/env node

const arg = require('arg')

const args = arg({
  '--project': String,
  '--environment': String,
  // aliases
  '-p': '--project',
  '-e': '--environment',
})

const projectKey = args['--project'] || process.env.LAUNCH_DARKLY_PROJECT_KEY
if (!projectKey) {
  console.error(
    'Missing --project argument or LAUNCH_DARKLY_PROJECT_KEY env variable',
  )
  process.exit(1)
}

const environment = args['--environment'] || 'test'
console.error(
  `Listing all flags for "${projectKey}" environment "${environment}"`,
)

// @ts-ignore
const { initLaunchDarklyApiClient } = require('../src')
const ldApi = initLaunchDarklyApiClient({
  projectKey,
  authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
  environment,
})
ldApi
  .getFeatureFlags()
  .then((json) => json.items)
  // only return the most important information about each flag
  .then((flags) =>
    flags.map((flag) => {
      return {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        kind: flag.kind,
        deprecated: flag.deprecated,
        archived: flag.archived,
        temporary: flag.temporary,
        defaults: flag.defaults,
        variations: flag.variations,
        environment: flag.environments?.[environment]?._summary,
      }
    }),
  )
  .then((flags) => {
    const str = JSON.stringify(flags, null, 2)
    console.log(str)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
