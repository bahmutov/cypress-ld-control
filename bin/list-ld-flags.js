#!/usr/bin/env node

const arg = require('arg')

const args = arg({
  '--project': String,
  '--environment': String,
  // the filename of a JSON file with previous LD flags
  '--diff': String,
  // aliases
  '-p': '--project',
  '-e': '--environment',
  '-d': '--diff',
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
    if (args['--diff']) {
      const { diffString } = require('json-diff')
      const fs = require('fs')
      const previous = JSON.parse(fs.readFileSync(args['--diff'], 'utf8'))

      // TODO: handle new flags
      // compare keys one by one
      const differences = []
      previous.forEach((flag) => {
        const current = flags.find((f) => f.key === flag.key)
        if (!current) {
          console.log(`Flag ${flag.key} was removed`)
          return
        }
        const str = diffString(previous, flags, { color: true })
        if (str) {
          differences.push({
            key: flag.key,
            diff: str,
          })
        }
      })
      if (differences.length) {
        differences.forEach((d) => {
          console.log(`\nDifferences for flag ${d.key}:\n${d.diff}\n`)
        })
        process.exit(1)
      } else {
        console.log('No differences')
      }
    } else {
      const str = JSON.stringify(flags, null, 2)
      console.log(str)
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
