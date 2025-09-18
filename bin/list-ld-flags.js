#!/usr/bin/env node

// @ts-check
const arg = require('arg')
const ghCore = require('@actions/core')
const debug = require('debug')('cypress-ld-control')

// @ts-ignore
const { initLaunchDarklyApiClient } = require('../src')

const args = arg({
  // could be multiple projects, comma separated
  '--project': String,
  // name for each project, comma separated
  '--environment': String,
  // the filename of a JSON file with previous LD flags
  '--diff': String,
  // aliases
  '-p': '--project',
  '-e': '--environment',
  '-d': '--diff',
})
debug(args)

const projectKeys =
  (args['--project'] || process.env.LAUNCH_DARKLY_PROJECT_KEY)?.split(',') || []
if (!projectKeys.length) {
  console.error(
    'Missing --project argument or LAUNCH_DARKLY_PROJECT_KEY env variable',
  )
  process.exit(1)
}

const environments = (args['--environment'] || 'test').split(',')
if (environments.length !== projectKeys.length) {
  console.error(
    `Expected ${projectKeys.length} environments but got ${environments.length}`,
  )
  process.exit(1)
}
if (!environments.length) {
  console.error('Missing --environment argument')
  process.exit(1)
}
console.error(
  `Listing all flags for "${projectKeys}" environments "${environments}"`,
)

/**
 * @param {string} projectKey
 * @param {string} environment
 */
async function getLdFlagsForProject(projectKey, environment) {
  debug(`Getting LD flags for project "${projectKey}" env "${environment}"`)

  const ldApi = initLaunchDarklyApiClient({
    projectKey,
    authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
    environment,
  })
  const json = await ldApi.getFeatureFlags()
  const flags = json.items
  // only return the most important information about each flag
  const cleaned = flags.map((flag) => {
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
  })
  return cleaned
}

/**
 * @param {string[]} projectKeys
 * @param {string[]} environments
 */
async function collectFlags(projectKeys, environments) {
  const flagsByProject = {}
  for (let i = 0; i < projectKeys.length; i += 1) {
    const projectKey = projectKeys[i]
    const env = environments[i]
    const flags = await getLdFlagsForProject(projectKey, env)

    const key = `${projectKey}//${env}`
    flagsByProject[key] = flags
    console.error(
      `Found ${flags.length} LaunchDarkly feature flags for project "${projectKey}" environment "${env}"`,
    )
  }
  return flagsByProject
}

collectFlags(projectKeys, environments)
  .then((flagsByProject) => {
    if (args['--diff']) {
      //         const { diffString } = require('json-diff')
      //         const fs = require('fs')
      //         const previous = JSON.parse(fs.readFileSync(args['--diff'], 'utf8'))
      //         // TODO: handle new flags
      //         // compare keys one by one
      //         const differences = []
      //         previous.forEach((flag) => {
      //           const current = flags.find((f) => f.key === flag.key)
      //           if (!current) {
      //             console.log(`Flag ${flag.key} was removed`)
      //             return
      //           }
      //           const areEqual = JSON.stringify(current) === JSON.stringify(flag)
      //           if (areEqual) {
      //             return
      //           }
      //           const str = diffString(current, flag, { color: true })
      //           if (str) {
      //             differences.push({
      //               key: flag.key,
      //               name: flag.name,
      //               description: flag.description,
      //               diff: str,
      //             })
      //           }
      //         })
      //         if (differences.length) {
      //           differences.forEach((d) => {
      //             console.log(
      //               `\nDifferences for flag ${d.key} "${d.name}":\n${d.description}\n\n${d.diff}\n`,
      //             )
      //           })
      //           if (process.env.GITHUB_ACTIONS) {
      //             console.log('writing GitHub Actions summary')
      //             const summary = ghCore.summary
      //               .addHeading('LD Feature Flag Differences')
      //               .addLink(
      //                 'bahmutov/cypress-ld-control',
      //                 'https://github.com/bahmutov/cypress-ld-control',
      //               )
      //               .addBreak()
      //               .addRaw(
      //                 `Found ${differences.length} LD feature flag difference(s)`,
      //                 true,
      //               )
      //             differences.forEach((d) => {
      //               summary
      //                 .addHeading(d.key, 3)
      //                 .addRaw(d.name)
      //                 .addBreak()
      //                 .addRaw(d.description)
      //                 .addBreak()
      //                 .addCodeBlock(d.diff, 'diff')
      //                 .addBreak()
      //             })
      //             summary.write()
      //           }
      //         } else {
      //           console.log('No LD feature flag differences')
      //           if (process.env.GITHUB_ACTIONS) {
      //             ghCore.summary
      //               .addHeading('LD Feature Flag Differences')
      //               .addLink(
      //                 'bahmutov/cypress-ld-control',
      //                 'https://github.com/bahmutov/cypress-ld-control',
      //               )
      //               .addRaw('No LD feature flag differences')
      //               .write()
      //           }
      //         }
    } else {
      const str = JSON.stringify(flagsByProject, null, 2)
      console.log(str)
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
