const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const got = require('got')

// a local stand-in for the LaunchDarkly "List feature flags" endpoint
// API version 20240415 returns 20 flags per page by default, at most 100,
// and a new access token uses version 20240415 when a request has no header
// https://launchdarkly.com/docs/guides/api/api-migration-guide
const projects = {
  demo: Array.from({ length: 250 }, (_, i) => ({ key: `flag-${i}` })),
  empty: [],
}
let requests = []

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  requests.push({ url, version: req.headers['ld-api-version'] })
  const version = req.headers['ld-api-version'] || '20240415'
  const flags = projects[url.pathname.split('/').filter(Boolean).pop()]
  if (!flags) {
    res.statusCode = 404
    return res.end()
  }
  let items = flags
  if (version === '20240415') {
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100)
    const offset = Number(url.searchParams.get('offset') || 0)
    items = flags.slice(offset, offset + limit)
  }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ items, totalCount: flags.length }))
})

let initLaunchDarklyApiClient

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  // send the plugin's requests to the local server
  const extend = got.extend
  got.extend = (options) =>
    extend({
      ...options,
      prefixUrl: options.prefixUrl.replace(
        'https://app.launchdarkly.com',
        base,
      ),
    })
  initLaunchDarklyApiClient = require('../src').initLaunchDarklyApiClient
})

after(() => server.close())

test('getFeatureFlags returns every flag, not only the first page', async () => {
  requests = []
  const ldApi = initLaunchDarklyApiClient({
    projectKey: 'demo',
    authToken: 'test-token',
    environment: 'test',
  })
  const json = await ldApi.getFeatureFlags()
  assert.equal(json.totalCount, 250)
  assert.deepEqual(json.items, projects.demo)
  for (const { url, version } of requests) {
    assert.equal(version, '20240415')
    assert.equal(url.searchParams.get('env'), 'test')
  }
})

test('getFeatureFlags returns no flags for an empty project', async () => {
  requests = []
  const ldApi = initLaunchDarklyApiClient({
    projectKey: 'empty',
    authToken: 'test-token',
  })
  const json = await ldApi.getFeatureFlags()
  assert.deepEqual(json.items, [])
  assert.equal(requests.length, 1)
})
