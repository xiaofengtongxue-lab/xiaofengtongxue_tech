# AGENTS.md — 程序员小枫同学技术教程站约定

## Overview

本仓库是“程序员小枫同学”的 VitePress 技术教程发布站点。站点既服务希望学习 AI、大模型、AI Agent、Codex、Java、JavaScript、TypeScript、Go 和软件工程实践的开发者，也服务希望使用 Codex 完成办公、运营、电商、内容创作、研究和管理任务的非程序员。

这不是内容策划仓库，也不是 CCWS 产品说明书。仓库保存教程正文、站点配置和部署所需文件；教程可以继续编辑，但公开构建只读取明确确认过的 Git 版本。

## Worktree Safety

- 任何情况下都不要使用 `git restore`，包括撤销当前任务产生的修改。
- 不要使用 `git reset --hard`、`git checkout --` 或其他命令回滚本地文件。
- 本地修改默认属于正在进行的任务。与当前任务无关的修改应忽略或绕开，不得覆盖、删除或清理。
- 如果需要调整已经写入的内容，使用 `apply_patch` 或其他明确、可审查的非 Git 编辑方式，只修改目标行。
- 未经用户明确要求，不要暂存、提交、推送、创建远程仓库或发布站点。

## Repository Boundary

本仓库允许保存：

- `docs/` 下主题明确的教程正文和栏目页，包括定稿后的继续编辑版本
- VitePress 配置、主题和公开静态资源
- `README.md`、`AGENTS.md` 和必要的部署说明
- `package.json`、锁文件和 GitHub Actions 工作流

本仓库不允许保存：

- 内容规划、选题库、发布排期和运营方案
- 未整理的素材、调研笔记、聊天记录和参考资料归档
- 只有零散片段、聊天记录或素材堆积的文章草稿
- 等待筛选的截图、附件和临时输出
- 真实 API Key、账号、密码、Cookie、Token 或其他凭证

本机的规划、选题、素材和调研笔记统一放在：

```text
/Users/xiaofengtongxue/Coding/knowledge-workspace/knowledge-base/我的知识库/自媒体/公众号/小枫同学AI/技术教程站/
```

当前内容规划文件为：

```text
00-技术教程站内容规划.md
```

从知识库向本仓库迁入内容时，只迁入主题和文章结构已经明确、适合继续整理为公开教程的正文。不要直接批量复制整个素材目录。

## Tech Stack

- 静态站点：VitePress
- 文档目录：`docs/`
- VitePress 配置：`docs/.vitepress/config.mts`
- 公共静态文件：`docs/public/`
- GitHub Pages 工作流：`.github/workflows/deploy.yml`
- 本地开发：`npm run docs:dev`
- 构建验证：`npm run docs:build`
- 草稿产物预览：`npm run docs:build:drafts`
- 本地预览：`npm run docs:preview`

## Content Publication Workflow

- 每篇教程只维护 `docs/` 下这一份 Markdown，不创建永久的“草稿版”和“发布版”副本。
- 日常提交只表示保存编辑记录，不等于公开定稿。
- `publishedRevision` 保存这篇文章当前确认公开的完整 Git commit SHA；该字段只能由 `npm run content:approve -- <文件>` 修改，不要手工填写或改写。
- 没有 `publishedRevision` 的页面在公开构建中只生成“文章正在拼命赶稿中”占位页，并设置 `noindex,follow`，同时排除 sitemap、站内搜索和 `llms.txt`。
- 有 `publishedRevision` 的页面由构建脚本通过 `git show <revision>:<path>` 读取定稿正文。当前 Markdown 后续继续编辑时，线上仍保持旧定稿，直到再次确认。
- 确认一篇文章时，先提交正文得到提交 A，再运行 `npm run content:approve -- docs/path.md`，检查只改动了 `publishedRevision`，最后把这个指针变更提交为提交 B。
- `npm run content:status` 用来区分“与定稿一致”“继续编辑中”“未定稿”和“配置无效”。
- GitHub Actions 必须保留完整 Git 历史（`fetch-depth: 0`），否则无法读取旧定稿。
- 仓库若为公开仓库，未定稿正文虽然不会进入网站产物，仍可从 GitHub 源码和 Git 历史中看到；敏感信息任何时候都不能写进仓库。
- 已发布正文引用的图片和下载文件使用稳定、版本化文件名；确认新版本前不要覆盖或删除旧资源。

