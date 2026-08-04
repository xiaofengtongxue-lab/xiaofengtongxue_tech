import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitepress'
import type { HeadConfig, TransformContext } from 'vitepress'

const defaultBase = '/'
const defaultSiteUrl = 'https://www.xiaofengtongxue.com'
const base = normalizeBase(process.env.VITEPRESS_BASE || defaultBase)
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || defaultSiteUrl)
const parsedSiteUrl = new URL(siteUrl)
const siteOrigin = parsedSiteUrl.origin
const sitePath = parsedSiteUrl.pathname.replace(/\/$/, '')
const siteTitle = '程序员小枫同学'
const siteDescription = '程序员小枫同学面向 AI 时代的工程师与技术实践者，分享 AI 编程、AI Agent、Skill、MCP、编程语言与软件工程方法。'
const brandImageUrl = `${siteUrl}/programmer-xiaofeng-ip.png`
const authorId = `${siteUrl}/#author`
const authorUrl = `${siteUrl}/about`
const websiteId = `${siteUrl}/#website`
const authorSameAs = ['https://github.com/xiaofengtongxue-lab']
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()
const baiduSiteVerification = process.env.BAIDU_SITE_VERIFICATION?.trim()

type SchemaNode = Record<string, unknown>
type PageFrontmatter = Record<string, unknown>

type FaqItem = {
  question: string
  answer: string
}

type HowToStep = {
  name: string
  text: string
}

type BreadcrumbItem = {
  name: string
  path: string
}

type PublishedPage = {
  relativePath: string
  route: string
  lastUpdated: string
}

type DraftPage = {
  relativePath: string
  route: string
}

type PublishedContentManifest = {
  version: number
  published: PublishedPage[]
  drafts: DraftPage[]
}

const publishedContentManifest = readPublishedContentManifest()
const publishedPageByPath = new Map(
  publishedContentManifest?.published.map((page) => [page.relativePath, page]) || []
)
const publishedPageByRoute = new Map(
  publishedContentManifest?.published.map((page) => [routeKey(page.route), page]) || []
)
const draftPathSet = new Set(
  publishedContentManifest?.drafts.map((page) => page.relativePath) || []
)
const draftRouteSet = new Set(
  publishedContentManifest?.drafts.map((page) => routeKey(page.route)) || []
)

function normalizeBase(value: string) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function normalizeSiteUrl(value: string) {
  return value.replace(/\/$/, '')
}

function routeKey(value: string) {
  let route = value.split(/[?#]/, 1)[0] || '/'
  if (!route.startsWith('/')) route = `/${route}`
  route = route.replace(/\/{2,}/g, '/')
  if (route !== '/') route = route.replace(/\/$/, '')
  return route
}

function readPublishedContentManifest(): PublishedContentManifest | undefined {
  const filename = process.env.PUBLISHED_CONTENT_MANIFEST
  if (!filename) return undefined

  try {
    const manifest = JSON.parse(readFileSync(filename, 'utf8')) as PublishedContentManifest
    if (manifest.version !== 1 || !Array.isArray(manifest.published) || !Array.isArray(manifest.drafts)) {
      throw new Error('unsupported manifest format')
    }
    return manifest
  } catch (error) {
    throw new Error(`无法读取发布内容清单 ${filename}: ${(error as Error).message}`)
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readFaq(frontmatter: PageFrontmatter): FaqItem[] {
  if (!Array.isArray(frontmatter.faq)) return []

  return frontmatter.faq.flatMap((item) => {
    if (!isRecord(item) || typeof item.question !== 'string' || typeof item.answer !== 'string') {
      return []
    }

    const question = item.question.trim()
    const answer = item.answer.trim()
    return question && answer ? [{ question, answer }] : []
  })
}

function readHowTo(frontmatter: PageFrontmatter): { name?: string; steps: HowToStep[] } {
  if (!isRecord(frontmatter.howTo) || !Array.isArray(frontmatter.howTo.steps)) {
    return { steps: [] }
  }

  const steps = frontmatter.howTo.steps.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.text !== 'string') {
      return []
    }

    const name = item.name.trim()
    const text = item.text.trim()
    return name && text ? [{ name, text }] : []
  })

  return {
    name: typeof frontmatter.howTo.name === 'string' ? frontmatter.howTo.name.trim() : undefined,
    steps
  }
}

function readBreadcrumbs(frontmatter: PageFrontmatter): BreadcrumbItem[] {
  if (!Array.isArray(frontmatter.breadcrumbs)) return []

  return frontmatter.breadcrumbs.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.path !== 'string') {
      return []
    }

    const name = item.name.trim()
    const path = item.path.trim()
    return name && path.startsWith('/') ? [{ name, path }] : []
  })
}

function toIsoDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function structuredData(context: TransformContext): SchemaNode {
  const { pageData, title, description } = context
  const path = pagePath(pageData.relativePath)
  const url = pageUrl(pageData.relativePath)
  const isHome = path === '/'
  const frontmatter = pageData.frontmatter as PageFrontmatter
  const isProfile = frontmatter.schemaType === 'ProfilePage'
  const isArticle = !isHome && !isProfile
  const pageName = isHome ? siteTitle : pageData.title || title
  const pageNode: SchemaNode = {
    '@type': isHome ? 'WebPage' : isProfile ? 'ProfilePage' : 'TechArticle',
    '@id': `${url}#webpage`,
    url,
    name: pageName,
    description,
    image: brandImageUrl,
    inLanguage: 'zh-CN',
    isPartOf: { '@id': websiteId },
    author: { '@id': authorId },
    publisher: { '@id': authorId }
  }

  if (isArticle) {
    pageNode.headline = pageName
    pageNode.mainEntityOfPage = url
    pageNode.isAccessibleForFree = true
  }

  if (isProfile) {
    pageNode.mainEntity = { '@id': authorId }
  }

  const datePublished = toIsoDate(frontmatter.datePublished)
  if (isArticle && datePublished) {
    pageNode.datePublished = datePublished
  }

  if (pageData.lastUpdated) {
    pageNode.dateModified = new Date(pageData.lastUpdated).toISOString()
  }

  const graph: SchemaNode[] = [
    {
      '@type': 'Person',
      '@id': authorId,
      name: siteTitle,
      url: authorUrl,
      description: '“程序员小枫同学”网站与同名公众号的内容主体，持续整理 AI 编程、AI Agent 与软件工程实操教程。',
      image: brandImageUrl,
      jobTitle: '技术教程作者',
      sameAs: authorSameAs,
      knowsAbout: ['AI 编程', 'AI Agent', 'Model Context Protocol', 'Agent Skills', '软件工程']
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${siteUrl}/`,
      name: siteTitle,
      description: siteDescription,
      image: brandImageUrl,
      inLanguage: 'zh-CN',
      creator: { '@id': authorId },
      publisher: { '@id': authorId }
    },
    pageNode
  ]

  if (!isHome) {
    const breadcrumbs = readBreadcrumbs(frontmatter)
    const breadcrumbElements = [
      {
        '@type': 'ListItem',
        position: 1,
        name: siteTitle,
        item: `${siteUrl}/`
      },
      ...breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        item: `${siteUrl}${item.path}`
      })),
      {
        '@type': 'ListItem',
        position: breadcrumbs.length + 2,
        name: pageName,
        item: url
      }
    ]

    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumbElements
    })
  }

  const faq = readFaq(frontmatter)
  if (faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    })
  }

  const howTo = readHowTo(frontmatter)
  if (howTo.steps.length > 0) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: howTo.name || pageName,
      description,
      inLanguage: 'zh-CN',
      step: howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text
      }))
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
  const frontmatter = pageData.frontmatter as PageFrontmatter
  const isProfile = frontmatter.schemaType === 'ProfilePage'
  const isDraft = frontmatter.publishedDraft === true
  const robots = frontmatter.noindex === true
    ? 'noindex,follow'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
  const head: HeadConfig[] = [
    ['meta', { name: 'robots', content: robots }],
    ['meta', { name: 'googlebot', content: robots }],
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:type', content: isHome || isDraft ? 'website' : isProfile ? 'profile' : 'article' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:image', content: brandImageUrl }],
    ['meta', { property: 'og:image:width', content: '1254' }],
    ['meta', { property: 'og:image:height', content: '1254' }],
    ['meta', { property: 'og:image:alt', content: `${siteTitle} IP 形象` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: brandImageUrl }],
    ['meta', { name: 'twitter:image:alt', content: `${siteTitle} IP 形象` }]
  ]

  if (!isDraft) {
    head.push(['script', { type: 'application/ld+json' }, JSON.stringify(structuredData(context))])
  }

  if (!isHome && !isDraft && pageData.lastUpdated) {
    head.push([
      'meta',
      { property: 'article:modified_time', content: new Date(pageData.lastUpdated).toISOString() }
    ])
  }

  const datePublished = toIsoDate(frontmatter.datePublished)
  if (!isHome && !isProfile && !isDraft && datePublished) {
    head.push(['meta', { property: 'article:published_time', content: datePublished }])
  }

  return head
}

export default defineConfig({
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  base,
  srcExclude: [
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
  transformPageData: (pageData) => {
    if (draftPathSet.has(pageData.relativePath)) {
      return { lastUpdated: undefined }
    }

    const publishedPage = publishedPageByPath.get(pageData.relativePath)
    if (!publishedPage) return undefined

    return { lastUpdated: Date.parse(publishedPage.lastUpdated) }
  },
  sitemap: {
    hostname: siteOrigin,
    transformItems: (items) => items
      .filter((item) => !draftRouteSet.has(routeKey(item.url)))
      .map((item) => ({
        ...item,
        lastmod: publishedPageByRoute.get(routeKey(item.url))?.lastUpdated || item.lastmod,
        url: `${sitePath}/${item.url}`.replace(/\/{2,}/g, '/')
      }))
  },
  head: [
    ['meta', { name: 'author', content: siteTitle }],
    ['meta', { name: 'application-name', content: siteTitle }],
    ['meta', { name: 'theme-color', content: '#e65332' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ...(googleSiteVerification
      ? [['meta', { name: 'google-site-verification', content: googleSiteVerification }] as HeadConfig]
      : []),
    ...(baiduSiteVerification
      ? [['meta', { name: 'baidu-site-verification', content: baiduSiteVerification }] as HeadConfig]
      : []),
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
      {
        text: 'Codex 教程',
        activeMatch: '^/codex/',
        items: [
          {
            text: '学习路线',
            items: [
              { text: '教程总览', link: '/codex/' },
              { text: '普通用户路线', link: '/codex/everyday/' },
              { text: '开发者入门', link: '/codex/start/what-is-codex' }
            ]
          },
          {
            text: '实践与进阶',
            items: [
              { text: '项目工作流', link: '/codex/workflows/understand-codebase' },
              { text: '场景实战', link: '/codex/practice/' },
              { text: 'Skill 推荐', link: '/codex/skills/' },
              { text: '高级能力', link: '/codex/advanced/agents-md' }
            ]
          }
        ]
      },
      {
        text: 'AI Agent',
        activeMatch: '^/agents/',
        items: [
          {
            text: '按起点学习',
            items: [
              { text: '教程总览', link: '/agents/' },
              { text: '零基础导读', link: '/agents/start/what-is-agent' },
              { text: '上手做一个 Agent', link: '/agents/build/from-chat-to-agent' }
            ]
          },
          {
            text: '工程进阶',
            items: [
              { text: 'Tool Calling 深入', link: '/agents/advanced/tool-calling' },
              { text: 'MCP 架构', link: '/agents/advanced/mcp' },
              { text: '生产系统设计', link: '/agents/advanced/system-design' }
            ]
          }
        ]
      }
    ],
    sidebar: {
      '/agents/': [
        {
          text: '先选学习路线',
          items: [
            { text: 'AI Agent 教程总览', link: '/agents/' }
          ]
        },
        {
          text: '零基础：先建立正确直觉',
          collapsed: false,
          items: [
            { text: 'AI Agent 和聊天有什么区别', link: '/agents/start/what-is-agent' },
            { text: '装好四样东西再开始', link: '/agents/start/prepare' }
          ]
        },
        {
          text: '动手做：做出一个可靠的单 Agent',
          collapsed: false,
          items: [
            { text: '十分钟跑通第一个 Agent', link: '/agents/build/from-chat-to-agent' },
            { text: 'Tool Calling 到底是什么', link: '/agents/build/tool-calling' },
            { text: 'Agent 怎样循环干活', link: '/agents/build/agent-loop' },
            { text: '给 Agent 设计工具', link: '/agents/build/tool-design' },
            { text: '任务中断了怎样恢复', link: '/agents/build/state-checkpoints' },
            { text: 'Agent 能写文件了，怎么不乱来', link: '/agents/build/approval-verification' },
            { text: '给 Agent 建一套考试', link: '/agents/build/evaluation' }
          ]
        },
        {
          text: '往深走：把演示项目变成工程系统',
          collapsed: true,
          items: [
            { text: 'Tool Calling 进阶', link: '/agents/advanced/tool-calling' },
            { text: 'MCP 是什么', link: '/agents/advanced/mcp' },
            { text: '上下文工程', link: '/agents/advanced/context' },
            { text: 'Agent 记忆系统', link: '/agents/advanced/memory' },
            { text: 'Agent 评测进阶', link: '/agents/advanced/evaluation' },
            { text: '多 Agent 值得吗', link: '/agents/advanced/multi-agent' },
            { text: 'Agent 被攻击了怎么办', link: '/agents/advanced/security' },
            { text: '把 Agent 送上生产', link: '/agents/advanced/system-design' }
          ]
        }
      ],
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
      message: `程序员小枫同学：用好新工具，练好工程内功，做出可靠交付。 · <a href="${base}about">关于本站</a>`,
      copyright: 'Copyright © 2026 程序员小枫同学 · <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2024331172号</a>'
    }
  }
})
