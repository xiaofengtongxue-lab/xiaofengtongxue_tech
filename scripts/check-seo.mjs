import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const distRoot = path.join(projectRoot, 'docs/.vitepress/dist')
const publicationManifestPath = path.join(
  projectRoot,
  'docs/.vitepress/cache/published-content-manifest.json'
)
const expectedOrigin = (process.env.SITE_URL || 'https://www.xiaofengtongxue.com').replace(/\/$/, '')
const base = normalizeBase(process.env.VITEPRESS_BASE || '/')
const expectedHomeTitle = '程序员小枫同学 | AI 编程、AI Agent 与软件工程教程'
const requiredUrls = [
  `${expectedOrigin}/`,
  `${expectedOrigin}/about`,
  `${expectedOrigin}/agents/`,
  `${expectedOrigin}/agents/start/what-is-agent`,
  `${expectedOrigin}/agents/build/from-chat-to-agent`,
  `${expectedOrigin}/agents/advanced/system-design`,
  `${expectedOrigin}/codex/`,
  `${expectedOrigin}/codex/everyday/`,
  `${expectedOrigin}/codex/practice/`,
  `${expectedOrigin}/codex/skills/`
]

const errors = []
const warnings = []
const publicationManifest = await readPublicationManifest()
const draftUrlSet = new Set(
  publicationManifest.drafts.map((page) => canonicalUrl(page.route))
)
const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'))
const allFiles = new Set(await walk(distRoot))
const pageCache = new Map()
const noindexUrls = new Set()
const builtDraftUrls = new Set()
let checkedLinks = 0
let structuredDataBlocks = 0

for (const relativeFile of htmlFiles) {
  const html = await readFile(path.join(distRoot, relativeFile), 'utf8')
  pageCache.set(relativeFile, html)

  if (relativeFile === '404.html') {
    if (!html.includes('noindex,nofollow')) errors.push('404.html: missing noindex,nofollow')
    continue
  }

  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i)
  const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)].map((match) => match[1])
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length
  const isNoindex = /<meta\s+name="robots"\s+content="noindex(?:,[^"]*)?"/i.test(html)
  const isDraftPage = html.includes('data-published-draft')

  if (!title) errors.push(`${relativeFile}: missing <title>`)
  if (!description) errors.push(`${relativeFile}: missing meta description`)
  if (canonicals.length !== 1) {
    errors.push(`${relativeFile}: expected one canonical, found ${canonicals.length}`)
  } else if (!canonicals[0].startsWith(`${expectedOrigin}/`)) {
    errors.push(`${relativeFile}: canonical uses an unexpected origin: ${canonicals[0]}`)
  } else {
    if (isNoindex) noindexUrls.add(canonicals[0])
    if (isDraftPage) builtDraftUrls.add(canonicals[0])
  }

  if (h1Count !== 1) errors.push(`${relativeFile}: expected one h1, found ${h1Count}`)

  const schemaScripts = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  if (isDraftPage) {
    if (!isNoindex) errors.push(`${relativeFile}: draft page must use noindex,follow`)
    if (schemaScripts.length > 0) errors.push(`${relativeFile}: draft page must not expose JSON-LD`)
    if (canonicals[0] && !draftUrlSet.has(canonicals[0])) {
      errors.push(`${relativeFile}: draft page is missing from the publication manifest`)
    }
  } else if (schemaScripts.length === 0) {
    errors.push(`${relativeFile}: missing JSON-LD`)
  }

  for (const match of schemaScripts) {
    structuredDataBlocks += 1
    try {
      const schema = JSON.parse(match[1])
      const graph = Array.isArray(schema['@graph']) ? schema['@graph'] : []
      const hasFaq = graph.some((item) => item?.['@type'] === 'FAQPage')
      if (hasFaq && !html.includes('class="tutorial-faq"')) {
        errors.push(`${relativeFile}: FAQPage schema has no visible FAQ section`)
      }
    } catch (error) {
      errors.push(`${relativeFile}: invalid JSON-LD (${error.message})`)
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const href = match[1]
    const target = localPageTarget(href)
    if (!target) continue

    checkedLinks += 1
    if (!target.some((candidate) => allFiles.has(candidate))) {
      errors.push(`${relativeFile}: broken internal link ${href}`)
    }
  }
}

const homeHtml = pageCache.get('index.html')
if (!homeHtml) {
  errors.push('missing generated homepage')
} else {
  const homeTitle = firstMatch(homeHtml, /<title>([\s\S]*?)<\/title>/i)
  if (homeTitle !== expectedHomeTitle) {
    errors.push(`index.html: unexpected title: ${homeTitle || '(missing)'}`)
  }
}

