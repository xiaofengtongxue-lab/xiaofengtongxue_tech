import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  equivalentArticleContent,
  findMarkdownFiles,
  readRevisionFile,
  resolveRevision,
  setPublishedRevision,
  toRepoPath,
  validateCommit
} from './lib/content-revisions.mjs'

const repoRoot = process.cwd()
const docsRoot = path.join(repoRoot, 'docs')
const options = parseArguments(process.argv.slice(2))

if (options.help) {
  printUsage()
  process.exit(0)
}

const revision = await resolveRevision(repoRoot, options.revision)
await validateCommit(repoRoot, revision, 'HEAD')

const requestedFiles = options.all
  ? await findMarkdownFiles(docsRoot)
  : options.files.map(resolveRequestedFile)

const files = [...new Set(requestedFiles.map((file) => path.resolve(file)))]
if (files.length === 0) {
  fail('请指定至少一篇 Markdown，或使用 --all。')
}

const pendingWrites = []
const issues = []

for (const file of files) {
  try {
    const repoPath = toRepoPath(repoRoot, file)
    if (!repoPath.startsWith('docs/') || !repoPath.endsWith('.md')) {
      throw new Error('只允许确认 docs/ 下的 Markdown 文件')
    }

    const currentSource = await readFile(file, 'utf8')
    const revisionSource = await readRevisionFile(repoRoot, revision, repoPath)

    if (!options.keepWorkingDraft && !equivalentArticleContent(currentSource, revisionSource)) {
      throw new Error(
        '当前正文与目标提交不同；请先提交正文，或明确使用 --keep-working-draft 保留工作区草稿'
      )
    }

    pendingWrites.push({
      file,
      repoPath,
      source: setPublishedRevision(currentSource, revision, repoPath)
    })
  } catch (error) {
    issues.push(`${path.relative(repoRoot, file)}: ${error.message}`)
  }
}

if (issues.length > 0) {
  fail(`定稿检查未通过：\n- ${issues.join('\n- ')}`)
}

for (const pending of pendingWrites) {
  await writeFile(pending.file, pending.source, 'utf8')
}

console.log(`已把 ${pendingWrites.length} 篇内容的定稿版本指向 ${revision}。`)
console.log('这个命令不会提交文件；确认 diff 后，再单独提交 publishedRevision 变更。')

function parseArguments(args) {
  const result = {
    all: false,
    files: [],
    help: false,
    keepWorkingDraft: false,
    revision: 'HEAD'
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--all') {
      result.all = true
    } else if (argument === '--keep-working-draft') {
      result.keepWorkingDraft = true
    } else if (argument === '--revision') {
      result.revision = args[index + 1]
      index += 1
      if (!result.revision) fail('--revision 后面需要 Git 提交。')
    } else if (argument === '--help' || argument === '-h') {
      result.help = true
    } else if (argument.startsWith('-')) {
      fail(`未知参数：${argument}`)
    } else {
      result.files.push(argument)
    }
  }

  if (result.all && result.files.length > 0) {
    fail('--all 不能和具体文件同时使用。')
  }

  return result
}

function resolveRequestedFile(value) {
  const absolutePath = path.resolve(repoRoot, value)
  const relativePath = path.relative(docsRoot, absolutePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    fail(`文件不在 docs/ 下：${value}`)
  }

  return absolutePath
}

function printUsage() {
  console.log(`用法：
  npm run content:approve -- docs/path/to/article.md
  npm run content:approve -- --revision <commit> docs/a.md docs/b.md

选项：
  --revision <commit>      定稿正文所在提交，默认 HEAD
  --keep-working-draft     允许当前正文继续编辑，只把线上版本指向目标提交
  --all                    处理 docs/ 下全部 Markdown，主要用于首次迁移
  --help                   显示帮助`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
