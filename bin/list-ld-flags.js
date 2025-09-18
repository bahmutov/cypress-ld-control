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
 * @param {string} projectKey
 * @param {string} environment
 */
function getSaveKey(projectKey, environment) {
  return `${projectKey}//${environment}`
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

    const key = getSaveKey(projectKey, env)
    flagsByProject[key] = flags
    console.error(
      `Found ${flags.length} LaunchDarkly feature flags for project "${projectKey}" environment "${env}"`,
    )
  }
  return flagsByProject
}

/**
 * @param {string} projectKey
 * @param {string} environment
 * @param {Array<any>} oldFlags
 * @param {Array<any>} newFlags
 */
function diffFlags(projectKey, environment, oldFlags, newFlags) {
  const { diffString, diff } = require('json-diff')

  // TODO: handle new flags
  // compare keys one by one
  /**
   * @type {import('../src/index').FlagDifference[]}
   */
  const differences = []
  oldFlags.forEach((flag) => {
    const current = newFlags.find((f) => f.key === flag.key)
    if (!current) {
      console.log(`Flag ${flag.key} was removed`)
      return
    }
    const areEqual = JSON.stringify(current) === JSON.stringify(flag)
    if (areEqual) {
      return
    }
    const str = diffString(current, flag, { color: true })
    if (str) {
      differences.push({
        projectKey,
        environment,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        diff: str,
      })
    }
  })
  return differences
}

collectFlags(projectKeys, environments)
  .then((flagsByProject) => {
    if (args['--diff']) {
      const fs = require('fs')
      const loadedFlags = JSON.parse(fs.readFileSync(args['--diff'], 'utf8'))

      /**
       * @type {import('../src/index').FlagDifference[]}
       */
      const allDifferences = []
      projectKeys.forEach((projectKey, i) => {
        const env = environments[i]
        const saveKey = getSaveKey(projectKey, env)
        if (!loadedFlags[saveKey]) {
          console.error(
            `Could not find saved flags for project "${projectKey}" environment "${env}"`,
          )
          process.exit(1)
        }

        const previousFlags = loadedFlags[saveKey]
        const currentFlags = flagsByProject[saveKey]
        const differences = diffFlags(
          projectKey,
          env,
          previousFlags,
          currentFlags,
        )
        allDifferences.push(...differences)
      })

      if (allDifferences.length) {
        allDifferences.forEach((d) => {
          console.log(
            `\nDifferences for flag ${d.key} "${d.name}":\n${d.description}\n\n${d.diff}\n`,
          )
        })
        if (process.env.GITHUB_ACTIONS) {
          console.log('writing GitHub Actions summary')
          const summary = ghCore.summary
            .addHeading('LD Feature Flag Differences')

            .addRaw(
              `Found ${allDifferences.length} LD feature flag difference(s)`,
              true,
            )
          allDifferences.forEach((d) => {
            summary
              .addSeparator()
              .addTable([
                ['Project', d.projectKey],
                ['Environment', d.environment],
                ['Key', d.key],
                ['Name', d.name],
              ])
              .addRaw(d.description)
              .addBreak()
              .addCodeBlock(d.diff, 'diff')
              .addBreak()
          })
          summary
            .addLink(
              'bahmutov/cypress-ld-control',
              'https://github.com/bahmutov/cypress-ld-control',
            )
            .addBreak()
          summary.write()
        }
      } else {
        console.log('No LD feature flag differences')
        if (process.env.GITHUB_ACTIONS) {
          ghCore.summary
            .addHeading('LD Feature Flag Differences')
            .addRaw('No LD feature flag differences')
            .addBreak()
            .addLink(
              'bahmutov/cypress-ld-control',
              'https://github.com/bahmutov/cypress-ld-control',
            )
            .write()
        }
      }
    } else {
      const str = JSON.stringify(flagsByProject, null, 2)
      console.log(str)
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
