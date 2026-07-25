import { createHash } from 'node:crypto'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

const options = parseArguments(process.argv.slice(2))

if (options.help) {
  printHelp()
  process.exit(0)
}

const target = normalizeOrigin(requiredOption('target'))
const base = normalizeBase(options.base || '/')
const canonical = normalizeOrigin(options.canonical || target)
const retries = positiveInteger(options.retries || '1', 'retries')
const delayMs = positiveInteger(options['delay-ms'] || '3000', 'delay-ms')
const expectedIndexSha = optionalString(options['expected-index-sha'], 'expected-index-sha')
const expectAgentsNoindex = optionalBoolean(options['expect-agents-noindex'])
const expectAgentsSitemap = optionalBoolean(options['expect-agents-sitemap'])
const checkRedirects = options['check-redirects'] === true

if (expectedIndexSha && !/^[a-f0-9]{64}$/i.test(expectedIndexSha)) {
  throw new Error('--expected-index-sha must be a SHA-256 hex digest')
}

let lastError

for (let attempt = 1; attempt <= retries; attempt += 1) {
  try {
    const result = await verify(attempt)
    console.log(
      `Deployment verification passed: ${result.pages} pages, ${result.assetPath}, sitemap, robots${checkRedirects ? ' and redirects' : ''}.`
    )
    process.exit(0)
  } catch (error) {
    lastError = error
    if (attempt === retries) break
    console.warn(`Verification attempt ${attempt}/${retries} failed: ${error.message}`)
    await delay(delayMs)
  }
}

throw lastError

async function verify(attempt) {
  const homepageUrl = deploymentUrl('')
  const homepage = await fetchResource(cacheBusted(homepageUrl, attempt))
  assert(homepage.response.status === 200, `homepage returned HTTP ${homepage.response.status}`)
  assert(homepage.text.includes('程序员小枫同学'), 'homepage brand text is missing')

  if (expectedIndexSha) {
    const actualSha = createHash('sha256').update(homepage.bytes).digest('hex')
    assert(actualSha === expectedIndexSha, `homepage SHA-256 is ${actualSha}, expected ${expectedIndexSha}`)
  }

  const canonicalHref = findElementAttribute(homepage.text, 'link', 'rel', 'canonical', 'href')
  assert(canonicalHref === `${canonical}/`, `homepage canonical is ${canonicalHref || '(missing)'}`)

  const assetPath = homepage.text.match(/(?:src|href)="([^"]*\/assets\/[^"]+\.(?:css|js))"/)?.[1]
  assert(assetPath, 'homepage does not reference a CSS or JavaScript asset')

  const expectedAssetPrefix = base === '/' ? '/assets/' : `${base}assets/`
  const assetUrl = new URL(assetPath, homepageUrl)
  assert(assetUrl.pathname.startsWith(expectedAssetPrefix), `asset path ${assetUrl.pathname} does not use ${expectedAssetPrefix}`)

  const asset = await fetchResource(cacheBusted(assetUrl.toString(), attempt))
  assert(asset.response.status === 200, `asset returned HTTP ${asset.response.status}`)

  const codex = await fetchResource(cacheBusted(deploymentUrl('codex/'), attempt))
  assert(codex.response.status === 200, `Codex page returned HTTP ${codex.response.status}`)

  const agents = await fetchResource(cacheBusted(deploymentUrl('agents/'), attempt))
  assert(agents.response.status === 200, `AI Agent page returned HTTP ${agents.response.status}`)

  if (expectAgentsNoindex !== undefined) {
    const robots = findElementAttribute(agents.text, 'meta', 'name', 'robots', 'content') || ''
    assert(
      robots.includes('noindex') === expectAgentsNoindex,
      `AI Agent robots meta is ${robots || '(missing)'}, expected noindex=${expectAgentsNoindex}`
    )
  }

  const sitemap = await fetchResource(cacheBusted(deploymentUrl('sitemap.xml'), attempt))
  assert(sitemap.response.status === 200, `sitemap returned HTTP ${sitemap.response.status}`)
  assert(sitemap.text.includes(`${canonical}/codex/`), 'sitemap does not contain the Codex entry')

  if (expectAgentsSitemap !== undefined) {
    const containsAgents = sitemap.text.includes(`${canonical}/agents/`)
    assert(containsAgents === expectAgentsSitemap, `sitemap agents entry is ${containsAgents}, expected ${expectAgentsSitemap}`)
  }

  const robots = await fetchResource(cacheBusted(deploymentUrl('robots.txt'), attempt))
  assert(robots.response.status === 200, `robots.txt returned HTTP ${robots.response.status}`)
  assert(robots.text.includes(`Sitemap: ${canonical}/sitemap.xml`), 'robots.txt points to the wrong sitemap')

  if (checkRedirects) await verifyRedirects()

  return { pages: 3, assetPath: assetUrl.pathname }
}

