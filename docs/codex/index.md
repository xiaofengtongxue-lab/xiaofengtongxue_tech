---
title: Codex 实战教程
description: 为普通工作者和开发者分别设计的 Codex 与 ChatGPT Work 实战教程，覆盖办公文件、PPT、电商、内容创作、软件开发、Skills、MCP 和自动化。
---

# Codex 实战教程：普通人和开发者双路线

这套教程不再假设每位读者都是程序员。普通工作者可以从 ChatGPT Work、文件预览、PPT、电商、研究和内容创作开始；开发者可以从 Codex、代码库、调试、测试和自动化开始。两条路线都以真实交付、人工验收和安全边界为终点。

> 内容核验日期：2026 年 7 月 11 日。普通用户路线以当日 ChatGPT 桌面应用官方资料为基线；开发者命令以 Codex CLI `0.144.1` 为验证基线。产品入口会随版本、套餐和工作区策略变化，以你当前界面和官方说明为准。

## 先按你要完成的工作选择

### 我不写代码，只想把工作做完

进入 [普通人完整学习路线](/codex/everyday/)。你会先在 20–30 分钟内完成一个真实文件，再学习项目与附件、任务说明、Word/PPT/表格/PDF 验收、隐私权限、Skills、Plugins 和复用工作流。

这条路线默认不要求终端、Git、代码、Markdown 或脚本经验。

### 我是开发者，要让 Codex 参与项目

从 [Codex 是什么](/codex/start/what-is-codex) 开始，依次完成安全入门、真实项目工作流和专家进阶。你会使用 App、CLI、IDE、代码库、测试、AGENTS.md、MCP、Hooks、Subagents 和 CI。

### 我已经有具体目标

- PPT、电商、漫剧、办公文件、研究或内容制作：进入 [场景实战](/codex/practice/)。
- 只想学会给任务说清要求：普通用户看 [任务说明法](/codex/everyday/task-brief)，开发者看 [Codex 提示与任务设计](/codex/start/prompting)。
- 想使用现成能力：普通用户看 [Skill 和 Plugin 入门](/codex/everyday/skills-plugins)，技术用户看 [Codex Skill 推荐](/codex/skills/)。
- 正在接手代码项目：进入 [读懂陌生代码库](/codex/workflows/understand-codebase)。

## 为什么普通办公任务不一定要选 Codex

当前官方产品把入口分得很清楚：

| 入口 | 适合任务 |
| --- | --- |
| Chat | 快速问题、解释、头脑风暴和短草稿 |
| ChatGPT Work | PPT、报告、表格、研究、计划和其他可审核成品 |
| Codex | 软件开发、代码库和开发工具任务 |

如果你以前已经使用 Codex 完成非编程工作，可以继续；但普通用户第一次做文件和办公任务时，Work 往往更直观。本站把这些教程放在 Codex 大栏目中，是为了提供一套从文件能力到 Skills、Plugins 和自动化的连续学习路径，不是为了把所有工作都叫作编程。

## 普通用户完整路线

1. [不用写代码完成第一份工作文件](/codex/everyday/first-result)
2. [理解项目、任务、附件和本地文件夹](/codex/everyday/projects-files)
3. [用普通话说清任务](/codex/everyday/task-brief)
4. [检查 Word、PPT、表格和 PDF](/codex/everyday/review-revise)
5. [保护隐私，读懂权限和审批](/codex/everyday/safety)
6. [使用 Skill 和 Plugin](/codex/everyday/skills-plugins)
7. [把一次成功任务变成可复用工作流](/codex/everyday/repeat-workflow)

完成后，你应该能在不依赖技术同事的情况下准备资料、生成草稿、局部修改、下载文件、验证事实，并把发送、发布、付款和删除留在人工批准前。

## 开发者从新手到专家路线

### 第一阶段：安全地完成第一次代码任务

1. [认识 Codex 的工作方式](/codex/start/what-is-codex)
2. [选择 App、CLI、IDE 还是云任务](/codex/start/choose-surface)
3. [安装、登录与环境检查](/codex/start/install-login)
4. [完成第一次可验证任务](/codex/start/first-task)
5. [写出不容易跑偏的任务说明](/codex/start/prompting)
6. [掌握权限、沙箱与工作区安全](/codex/start/permissions)

