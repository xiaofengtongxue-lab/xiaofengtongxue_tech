import { execFile } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import matter from 'gray-matter'

const execFileAsync = promisify(execFile)

export const publishedRevisionField = 'publishedRevision'
export const publishedManifestFile = 'published-content-manifest.json'

const fullRevisionPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i

export async function runGit(repoRoot, args, options = {}) {
  const { allowedExitCodes = [] } = options

  try {
    const result = await execFileAsync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, LC_ALL: 'C' },
      maxBuffer: 16 * 1024 * 1024
    })

    return { code: 0, stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    const code = typeof error.code === 'number' ? error.code : 1
    if (allowedExitCodes.includes(code)) {
      return {
        code,
        stdout: typeof error.stdout === 'string' ? error.stdout : '',
        stderr: typeof error.stderr === 'string' ? error.stderr : ''
      }
    }

    const detail = typeof error.stderr === 'string' && error.stderr.trim()
      ? error.stderr.trim()
      : error.message
    throw new Error(`git ${args.join(' ')} failed: ${detail}`)
  }
}

export async function resolveRevision(repoRoot, revision = 'HEAD') {
  const result = await runGit(repoRoot, ['rev-parse', '--verify', `${revision}^{commit}`])
  const resolved = result.stdout.trim().toLowerCase()

  if (!fullRevisionPattern.test(resolved)) {
    throw new Error(`Git did not return a full commit SHA for ${revision}`)
  }

  return resolved
}

export async function validateCommit(repoRoot, revision, headRevision = 'HEAD') {
  if (!fullRevisionPattern.test(revision)) {
    throw new Error(`${publishedRevisionField} must be a full Git commit SHA`)
  }

  const exists = await runGit(
    repoRoot,
    ['cat-file', '-e', `${revision}^{commit}`],
    { allowedExitCodes: [1, 128] }
  )

  if (exists.code !== 0) {
    throw new Error(
      `commit ${revision} is unavailable; fetch the full Git history before building`
    )
  }

  const ancestor = await runGit(
    repoRoot,
    ['merge-base', '--is-ancestor', revision, headRevision],
    { allowedExitCodes: [1, 128] }
  )

  if (ancestor.code !== 0) {
    throw new Error(`commit ${revision} is not in the current ${headRevision} history`)
  }
}

export async function readRevisionFile(repoRoot, revision, repoPath) {
  const result = await runGit(
    repoRoot,
    ['show', `${revision}:${repoPath}`],
    { allowedExitCodes: [128] }
  )

  if (result.code !== 0) {
    throw new Error(`${repoPath} does not exist in commit ${revision}`)
  }

  return result.stdout
}

export async function readRevisionTimestamp(repoRoot, revision) {
  const result = await runGit(repoRoot, ['show', '-s', '--format=%cI', revision])
  const timestamp = result.stdout.trim()

  if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`commit ${revision} has no valid timestamp`)
  }

  return timestamp
}

export function parseMarkdown(source, filename = 'Markdown file') {
  try {
    const parsed = matter(source)
    if (!parsed.isEmpty && !source.replace(/^\uFEFF/, '').startsWith('---')) {
      throw new Error('frontmatter must start on the first line')
    }
    return parsed
  } catch (error) {
    throw new Error(`${filename} has invalid frontmatter: ${error.message}`)
  }
}

export function readPublishedRevision(source, filename = 'Markdown file') {
  const parsed = parseMarkdown(source, filename)
  const value = parsed.data[publishedRevisionField]

  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !fullRevisionPattern.test(value.trim())) {
    throw new Error(`${filename}: ${publishedRevisionField} must be a full Git commit SHA`)
  }

  return value.trim().toLowerCase()
}

export function setPublishedRevision(source, revision, filename = 'Markdown file') {
  if (!fullRevisionPattern.test(revision)) {
    throw new Error(`${publishedRevisionField} must be a full Git commit SHA`)
  }

  parseMarkdown(source, filename)
  const range = frontmatterRange(source, filename)
  const block = source.slice(range.contentStart, range.contentEnd)
  const matches = [...block.matchAll(/^publishedRevision[ \t]*:.*$/gm)]

  if (matches.length > 1) {
    throw new Error(`${filename}: ${publishedRevisionField} is declared more than once`)
  }

  const fieldLine = `${publishedRevisionField}: ${JSON.stringify(revision.toLowerCase())}`

  if (matches.length === 1) {
    const match = matches[0]
    const start = range.contentStart + match.index
    const end = start + match[0].length
    return `${source.slice(0, start)}${fieldLine}${source.slice(end)}`
  }

  return `${source.slice(0, range.contentStart)}${fieldLine}${range.eol}${source.slice(range.contentStart)}`
}