## Deployment URLs

GitHub Pages 阶段：

- 站点地址：`https://tutorial.xiaofengtongxue.com/`
- VitePress Base：`/`

备案后的正式地址：

- 站点地址：`https://www.xiaofengtongxue.com/`
- VitePress Base：`/`

站点通过环境变量切换两种发布方式：

- `SITE_URL`
- `VITEPRESS_BASE`

GitHub Pages 自定义域名通过 `docs/public/CNAME` 声明为 `tutorial.xiaofengtongxue.com`。切换域名时，必须同时检查 canonical、sitemap、`robots.txt`、`llms.txt`、静态资源路径和 GitHub Pages 设置。

## Brand And Positioning

- IP、公众号和公开站点名称统一使用“程序员小枫同学”。
- 站点定位是面向开发者与普通工作者的系统化实操教程，不是新闻聚合、泛科技资讯或工具功能搬运站。
- 内容应帮助读者完成具体任务、理解技术原理、解决真实错误或建立可复用的工程方法。
- Codex 大栏目必须同时提供普通用户路线和开发者路线。普通用户路线默认不要求终端、Git、代码仓库、Markdown 或脚本经验，并优先使用桌面应用、自然语言、文件预览和人工验收完成真实工作。
- 不把非程序员称为“小白”，也不默认他们缺乏业务能力；只解释完成任务所需的技术概念，并为高级操作提供渐进式入口。
- AI 是核心内容之一，但不是唯一范围；Java、JavaScript、TypeScript、Go 和通用软件工程均属于正式内容范围。
- 避免空泛营销语言、焦虑式标题和未经验证的绝对结论。

## Content Scope

主要栏目及路径：

| 栏目 | 路径 | 内容范围 |
| --- | --- | --- |
| AI 编程 | `/ai/` | AI 辅助开发、项目理解、任务拆分、调试和验证 |
| 大模型技术 | `/llm/` | Token、上下文、推理、Tool Calling、RAG 和模型应用 |
| AI Agent | `/agents/` | Agent 架构、工具、状态、记忆、工作流和评测 |
| Codex | `/codex/` | 普通用户办公与创作、App、CLI、AGENTS.md、Skills、MCP 和代码审查 |
| Java | `/java/` | Java、Spring Boot、数据访问、并发和服务端工程 |
| JavaScript | `/javascript/` | JavaScript、TypeScript、Node.js 和前端工程 |
| Go | `/go/` | Go、并发、Web 服务和工程化实践 |
| 工程实践 | `/engineering/` | 架构、数据库、测试、部署、安全和可观测性 |
| 开发工具 | `/tools/` | Git、IDE、终端、调试工具、MCP 和效率工具 |

## CCWS Boundary

通用技术教程可以提到 CCWS，但不要复制 CCWS 产品文档。

以下内容属于 `https://docs.ccws.pro/`：

- CCWS 注册、登录、充值和兑换码
- CCWS API Key 的创建步骤
- `https://www.ccws.pro/v1` 的具体配置
- CCWS 余额、权限、模型、计费和售后问题
- CCWS Codex Image Skill、`CCWS_IMAGE_API_KEY` 和相关安装步骤
- 使用 CCWS 时出现的 401、403、429、model not found 等产品排查

本技术站可以解释 API Key、Base URL、HTTP 状态码、Codex 安装等通用概念；涉及 CCWS 的具体操作时，应链接到对应的 CCWS 文档页面作为唯一事实来源。

## Source And Fact Rules

- 产品行为、版本、命令、参数、模型能力和接口限制等可能变化的事实，优先使用当前官方文档、官方仓库、发布说明或实际运行结果。
- Java/JDK、Spring、Node.js、JavaScript、TypeScript、Go 和相关框架内容应优先引用各项目官方资料。
- Codex 和 OpenAI 产品内容应以当前 OpenAI 官方文档为准。
- 不要编造版本支持、性能结果、价格、市场份额、模型能力、稳定性或兼容性结论。
- 未实际验证的工具接入和兼容性必须明确写成“未验证”或不发布。
- 版本敏感教程应记录验证日期、操作系统、工具版本或必要的运行环境。
- 引用第三方观点时，应区分官方事实、作者经验和待验证判断。