const sitemap = await readPublicFile('sitemap.xml')
if (sitemap) {
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  for (const url of sitemapUrls) {
    if (!url.startsWith(`${expectedOrigin}/`)) {
      errors.push(`sitemap.xml: unexpected origin in ${url}`)
    }
  }

  for (const url of requiredUrls) {
    if (!sitemapUrls.includes(url)) errors.push(`sitemap.xml: missing ${url}`)
  }

  for (const url of noindexUrls) {
    if (sitemapUrls.includes(url)) errors.push(`sitemap.xml: contains noindex URL ${url}`)
  }

  for (const url of draftUrlSet) {
    if (sitemapUrls.includes(url)) errors.push(`sitemap.xml: contains draft URL ${url}`)
  }
}

const robots = await readPublicFile('robots.txt')
if (robots && !robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) {
  errors.push('robots.txt: sitemap URL does not match the canonical origin')
}

const llms = await readPublicFile('llms.txt')
if (llms) {
  const llmsUrls = new Set(
    [...llms.matchAll(/https?:\/\/[^\s)>]+/g)].flatMap((match) => {
      try {
        return [canonicalUrl(new URL(match[0].replace(/[.,;:!?]+$/, '')).pathname)]
      } catch {
        return []
      }
    })
  )

  for (const url of requiredUrls) {
    if (!llms.includes(url)) warnings.push(`llms.txt: does not mention ${url}`)
  }

  for (const url of draftUrlSet) {
    if (llmsUrls.has(url)) errors.push(`llms.txt: contains draft URL ${url}`)
  }
}

for (const draft of publicationManifest.drafts) {
  const url = canonicalUrl(draft.route)
  const candidates = pageFileCandidates(draft.route)
  const isBuilt = candidates.some((candidate) => pageCache.has(candidate))

  if (isBuilt && !builtDraftUrls.has(url)) {
    errors.push(`${draft.relativePath}: generated draft page is missing its protected empty state`)
  }
}

const searchIndexFiles = [...allFiles].filter((file) => (
  file.includes('@localSearchIndex') && file.endsWith('.js')
))
const searchIndex = (await Promise.all(
  searchIndexFiles.map((file) => readFile(path.join(distRoot, file), 'utf8'))
)).join('\n')

for (const url of builtDraftUrls) {
  const route = new URL(url).pathname
  if (searchIndex.includes(`"${route}#`)) {
    errors.push(`local search index contains draft route ${route}`)
  }
}

for (const warning of [...new Set(warnings)]) console.warn(`warning: ${warning}`)

if (errors.length > 0) {
  const uniqueErrors = [...new Set(errors)]
  console.error(`SEO check failed with ${uniqueErrors.length} issue(s):`)
  for (const error of uniqueErrors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `SEO check passed: ${htmlFiles.length} HTML pages, ${checkedLinks} internal links, ${structuredDataBlocks} JSON-LD blocks.`
)

function normalizeBase(value) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

async function walk(root, current = '') {
  const entries = await readdir(path.join(root, current), { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relative = path.posix.join(current, entry.name)
    if (entry.isDirectory()) files.push(...await walk(root, relative))
    if (entry.isFile()) files.push(relative)
  }

  return files
}

function firstMatch(value, pattern) {
  return value.match(pattern)?.[1]?.trim()
}

function localPageTarget(href) {
  if (!href || href.startsWith('#') || href.startsWith('//')) return undefined
  if (/^[a-z]+:/i.test(href)) return undefined

  let pathname = href.split('#', 1)[0].split('?', 1)[0]
  if (!pathname) return undefined

  if (pathname.startsWith(base)) pathname = `/${pathname.slice(base.length)}`
  if (!pathname.startsWith('/')) return undefined

  const clean = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '')
  if (!clean) return ['index.html']

  if (path.posix.extname(clean)) return [clean]

  return [`${clean}.html`, `${clean}/index.html`]
}

async function readPublicFile(name) {
  try {
    return await readFile(path.join(distRoot, name), 'utf8')
  } catch {
    errors.push(`missing generated ${name}`)
    return undefined
  }
}

async function readPublicationManifest() {
  try {
    const source = await readFile(publicationManifestPath, 'utf8')
    const manifest = JSON.parse(source)
    if (manifest.version !== 1 || !Array.isArray(manifest.published) || !Array.isArray(manifest.drafts)) {
      throw new Error('unsupported manifest format')
    }
    return manifest
  } catch (error) {
    errors.push(`missing or invalid publication manifest: ${error.message}`)
    return { published: [], drafts: [] }
  }
}

function canonicalUrl(route) {
  let pathname = route.split(/[?#]/, 1)[0] || '/'
  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  pathname = pathname.replace(/\/{2,}/g, '/')
  return `${expectedOrigin}${pathname}`
}

function pageFileCandidates(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  if (!clean) return ['index.html']
  return [`${clean}.html`, `${clean}/index.html`]
}