export function stripPublishedRevision(source, filename = 'Markdown file') {
  parseMarkdown(source, filename)
  const range = frontmatterRange(source, filename)
  const block = source.slice(range.contentStart, range.contentEnd)
  const lines = block.split(/\r?\n/)
  const filtered = lines.filter((line) => !/^publishedRevision[ \t]*:/.test(line))

  return `${source.slice(0, range.contentStart)}${filtered.join(range.eol)}${source.slice(range.contentEnd)}`
}

export function equivalentArticleContent(left, right) {
  return normalizeLineEndings(stripPublishedRevision(left))
    === normalizeLineEndings(stripPublishedRevision(right))
}

export async function findMarkdownFiles(root) {
  const files = []

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'public') continue

      const absolutePath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(absolutePath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(absolutePath)
      }
    }
  }

  await walk(root)
  return files.sort((left, right) => left.localeCompare(right, 'en'))
}

export function toRepoPath(repoRoot, filePath) {
  const relativePath = path.relative(repoRoot, filePath)
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`${filePath} is outside ${repoRoot}`)
  }

  return relativePath.split(path.sep).join('/')
}

export function markdownPathToRoute(relativePath) {
  const normalized = relativePath.split(path.sep).join('/')
  if (normalized === 'index.md') return '/'
  if (normalized.endsWith('/index.md')) {
    return `/${normalized.slice(0, -'index.md'.length)}`
  }
  return `/${normalized.replace(/\.md$/, '')}`
}

export function createDraftPlaceholder(title) {
  const safeTitle = escapeHtml(title || '这篇教程')
  const yamlTitle = JSON.stringify(title || '文章正在拼命赶稿中')

  return `---
title: ${yamlTitle}
description: "这篇教程还在整理，定稿后会在这里发布。"
noindex: true
search: false
publishedDraft: true
author: false
aside: false
outline: false
prev: false
next: false
lastUpdated: false
---

# 文章正在拼命赶稿中

<div class="draft-placeholder" data-published-draft>
  <p class="draft-placeholder__topic">正在整理：${safeTitle}</p>
  <p class="draft-placeholder__copy">这篇内容还没有定稿，等我把示例和细节确认好，再把完整版本放出来。</p>
  <a class="draft-placeholder__link" href="/">先看已经发布的教程 <span aria-hidden="true">→</span></a>
</div>
`
}

export async function materializePublishedDocs(options) {
  const {
    repoRoot,
    sourceRoot,
    targetRoot,
    manifestPath,
    headRevision = 'HEAD'
  } = options

  const head = await resolveRevision(repoRoot, headRevision)
  await rm(targetRoot, { recursive: true, force: true })
  await cp(sourceRoot, targetRoot, {
    recursive: true,
    filter: (source) => shouldCopyDocsPath(sourceRoot, source)
  })

  const markdownFiles = await findMarkdownFiles(sourceRoot)
  const published = []
  const drafts = []
  const issues = []
  const validatedCommits = new Set()
  const timestampCache = new Map()

  for (const sourceFile of markdownFiles) {
    const relativePath = path.relative(sourceRoot, sourceFile).split(path.sep).join('/')
    const repoPath = toRepoPath(repoRoot, sourceFile)
    const targetFile = path.join(targetRoot, relativePath)
    const source = await readFile(sourceFile, 'utf8')
    let parsed
    let revision

    try {
      parsed = parseMarkdown(source, repoPath)
      revision = readPublishedRevision(source, repoPath)
    } catch (error) {
      issues.push(error.message)
      continue
    }

    const title = typeof parsed.data.title === 'string' && parsed.data.title.trim()
      ? parsed.data.title.trim()
      : path.basename(relativePath, '.md')
    const route = markdownPathToRoute(relativePath)

    if (!revision) {
      await writeFile(targetFile, createDraftPlaceholder(title), 'utf8')
      drafts.push({ relativePath, route, title })
      continue
    }

    try {
      if (!validatedCommits.has(revision)) {
        await validateCommit(repoRoot, revision, head)
        validatedCommits.add(revision)
      }

      const approvedSource = await readRevisionFile(repoRoot, revision, repoPath)
      const approvedParsed = parseMarkdown(approvedSource, `${repoPath} at ${revision}`)
      const approvedTitle = typeof approvedParsed.data.title === 'string'
        ? approvedParsed.data.title.trim()
        : title

      if (!timestampCache.has(revision)) {
        timestampCache.set(revision, await readRevisionTimestamp(repoRoot, revision))
      }

      await writeFile(
        targetFile,
        stripPublishedRevision(approvedSource, `${repoPath} at ${revision}`),
        'utf8'
      )
      published.push({
        relativePath,
        route,
        title: approvedTitle || title,
        revision,
        lastUpdated: timestampCache.get(revision)
      })
    } catch (error) {
      issues.push(`${repoPath}: ${error.message}`)
    }
  }

  if (issues.length > 0) {
    throw new Error(`Published content validation failed:\n- ${issues.join('\n- ')}`)
  }

  await filterLlmsFile(targetRoot, drafts)

  const manifest = {
    version: 1,
    head,
    generatedAt: new Date().toISOString(),
    published,
    drafts
  }

  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return manifest
}