## Content Style

- 使用简体中文和用户教程语言，保留必要的专业术语。
- 每个公共页面必须有简洁的 `title` 和 `description` frontmatter。
- 每页只使用一个清晰的 `#` 标题，标题应对应读者的真实搜索或操作意图。
- 开头第一段直接说明适用人群、要解决的问题和完成后的结果。
- 教程优先包含前置条件、操作步骤、可复制命令、预期结果、验证方法和故障排查。
- 代码块应标注语言；命令、路径、环境变量和配置字段必须保持精确。
- 不要求读者把真实密钥粘贴到聊天窗口，示例统一使用明显的占位符。
- 不把只有标题、关键词和零散素材的薄内容标记为定稿；未定稿页面由公开构建统一生成占位页。
- 不把内容规划、栏目排期或内部运营说明写进公开教程。
- 内部链接应帮助读者找到前置知识、下一步和相关故障排查，而不是为了堆叠关键词。

## SEO And GEO

每次新增、编辑、删除或重命名公共页面，都要同时考虑 SEO 和 GEO。

### Adding A Page

- 添加与页面搜索意图一致的 `title`、`description` 和唯一 `#` 标题。
- 开头直接给出可引用的简洁答案，再展开步骤和解释。
- 添加必要的前置教程、后续教程和相关故障排查链接。
- 页面需要被用户发现时，同步更新 `docs/.vitepress/config.mts` 的导航或侧边栏。
- VitePress 会生成 sitemap；构建后确认新页面 URL 正确出现。
- 新页面形成新的权威解释、技术路径或主题集群时，更新 `docs/public/llms.txt`。
- 不要为了覆盖关键词创建内容高度重复的近似页面。

### Editing A Page

- 重新检查 `title` 和 `description` 是否仍与页面内容一致。
- 保持命令、环境变量、版本、路径、URL 和代码示例精确。
- 如果修改了规范性结论，搜索并同步更新其他受影响页面和 `llms.txt`。
- 除非确有必要，不要改变已公开页面的路径。

### Deleting Or Renaming A Page

- 搜索并更新导航、侧边栏、栏目首页、相关文章和 `llms.txt` 中的所有链接。
- 构建后确认旧链接没有继续出现在站点资源中。
- 已公开或可能被收录的 URL 优先保留兼容页或配置重定向，不要直接删除。
- 使用 `rg` 搜索旧路径、旧标题和失效锚点。

## Public Files

- `docs/public/robots.txt`：当前站点抓取规则和 sitemap 地址
- `docs/public/llms.txt`：站点范围、主要栏目、权威入口和内容边界
- `docs/public/CNAME`：GitHub Pages 自定义域名，当前为 `tutorial.xiaofengtongxue.com`

不要把内部规划、私有素材、凭证、用户数据或未发布事实写入这些公开文件。

## Validation

完成文档或配置修改后，根据变更范围执行：

```bash
npm run content:test
npm run content:status
npm run docs:build
npm run docs:check
git diff --check
```

还需要检查：

- 新增页面是否出现在导航、侧边栏和生成的 sitemap 中
- 未定稿页面是否为 `noindex,follow`，并且没有进入 sitemap、搜索索引和 `llms.txt`
- canonical 是否使用当前正确域名和路径
- GitHub Pages 的静态资源是否使用根路径，并且不再包含 `/xiaofengtongxue_tech/`
- 内部链接、外部链接和标题锚点是否有效
- 是否出现真实密钥、账号、密码、Token、Cookie 或其他敏感信息
- 是否混入内容规划、素材笔记、草稿、旧品牌或不相关项目名称
- 版本敏感结论是否有当前官方来源或实际验证依据

修改域名、Base、canonical 或部署配置时，额外运行正式域名构建验证：

```bash
SITE_URL=https://www.xiaofengtongxue.com VITEPRESS_BASE=/ npm run docs:build
```

验证正式域名构建后，再运行一次默认 `npm run docs:build`，确保本地输出恢复为当前 GitHub Pages 配置。
