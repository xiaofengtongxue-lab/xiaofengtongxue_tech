import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  equivalentArticleContent,
  findMarkdownFiles,
  readPublishedRevision,
  readRevisionFile,
  resolveRevision,
  toRepoPath,
  validateCommit
} from './lib/content-revisions.mjs'

const repoRoot = process.cwd()
const docsRoot = path.join(repoRoot, 'docs')
const jsonOutput = process.argv.includes('--json')
const checkOnly = process.argv.includes('--check')
const head = await resolveRevision(repoRoot, 'HEAD')
const files = await findMarkdownFiles(docsRoot)
const result = {
  published: [],
  editing: [],
  drafts: [],
  invalid: []
}
const validatedCommits = new Set()

for (const file of files) {
  const repoPath = toRepoPath(repoRoot, file)
  const displayPath = path.relative(repoRoot, file).split(path.sep).join('/')

  try {
    const currentSource = await readFile(file, 'utf8')
    const revision = readPublishedRevision(currentSource, repoPath)

    if (!revision) {
      result.drafts.push(displayPath)
      continue
    }

    if (!validatedCommits.has(revision)) {
      await validateCommit(repoRoot, revision, head)
      validatedCommits.add(revision)
    }

    const publishedSource = await readRevisionFile(repoRoot, revision, repoPath)
    const entry = { path: displayPath, revision }

    if (equivalentArticleContent(currentSource, publishedSource)) {
      result.published.push(entry)
    } else {
      result.editing.push(entry)
    }
  } catch (error) {
    result.invalid.push({ path: displayPath, error: error.message })
  }
}

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(
    `内容状态：${result.published.length} 篇与定稿一致，`
    + `${result.editing.length} 篇正在继续编辑，`
    + `${result.drafts.length} 篇未定稿，`
    + `${result.invalid.length} 篇配置无效。`
  )

  if (!checkOnly) {
    printPaths('正在继续编辑，线上仍显示旧定稿', result.editing.map((item) => item.path))
    printPaths('未定稿；页面参与公开构建时显示赶稿页', result.drafts)
  }

  if (result.invalid.length > 0) {
    console.error('\n配置无效：')
    for (const item of result.invalid) console.error(`- ${item.path}: ${item.error}`)
  }
}

if (result.invalid.length > 0) process.exit(1)

function printPaths(label, paths) {
  if (paths.length === 0) return
  console.log(`\n${label}：`)
  for (const file of paths) console.log(`- ${file}`)
}
