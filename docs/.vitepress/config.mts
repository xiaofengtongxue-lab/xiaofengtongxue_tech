import { defineConfig } from 'vitepress'
import type { HeadConfig, TransformContext } from 'vitepress'

const defaultBase = '/xiaofengtongxue_tech/'
const base = normalizeBase(process.env.VITEPRESS_BASE || defaultBase)
const siteUrl = normalizeSiteUrl(
  process.env.SITE_URL || `https://xiaofengtongxue-lab.github.io${base}`
)
const parsedSiteUrl = new URL(siteUrl)
const siteOrigin = parsedSiteUrl.origin
const sitePath = parsedSiteUrl.pathname.replace(/\/$/, '')
const siteTitle = '程序员小枫同学'
const siteDescription = '程序员小枫同学的 Codex 系统教程，覆盖 Codex App、CLI、AGENTS.md、Skills、MCP、代码审查与真实项目工作流。'
const authorId = `${siteUrl}/#author`
const websiteId = `${siteUrl}/#website`

type SchemaNode = Record<string, unknown>

function normalizeBase(value: string) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function normalizeSiteUrl(value: string) {
  return value.replace(/\/$/, '')
}

function pagePath(relativePath: string) {
  if (!relativePath || relativePath === 'index.md') return '/'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'index.md'.length)}`
  }
  return `/${relativePath.replace(/\.md$/, '')}`
}

function pageUrl(relativePath: string) {
  return `${siteUrl}${pagePath(relativePath)}`
}

function structuredData(context: TransformContext): SchemaNode {
  const { pageData, title, description } = context
  const path = pagePath(pageData.relativePath)
  const url = pageUrl(pageData.relativePath)
  const isHome = path === '/'
  const pageNode: SchemaNode = {
    '@type': isHome ? 'WebPage' : 'TechArticle',
    '@id': `${url}#webpage`,
    url,
    name: pageData.title || title,
    description,
    inLanguage: 'zh-CN',
    isPartOf: { '@id': websiteId },
    author: { '@id': authorId },
    publisher: { '@id': authorId }
  }

  if (!isHome) {
    pageNode.headline = pageData.title || title
    pageNode.mainEntityOfPage = url
    pageNode.isAccessibleForFree = true
  }

  if (pageData.lastUpdated) {
    pageNode.dateModified = new Date(pageData.lastUpdated).toISOString()
  }

  const graph: SchemaNode[] = [
    {
      '@type': 'Person',
      '@id': authorId,
      name: siteTitle,
      url: `${siteUrl}/`,
      description: '“程序员小枫同学”网站与同名公众号的内容主体。'
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${siteUrl}/`,
      name: siteTitle,
      description: siteDescription,
      inLanguage: 'zh-CN',
      creator: { '@id': authorId },
      publisher: { '@id': authorId }
    },
    pageNode
  ]

  if (!isHome) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: siteTitle,
          item: `${siteUrl}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageData.title || title,
          item: url
        }
      ]
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
}

function pageHead(context: TransformContext): HeadConfig[] {
  const { pageData, title, description } = context
  if (pageData.isNotFound || pageData.relativePath === '404.md') {
    return [['meta', { name: 'robots', content: 'noindex,nofollow' }]]
  }

  const url = pageUrl(pageData.relativePath)
  const isHome = pagePath(pageData.relativePath) === '/'
  const robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
  const head: HeadConfig[] = [
    ['meta', { name: 'robots', content: robots }],
    ['meta', { name: 'googlebot', content: robots }],
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['script', { type: 'application/ld+json' }, JSON.stringify(structuredData(context))]
  ]

  if (!isHome && pageData.lastUpdated) {
    head.push([
      'meta',
      { property: 'article:modified_time', content: new Date(pageData.lastUpdated).toISOString() }
    ])
  }

  return head
}

export default defineConfig({
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  base,
  srcExclude: [
    'agents/**',
    'ai/**',
    'engineering/**',
    'go/**',
    'java/**',
    'javascript/**',
    'llm/**',
    'tools/**'
  ],
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: siteOrigin,
    transformItems: (items) => items.map((item) => ({
      ...item,
      url: `${sitePath}/${item.url}`.replace(/\/{2,}/g, '/')
    }))
  },
  head: [
    ['meta', { name: 'author', content: siteTitle }],
    ['meta', { name: 'application-name', content: siteTitle }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    [
      'link',
      {
        rel: 'alternate',
        type: 'text/plain',
        href: `${siteUrl}/llms.txt`,
        title: `${siteTitle} llms.txt`
      }
    ]
  ],
  transformHead: pageHead,
  markdown: {
    image: {
      lazyLoading: true
    }
  },
  themeConfig: {
    siteTitle,
    search: {
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: 'Codex 教程', link: '/codex/' }
    ],
    sidebar: {
      '/codex/': [
        {
          text: 'Codex 教程',
          items: [
            { text: '教程总览', link: '/codex/' }
          ]
        }
      ]
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新'
    },
    footer: {
      message: '程序员小枫同学：从 Codex 开始，完成真实开发任务。',
      copyright: 'Copyright © 2026 程序员小枫同学'
    }
  }
})
