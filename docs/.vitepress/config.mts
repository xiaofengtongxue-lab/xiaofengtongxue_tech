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
const siteTitle = '小枫技术教程'
const siteDescription = '面向开发者的系统化技术教程，覆盖 AI 编程、大模型、AI Agent、Codex、Java、JavaScript、Go 与软件工程实践。'

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
  const graph: SchemaNode[] = [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: siteTitle,
      description: siteDescription,
      inLanguage: 'zh-CN'
    },
    {
      '@type': isHome ? 'WebPage' : 'TechArticle',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'zh-CN',
      isPartOf: { '@id': `${siteUrl}/#website` }
    }
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

  return [
    ['meta', { name: 'robots', content: 'index,follow' }],
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
}

export default defineConfig({
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  base,
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
    ['meta', { property: 'og:site_name', content: siteTitle }]
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
      {
        text: 'AI 与 Agent',
        items: [
          { text: 'AI 编程', link: '/ai/' },
          { text: '大模型技术', link: '/llm/' },
          { text: 'AI Agent', link: '/agents/' },
          { text: 'Codex 教程', link: '/codex/' }
        ]
      },
      {
        text: '编程语言',
        items: [
          { text: 'Java', link: '/java/' },
          { text: 'JavaScript / TypeScript', link: '/javascript/' },
          { text: 'Go', link: '/go/' }
        ]
      },
      { text: '工程实践', link: '/engineering/' },
      { text: '开发工具', link: '/tools/' },
      { text: 'CCWS 文档', link: 'https://docs.ccws.pro/' }
    ],
    sidebar: {
      '/ai/': [
        {
          text: 'AI 编程',
          items: [
            { text: '栏目总览', link: '/ai/' },
            { text: '大模型技术', link: '/llm/' },
            { text: 'AI Agent', link: '/agents/' },
            { text: 'Codex 教程', link: '/codex/' }
          ]
        }
      ],
      '/llm/': [
        {
          text: '大模型技术',
          items: [
            { text: '栏目总览', link: '/llm/' },
            { text: 'AI 编程', link: '/ai/' },
            { text: 'AI Agent', link: '/agents/' }
          ]
        }
      ],
      '/agents/': [
        {
          text: 'AI Agent',
          items: [
            { text: '栏目总览', link: '/agents/' },
            { text: '大模型技术', link: '/llm/' },
            { text: '开发工具', link: '/tools/' }
          ]
        }
      ],
      '/codex/': [
        {
          text: 'Codex 教程',
          items: [
            { text: '栏目总览', link: '/codex/' },
            { text: 'AI 编程', link: '/ai/' },
            { text: 'CCWS 接入文档', link: 'https://docs.ccws.pro/guide/codex' }
          ]
        }
      ],
      '/java/': [
        {
          text: 'Java',
          items: [
            { text: '栏目总览', link: '/java/' },
            { text: '工程实践', link: '/engineering/' }
          ]
        }
      ],
      '/javascript/': [
        {
          text: 'JavaScript / TypeScript',
          items: [
            { text: '栏目总览', link: '/javascript/' },
            { text: '工程实践', link: '/engineering/' }
          ]
        }
      ],
      '/go/': [
        {
          text: 'Go',
          items: [
            { text: '栏目总览', link: '/go/' },
            { text: '工程实践', link: '/engineering/' }
          ]
        }
      ],
      '/engineering/': [
        {
          text: '工程实践',
          items: [
            { text: '栏目总览', link: '/engineering/' },
            { text: '开发工具', link: '/tools/' }
          ]
        }
      ],
      '/tools/': [
        {
          text: '开发工具',
          items: [
            { text: '栏目总览', link: '/tools/' },
            { text: 'Codex 教程', link: '/codex/' },
            { text: '工程实践', link: '/engineering/' }
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
      message: '小枫技术教程：AI、大模型、Agent 与现代软件开发实践。',
      copyright: 'Copyright © 2026 小枫技术教程'
    }
  }
})
