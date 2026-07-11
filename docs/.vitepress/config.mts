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
const siteDescription = '程序员小枫同学的 Codex 与 ChatGPT Work 实战教程，为普通工作者和开发者分别提供完整路线，覆盖办公文件、PPT、电商、漫剧、软件开发、Skills 与自动化。'
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
      { text: '教程总览', link: '/codex/' },
      { text: '普通人入门', link: '/codex/everyday/' },
      { text: '场景实战', link: '/codex/practice/' },
      { text: 'Skill 推荐', link: '/codex/skills/' }
    ],
    sidebar: {
      '/codex/': [
        {
          text: '先按身份选择',
          items: [
            { text: '教程总览', link: '/codex/' }
          ]
        },
        {
          text: '普通用户：不要求编程',
          collapsed: false,
          items: [
            { text: '普通人完整学习路线', link: '/codex/everyday/' },
            { text: '不用代码完成第一份文件', link: '/codex/everyday/first-result' },
            { text: '项目、任务与本地文件', link: '/codex/everyday/projects-files' },
            { text: '用普通话说清任务', link: '/codex/everyday/task-brief' },
            { text: '检查 Word、PPT、表格和 PDF', link: '/codex/everyday/review-revise' },
            { text: '隐私、权限与审批', link: '/codex/everyday/safety' },
            { text: '使用 Skill 和 Plugin', link: '/codex/everyday/skills-plugins' },
            { text: '复用和自动化工作流', link: '/codex/everyday/repeat-workflow' }
          ]
        },
        {
          text: '开发者路线一：安全入门',
          collapsed: true,
          items: [
            { text: 'Codex 是什么', link: '/codex/start/what-is-codex' },
            { text: 'Chat、Work 与 Codex 入口怎么选', link: '/codex/start/choose-surface' },
            { text: '安装、登录与环境检查', link: '/codex/start/install-login' },
            { text: '第一次可验证任务', link: '/codex/start/first-task' },
            { text: '提示词与任务说明', link: '/codex/start/prompting' },
            { text: '权限、沙箱与工作区安全', link: '/codex/start/permissions' }
          ]
        },
        {
          text: '开发者路线二：项目工作流',
          collapsed: true,
          items: [
            { text: '读懂陌生代码库', link: '/codex/workflows/understand-codebase' },
            { text: '复现并修复 Bug', link: '/codex/workflows/fix-bugs' },
            { text: '开发一个完整功能', link: '/codex/workflows/build-feature' },
            { text: '补测试与验证门槛', link: '/codex/workflows/testing' },
            { text: '根据截图实现界面', link: '/codex/workflows/ui-from-screenshot' },
            { text: '可回退的重构与迁移', link: '/codex/workflows/refactor' },
            { text: '代码审查、Git 与 PR', link: '/codex/workflows/code-review-git' },
            { text: '文档与发布准备', link: '/codex/workflows/docs-release' }
          ]
        },
        {
          text: '开发者路线三：专家进阶',
          collapsed: true,
          items: [
            { text: 'AGENTS.md 实战', link: '/codex/advanced/agents-md' },
            { text: 'config.toml 配置实战', link: '/codex/advanced/config' },
            { text: 'MCP 配置与安全', link: '/codex/advanced/mcp' },
            { text: 'Plugins 安装与管理', link: '/codex/advanced/plugins' },
            { text: '云任务与 Worktree', link: '/codex/advanced/cloud-worktrees' },
            { text: '定时任务与持续目标', link: '/codex/advanced/automation' },
            { text: 'codex exec 与 GitHub Actions', link: '/codex/advanced/exec-ci' },
            { text: 'Hooks 与 Rules', link: '/codex/advanced/hooks-rules' },
            { text: 'Subagents 并行协作', link: '/codex/advanced/subagents' },
            { text: 'SDK 与 App Server', link: '/codex/advanced/sdk-app-server' },
            { text: '团队安全与数据边界', link: '/codex/advanced/security' },
            { text: '常见故障分层排查', link: '/codex/advanced/troubleshooting' }
          ]
        },
        {
          text: '办公、商业与内容实战',
          collapsed: false,
          items: [
            { text: '场景实战总览', link: '/codex/practice/' },
            { text: '制作可交付的 PPT', link: '/codex/practice/ppt' },
            { text: '搭建电商运营工作流', link: '/codex/practice/ecommerce' },
            { text: '制作 AI 漫剧与短片', link: '/codex/practice/comic-drama' },
            { text: '处理 Word、Excel 和 PDF', link: '/codex/practice/documents-spreadsheets-pdf' },
            { text: '完成带来源的研究报告', link: '/codex/practice/research-report' },
            { text: '数据分析与可视化', link: '/codex/practice/data-analysis' },
            { text: '从想法到 Web 应用', link: '/codex/practice/web-app' },
            { text: '图文、短视频与内容素材', link: '/codex/practice/content-video' }
          ]
        },
        {
          text: 'Codex Skill 推荐',
          collapsed: true,
          items: [
            { text: 'Skill 推荐总览', link: '/codex/skills/' },
            { text: '官方与高价值能力推荐', link: '/codex/skills/official' },
            { text: '社区 Skill 推荐', link: '/codex/skills/community' },
            { text: '安装与安全审计', link: '/codex/skills/install-audit' },
            { text: '从零创建自己的 Skill', link: '/codex/skills/create' }
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
      message: '程序员小枫同学：让普通工作与软件开发都走到真实交付。',
      copyright: 'Copyright © 2026 程序员小枫同学'
    }
  }
})