async function verifyRedirects() {
  const canonicalUrl = new URL(canonical)
  assert(canonicalUrl.hostname === 'www.xiaofengtongxue.com', 'redirect checks require the configured primary domain')

  const expected = `${canonical}/codex/?from=deploy-check`
  const redirectCases = [
    'http://xiaofengtongxue.com/codex/?from=deploy-check',
    'https://xiaofengtongxue.com/codex/?from=deploy-check',
    'http://www.xiaofengtongxue.com/codex/?from=deploy-check',
    'https://www.xinge.ac.cn/codex/?from=deploy-check',
    'https://xinge.ac.cn/codex/?from=deploy-check'
  ]

  for (const url of redirectCases) {
    const { response } = await fetchResource(url, { redirect: 'manual', readBody: false })
    assert(response.status === 301, `${url} returned HTTP ${response.status}`)
    assert(response.headers.get('location') === expected, `${url} redirected to ${response.headers.get('location')}`)
  }
}

async function fetchResource(url, options = {}) {
  const response = await fetch(url, {
    redirect: options.redirect || 'follow',
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache'
    },
    signal: AbortSignal.timeout(15000)
  })

  if (options.readBody === false) {
    return { response, bytes: Buffer.alloc(0), text: '' }
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  return { response, bytes, text: bytes.toString('utf8') }
}

function deploymentUrl(relativePath) {
  const pathname = `${base}${relativePath}`.replace(/\/{2,}/g, '/')
  return new URL(pathname, `${target}/`).toString()
}

function cacheBusted(url, attempt) {
  const value = new URL(url)
  value.searchParams.set('__deploy_check', `${Date.now()}-${attempt}`)
  return value.toString()
}

function findElementAttribute(html, tagName, matchName, matchValue, resultName) {
  const elements = html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || []

  for (const element of elements) {
    const attributes = Object.fromEntries(
      [...element.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1].toLowerCase(), match[2]])
    )
    if (attributes[matchName] === matchValue) return attributes[resultName]
  }

  return undefined
}

function parseArguments(values) {
  const parsed = {}

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (value === '--help' || value === '-h') {
      parsed.help = true
      continue
    }
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`)

    const separator = value.indexOf('=')
    if (separator !== -1) {
      parsed[value.slice(2, separator)] = value.slice(separator + 1)
      continue
    }

    const name = value.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith('--')) {
      parsed[name] = true
      continue
    }

    parsed[name] = next
    index += 1
  }

  return parsed
}

function requiredOption(name) {
  const value = options[name]
  if (typeof value !== 'string' || !value.trim()) throw new Error(`--${name} is required`)
  return value
}

function normalizeOrigin(value) {
  const url = new URL(value)
  if (url.pathname !== '/' || url.search || url.hash) throw new Error(`Expected an origin URL, received ${value}`)
  return url.origin
}

function normalizeBase(value) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function positiveInteger(value, name) {
  const number = Number.parseInt(value, 10)
  if (!Number.isInteger(number) || number < 1) throw new Error(`--${name} must be a positive integer`)
  return number
}

function optionalBoolean(value) {
  if (value === undefined) return undefined
  if (value === true || value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  throw new Error(`Expected a boolean value, received ${value}`)
}

function optionalString(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) throw new Error(`--${name} requires a value`)
  return value.trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function printHelp() {
  console.log(`Usage: node scripts/verify-deployment.mjs [options]

Required:
  --target <origin>                 Deployed origin to request

Options:
  --base <path>                     Deployment base path, default: /
  --canonical <origin>              Expected canonical origin
  --expected-index-sha <sha256>     Require the deployed homepage bytes to match
  --expect-agents-noindex <bool>    Check the AI Agent robots state
  --expect-agents-sitemap <bool>    Check whether AI Agent appears in sitemap
  --check-redirects                 Check primary and legacy domain redirects
  --retries <count>                 Retry count, default: 1
  --delay-ms <milliseconds>         Delay between retries, default: 3000
`)
}