完成这一阶段后，你应该能让 Codex 在明确边界内读取项目、做一处小改动、运行验证，并且能够自己判断结果是否可信。

### 第二阶段：跑通真实项目工作流

1. [读懂陌生代码库](/codex/workflows/understand-codebase)
2. [复现并修复 Bug](/codex/workflows/fix-bugs)
3. [开发一个完整功能](/codex/workflows/build-feature)
4. [补测试与建立验证门槛](/codex/workflows/testing)
5. [根据截图实现和迭代界面](/codex/workflows/ui-from-screenshot)
6. [做可回退的重构与迁移](/codex/workflows/refactor)
7. [代码审查、Git 与 PR 闭环](/codex/workflows/code-review-git)
8. [更新文档并准备发布](/codex/workflows/docs-release)

这一阶段的目标不是“让 Codex 多写代码”，而是让每一次修改都有证据、有边界、能审查、能回退。

### 第三阶段：把个人经验固化成系统

1. [用 AGENTS.md 固化项目规则](/codex/advanced/agents-md)
2. [用 config.toml 管理模型、权限和项目配置](/codex/advanced/config)
3. [用 MCP 连接外部资料和工具](/codex/advanced/mcp)
4. [安装和管理 Plugins](/codex/advanced/plugins)
5. [用云任务与 worktree 并行工作](/codex/advanced/cloud-worktrees)
6. [创建定时任务和持续目标](/codex/advanced/automation)
7. [用 codex exec 和 GitHub Actions 做自动化](/codex/advanced/exec-ci)
8. [用 Hooks 与 Rules 建立机械护栏](/codex/advanced/hooks-rules)
9. [用 Subagents 拆解复杂任务](/codex/advanced/subagents)
10. [用 SDK 与 App Server 集成 Codex](/codex/advanced/sdk-app-server)
11. [团队安全与数据边界](/codex/advanced/security)
12. [常见故障的分层排查](/codex/advanced/troubleshooting)

## 办公、商业与创作实战

[场景实战](/codex/practice/)不是提示词展览。每个场景都提供不写代码的起步方式，并把脚本、自动化和程序化验证标为可选增强：

- [制作可交付的 PPT](/codex/practice/ppt)
- [搭建电商运营工作流](/codex/practice/ecommerce)
- [制作 AI 漫剧与短片](/codex/practice/comic-drama)
- [处理 Word、Excel、PDF](/codex/practice/documents-spreadsheets-pdf)
- [完成带来源的研究报告](/codex/practice/research-report)
- [分析数据并制作可视化](/codex/practice/data-analysis)
- [从想法做到可运行 Web 应用](/codex/practice/web-app)
- [制作图文、短视频与内容素材](/codex/practice/content-video)

## 两条路线共同的完成标准

每章都尽量给出五类信息：

1. **要交付什么**：先定义成品，而不是先背命令。
2. **给任务什么资料**：文件、错误、截图、数据和业务限制。
3. **允许它做什么**：文件范围、网络、应用和外部操作边界。
4. **怎样验证**：预览、来源、原生软件、命令、页面或人工审核清单。
5. **失败怎样处理**：常见症状、原因和下一步检查。

如果一个任务只有“AI 说完成了”，却没有能打开的成品、来源对照或可重复的检查结果，就还没有真正完成。

## 关于账号、模型和第三方服务

本站讲 ChatGPT Work 与 Codex 的通用方法。OpenAI 账号、套餐、模型可用性和产品界面可能变化，请以当日官方页面为准。普通用户连接 Plugin 前先看数据范围和读写权限；技术用户安装第三方 MCP 或社区 Skill 时还要审查源码、脚本、许可证和隐私条款。

如果你需要配置 Codex 使用 CCWS，请前往 [CCWS Codex 配置文档](https://docs.ccws.pro/guide/codex)。本站不会重复 CCWS 的注册、充值、API Key、计费和售后步骤。
