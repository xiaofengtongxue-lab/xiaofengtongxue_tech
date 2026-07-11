---
title: Codex 实战教程
description: 从第一次打开项目到团队自动化的 Codex 系统实战教程，覆盖 App、CLI、IDE、AGENTS.md、Skills、MCP、代码审查与非代码工作流。
---

# Codex 实战教程

这套教程写给希望让 Codex 真正参与交付的人。你不会只学到一组命令或名词，而是会依次完成项目理解、问题复现、代码修改、测试验证、代码审查、自动化和跨工具协作，最终形成一套可以重复使用的工程工作流。

> 内容核验日期：2026 年 7 月 11 日。涉及命令的页面以 Codex CLI `0.144.1` 和当日 OpenAI 官方资料为基线；如果你的界面或参数不同，请先运行 `codex --version` 和 `codex --help`。

## 先选你的入口

- 完全没用过 Codex：从 [Codex 是什么](/codex/start/what-is-codex) 开始。
- 已经安装，但回答经常跑偏：直接学习 [怎样给 Codex 写任务](/codex/start/prompting)。
- 正在接手真实项目：进入 [读懂陌生代码库](/codex/workflows/understand-codebase)。
- 已经能完成普通改动：进入 [AGENTS.md 实战](/codex/advanced/agents-md) 和 [Codex 配置实战](/codex/advanced/config)。
- 想用 Codex 做 PPT、电商或漫剧：进入 [Codex 技巧与场景实战](/codex/practice/)。
- 想安装或制作 Skill：进入 [Codex Skill 推荐](/codex/skills/)。

## 从新手到专家的完整路线

### 第一阶段：安全地完成第一次任务

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

### 第四阶段：把 Codex 用到更多工作里

[Codex 技巧与场景实战](/codex/practice/)不是提示词展览，而是完整生产流程。每个场景都包含输入准备、中间产物、质量检查和人工审核点：

- [制作可交付的 PPT](/codex/practice/ppt)
- [搭建电商运营工作流](/codex/practice/ecommerce)
- [制作 AI 漫剧与短片](/codex/practice/comic-drama)
- [处理 Word、Excel、PDF](/codex/practice/documents-spreadsheets-pdf)
- [完成带来源的研究报告](/codex/practice/research-report)
- [分析数据并制作可视化](/codex/practice/data-analysis)
- [从想法做到可运行 Web 应用](/codex/practice/web-app)
- [制作图文、短视频与内容素材](/codex/practice/content-video)

## 这套教程怎样判断“学会了”

每章都尽量给出五类信息：

1. **要交付什么**：先定义成品，而不是先背命令。
2. **给 Codex 什么上下文**：文件、错误、截图、数据和业务限制。
3. **允许它做什么**：修改范围、网络访问和外部操作边界。
4. **怎样验证**：命令、页面、差异、数据或人工审核清单。
5. **失败怎样处理**：常见症状、原因和下一步检查。

如果一个任务只有“Codex 说完成了”，却没有可重复的检查结果，就还没有真正完成。

## 关于账号、模型和第三方服务

本站讲通用 Codex 方法。OpenAI 账号、套餐、模型可用性和产品界面可能变化，请以当日官方页面为准。涉及第三方插件、MCP 或社区 Skill 时，先阅读其源码、权限、许可证和隐私条款，再决定是否连接真实数据。

如果你需要配置 Codex 使用 CCWS，请前往 [CCWS Codex 配置文档](https://docs.ccws.pro/guide/codex)。本站不会重复 CCWS 的注册、充值、API Key、计费和售后步骤。
