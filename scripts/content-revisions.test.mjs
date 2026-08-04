import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import {
  materializePublishedDocs,
  setPublishedRevision
} from './lib/content-revisions.mjs'

const execFileAsync = promisify(execFile)

test('published builds use the approved revision and replace new drafts', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'content-revisions-test-'))

  try {
    const docsRoot = path.join(repoRoot, 'docs')
    await mkdir(path.join(docsRoot, 'public'), { recursive: true })
    await writeFile(
      path.join(docsRoot, 'article.md'),
      markdown('已定稿教程', 'APPROVED_BODY_MARKER'),
      'utf8'
    )
    await writeFile(
      path.join(docsRoot, 'public', 'llms.txt'),
      '- [已定稿](https://example.com/article)\n',
      'utf8'
    )

    await git(repoRoot, ['init'])
    await git(repoRoot, ['config', 'user.email', 'test@example.com'])
    await git(repoRoot, ['config', 'user.name', 'Content Test'])
    await git(repoRoot, ['add', '.'])
    await git(repoRoot, ['commit', '-m', 'approved'])
    const revision = (await git(repoRoot, ['rev-parse', 'HEAD'])).trim()

    const editedSource = setPublishedRevision(
      markdown('已定稿教程', 'UNPUBLISHED_EDIT_MARKER'),
      revision
    )
    await writeFile(path.join(docsRoot, 'article.md'), editedSource, 'utf8')
    await writeFile(
      path.join(docsRoot, 'new-article.md'),
      markdown('新教程', 'NEW_DRAFT_SECRET_MARKER'),
      'utf8'
    )
    await writeFile(
      path.join(docsRoot, 'public', 'llms.txt'),
      '- [已定稿](https://example.com/article)\n- [新教程](https://example.com/new-article)\n',
      'utf8'
    )

    const targetRoot = path.join(repoRoot, 'build-docs')
    const manifestPath = path.join(repoRoot, 'manifest.json')
    const manifest = await materializePublishedDocs({
      repoRoot,
      sourceRoot: docsRoot,
      targetRoot,
      manifestPath
    })

    const published = await readFile(path.join(targetRoot, 'article.md'), 'utf8')
    const draft = await readFile(path.join(targetRoot, 'new-article.md'), 'utf8')
    const llms = await readFile(path.join(targetRoot, 'public', 'llms.txt'), 'utf8')

    assert.match(published, /APPROVED_BODY_MARKER/)
    assert.doesNotMatch(published, /UNPUBLISHED_EDIT_MARKER/)
    assert.doesNotMatch(published, /publishedRevision/)
    assert.match(draft, /文章正在拼命赶稿中/)
    assert.match(draft, /search: false/)
    assert.doesNotMatch(draft, /NEW_DRAFT_SECRET_MARKER/)
    assert.match(llms, /https:\/\/example\.com\/article/)
    assert.doesNotMatch(llms, /new-article/)
    assert.equal(manifest.published.length, 1)
    assert.equal(manifest.drafts.length, 1)
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
})

test('publishedRevision updates only its own frontmatter field', () => {
  const revision = 'a'.repeat(40)
  const source = `---\ntitle: 示例\ndescription: 说明\n---\n\n# 示例\n`
  const first = setPublishedRevision(source, revision)
  const second = setPublishedRevision(first, 'b'.repeat(40))

  assert.match(first, /^---\npublishedRevision: "a{40}"\ntitle:/)
  assert.equal((second.match(/publishedRevision:/g) || []).length, 1)
  assert.match(second, /publishedRevision: "b{40}"/)
  assert.match(second, /description: 说明/)
  assert.match(second, /# 示例/)
})

test('published builds reject an unavailable revision', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'content-invalid-revision-test-'))

  try {
    const docsRoot = path.join(repoRoot, 'docs')
    await mkdir(path.join(docsRoot, 'public'), { recursive: true })
    await writeFile(
      path.join(docsRoot, 'article.md'),
      setPublishedRevision(markdown('无效定稿', 'BODY'), 'f'.repeat(40)),
      'utf8'
    )
    await writeFile(path.join(docsRoot, 'public', 'llms.txt'), '', 'utf8')
    await initializeRepo(repoRoot)

    await assert.rejects(
      materializePublishedDocs({
        repoRoot,
        sourceRoot: docsRoot,
        targetRoot: path.join(repoRoot, 'build-docs'),
        manifestPath: path.join(repoRoot, 'manifest.json')
      }),
      /commit f{40} is unavailable/
    )
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
})

test('published builds reject a renamed file that is absent from the approved commit', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'content-rename-test-'))

  try {
    const docsRoot = path.join(repoRoot, 'docs')
    await mkdir(path.join(docsRoot, 'public'), { recursive: true })
    await writeFile(path.join(docsRoot, 'old-name.md'), markdown('旧路径', 'APPROVED'), 'utf8')
    await writeFile(path.join(docsRoot, 'public', 'llms.txt'), '', 'utf8')
    await initializeRepo(repoRoot)
    const revision = (await git(repoRoot, ['rev-parse', 'HEAD'])).trim()

    await rename(path.join(docsRoot, 'old-name.md'), path.join(docsRoot, 'new-name.md'))
    const renamedSource = await readFile(path.join(docsRoot, 'new-name.md'), 'utf8')
    await writeFile(
      path.join(docsRoot, 'new-name.md'),
      setPublishedRevision(renamedSource, revision),
      'utf8'
    )

    await assert.rejects(
      materializePublishedDocs({
        repoRoot,
        sourceRoot: docsRoot,
        targetRoot: path.join(repoRoot, 'build-docs'),
        manifestPath: path.join(repoRoot, 'manifest.json')
      }),
      /docs\/new-name\.md does not exist in commit/
    )
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
})

function markdown(title, body) {
  return `---\ntitle: ${title}\ndescription: 测试说明\n---\n\n# ${title}\n\n${body}\n`
}

async function git(cwd, args) {
  const result = await execFileAsync('git', args, { cwd, encoding: 'utf8' })
  return result.stdout
}

async function initializeRepo(repoRoot) {
  await git(repoRoot, ['init'])
  await git(repoRoot, ['config', 'user.email', 'test@example.com'])
  await git(repoRoot, ['config', 'user.name', 'Content Test'])
  await git(repoRoot, ['add', '.'])
  await git(repoRoot, ['commit', '-m', 'baseline'])
}
