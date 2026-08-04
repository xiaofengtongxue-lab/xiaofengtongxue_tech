import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import {
  materializePublishedDocs,
  publishedManifestFile
} from './lib/content-revisions.mjs'

const repoRoot = process.cwd()
const sourceRoot = path.join(repoRoot, 'docs')
const outputRoot = path.join(sourceRoot, '.vitepress', 'dist')
const cacheRoot = path.join(sourceRoot, '.vitepress', 'cache')
const cacheManifestPath = path.join(cacheRoot, publishedManifestFile)
const buildCacheRoot = path.join(repoRoot, '.content-build')
await mkdir(buildCacheRoot, { recursive: true })
const tempRoot = await mkdtemp(path.join(buildCacheRoot, 'published-'))
const targetRoot = path.join(tempRoot, 'docs')
const manifestPath = path.join(tempRoot, publishedManifestFile)

await rm(outputRoot, { recursive: true, force: true })

try {
  const manifest = await materializePublishedDocs({
    repoRoot,
    sourceRoot,
    targetRoot,
    manifestPath
  })

  console.log(
    `发布构建：${manifest.published.length} 篇读取定稿，`
    + `${manifest.drafts.length} 篇未定稿。`
  )

  const vitepressCli = path.join(repoRoot, 'node_modules', 'vitepress', 'bin', 'vitepress.js')
  await run(process.execPath, [vitepressCli, 'build', targetRoot, '--outDir', outputRoot], {
    ...process.env,
    PUBLISHED_CONTENT_MANIFEST: manifestPath
  })

  await mkdir(cacheRoot, { recursive: true })
  await copyFile(manifestPath, cacheManifestPath)
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      stdio: 'inherit'
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(
          signal
            ? `VitePress build stopped by ${signal}`
            : `VitePress build exited with code ${code}`
        ))
      }
    })
  })
}
