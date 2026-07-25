import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const submit = process.argv.includes('--submit')
const site = (process.env.BAIDU_SITE || 'https://www.xiaofengtongxue.com').replace(/\/$/, '')
const token = process.env.BAIDU_PUSH_TOKEN
const sitemapPath = path.resolve('docs/.vitepress/dist/sitemap.xml')
const sitemap = await readFile(sitemapPath, 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

if (urls.length === 0) {
  throw new Error(`No URLs found in ${sitemapPath}`)
}

for (const url of urls) {
  if (!url.startsWith(`${site}/`)) {
    throw new Error(`Sitemap URL does not belong to ${site}: ${url}`)
  }
}

if (!submit) {
  console.log(`Dry run: ${urls.length} URL(s) are ready for Baidu submission.`)
  console.log('Run with --submit and set BAIDU_PUSH_TOKEN to perform the request.')
  process.exit(0)
}

if (!token) {
  throw new Error('BAIDU_PUSH_TOKEN is required when using --submit')
}

const endpoint = new URL('https://data.zz.baidu.com/urls')
endpoint.searchParams.set('site', site)
endpoint.searchParams.set('token', token)

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'text/plain; charset=utf-8' },
  body: urls.join('\n')
})
const body = await response.text()

if (!response.ok) {
  throw new Error(`Baidu submission failed with HTTP ${response.status}: ${body}`)
}

console.log(`Submitted ${urls.length} URL(s) to Baidu.`)
console.log(body)