async function filterLlmsFile(targetRoot, drafts) {
  const llmsPath = path.join(targetRoot, 'public', 'llms.txt')
  let source

  try {
    source = await readFile(llmsPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }

  const draftRoutes = new Set(drafts.map((draft) => routeKey(draft.route)))
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const hadFinalEol = source.endsWith('\n')
  const lines = source.split(/\r?\n/)
  const filtered = lines.filter((line) => !lineTargetsDraft(line, draftRoutes))
  let output = filtered.join(eol)

  if (hadFinalEol && !output.endsWith(eol)) output += eol
  await writeFile(llmsPath, output, 'utf8')
}

function lineTargetsDraft(line, draftRoutes) {
  const targets = []

  for (const match of line.matchAll(/https?:\/\/[^\s)>]+/g)) {
    try {
      targets.push(new URL(match[0].replace(/[.,;:!?]+$/, '')).pathname)
    } catch {
      // Ignore malformed URLs; the regular SEO checker reports them separately.
    }
  }

  for (const match of line.matchAll(/\]\((\/[^)\s?#]*)(?:[?#][^)]*)?\)/g)) {
    targets.push(match[1])
  }

  return targets.some((target) => draftRoutes.has(routeKey(target)))
}

function routeKey(value) {
  let route = value.split(/[?#]/, 1)[0] || '/'
  if (!route.startsWith('/')) route = `/${route}`
  route = route.replace(/\/{2,}/g, '/')
  if (route !== '/') route = route.replace(/\/$/, '')
  return route
}

function shouldCopyDocsPath(sourceRoot, source) {
  const relativePath = path.relative(sourceRoot, source).split(path.sep).join('/')
  return relativePath !== '.vitepress/dist'
    && !relativePath.startsWith('.vitepress/dist/')
    && relativePath !== '.vitepress/cache'
    && !relativePath.startsWith('.vitepress/cache/')
}

function frontmatterRange(source, filename) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const firstLineEnd = source.indexOf('\n')
  const firstLine = firstLineEnd === -1 ? source : source.slice(0, firstLineEnd)

  if (firstLine.replace(/^\uFEFF/, '').replace(/\r$/, '').trim() !== '---') {
    throw new Error(`${filename}: frontmatter must start with ---`)
  }

  let cursor = firstLineEnd + 1
  while (cursor > 0 && cursor <= source.length) {
    const nextLineEnd = source.indexOf('\n', cursor)
    const lineEnd = nextLineEnd === -1 ? source.length : nextLineEnd
    const line = source.slice(cursor, lineEnd).replace(/\r$/, '')

    if (line.trim() === '---') {
      return {
        contentStart: firstLineEnd + 1,
        contentEnd: cursor,
        eol
      }
    }

    if (nextLineEnd === -1) break
    cursor = nextLineEnd + 1
  }

  throw new Error(`${filename}: frontmatter closing delimiter is missing`)
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n/g, '\n')
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
