---
publishedRevision: "d969b64c609d30f7f415c2b3016b8bee91b54ce1"
title: Codex 实战教程
description: 为普通工作者和开发者分别设计的 Codex 与 ChatGPT Work 实战教程，覆盖办公文件、PPT、电商、内容创作、软件开发、Skills、MCP 和自动化。
---

# Codex 实战教程：普通人和开发者双路线

嘿，我是小枫。Codex 是 OpenAI 的 AI 助手，和普通聊天不一样：给它一个目标，它会自己读文件、查资料、动手做，还会自己验证结果，直到把事情做完。普通工作者拿它做 PPT、表格、报告；开发者拿它读代码库、写代码、修 Bug。

所以这套教程我拆成了两条学习线——一条给不写代码的普通工作者，一条给天天跟终端打交道的开发者。你不用从头读到尾，按自己的角色挑着看就行。

## 学完这个栏目，你能得到什么

如果你不写代码：你会用大白话让 AI 做出能交付的 PPT、表格、报告和内容，看得懂它在干什么，敢检查、敢交付，还能把成功的方法存下来下次直接套用。

如果你是开发者：你能让 AI 参与一个项目的完整生命周期——读代码、修 Bug、做功能、补测试、审查和发布，每一步都有证据、能验证、可回退。

不管走哪条路线，你都会逐渐看懂 AI 是怎么一步步把任务做完的——这也是理解所有同类工具的共同基础。

> 内容核验日期：2026 年 7 月 11 日。普通用户路线以当日 ChatGPT 桌面应用官方资料为基线；开发者命令以 Codex CLI `0.144.1` 为验证基线。产品入口会随版本、套餐和工作区策略变化，以你当前界面和官方说明为准。

## 先看看你想干什么

### 我不写代码，就想把活儿干完

直接去 [普通人完整学习路线](/codex/everyday/)。头 20–30 分钟你会跟着做完一个真实文件，然后逐步了解项目与附件、怎么把任务说清楚、Word/PPT/表格/PDF 验收、隐私权限、Skills、Plugins，以及怎么把一个成功任务变成下次能直接套用的流程。

这条路线不需要你碰终端、Git、代码、Markdown 或者任何脚本，放心。

### 我是搞开发的，想让 Codex 参与项目

从 [Codex 是什么](/codex/start/what-is-codex) 开始看，然后按顺序走安全入门 → 真实项目工作流 → 专家进阶。你会用到 App、CLI、IDE、代码库、测试、AGENTS.md、MCP、Hooks、Subagents 和 CI。

### 我已经有明确的目标了

- PPT、电商、漫剧、办公文件、研究或内容制作：直接进 [场景实战](/codex/practice/)。
- 就想学会怎么把任务说明白：普通用户看 [任务说明法](/codex/everyday/task-brief)，开发者看 [Codex 提示与任务设计](/codex/start/prompting)。
- 想直接用现成能力：普通用户看 [Skill 和 Plugin 入门](/codex/everyday/skills-plugins)，技术用户看 [Codex Skill 推荐](/codex/skills/)。
- 正在接手一个陌生的代码项目：进 [读懂陌生代码库](/codex/workflows/understand-codebase)。

## 做 PPT、写报告，到底该用哪个入口？

这个问题我被问了好多次。一开始我也习惯什么都丢给 Codex，后来发现官方自己都把入口分得挺清楚的：

| 入口 | 适合干什么 |
| --- | --- |
| Chat | 快速问个问题、解释个概念、头脑风暴、写个短草稿 |
| ChatGPT Work | PPT、报告、表格、研究、计划——总之是你能打开看、能审核的那种成品 |
| Codex | 软件开发、读代码库、写代码、调试，跟开发工具沾边的活儿 |

说实话，如果你之前已经习惯用 Codex 干非编程的活，继续用也没毛病。但要是你第一次尝试，做文件或办公任务的时候，Work 通常更顺手一些，少踩很多坑。我把这些内容都收在 Codex 大栏目下，是想给你一条从文件操作到 Skills、Plugins、自动化的连续学习路径，中间不用来回跳。不是想把所有事情都往「编程」上靠。

## 普通用户完整路线

1. [不用写代码完成第一份工作文件](/codex/everyday/first-result)
2. [理解项目、任务、附件和本地文件夹](/codex/everyday/projects-files)
3. [用普通话说清任务](/codex/everyday/task-brief)
4. [检查 Word、PPT、表格和 PDF](/codex/everyday/review-revise)
5. [保护隐私，读懂权限和审批](/codex/everyday/safety)
6. [使用 Skill 和 Plugin](/codex/everyday/skills-plugins)
7. [把一次成功任务变成可复用流程](/codex/everyday/repeat-process)

走完这一轮，你应该能自己准备资料、生成草稿、局部修改、下载文件、核对事实——整个过程不用等技术同事帮忙。当然，最后那一步——发送、发布、付款、删除——记得还是自己确认一下再动手。

## 开发者路线：从新手到能独当一面

### 第一阶段：安全地跑通第一次代码任务

1. [认识 Codex 的工作方式](/codex/start/what-is-codex)
2. [选择 App、CLI、IDE 还是云任务](/codex/start/choose-surface)
3. [安装、登录与环境检查](/codex/start/install-login)
4. [完成第一次可验证任务](/codex/start/first-task)
5. [写出不容易跑偏的任务说明](/codex/start/prompting)
6. [掌握权限、沙箱与工作区安全](/codex/start/permissions)

这个阶段结束后，你应该能做到：让 Codex 在明确的边界内读你的项目、做一处小改动、跑一下验证，然后自己判断结果靠不靠谱。不追求多快，就追求每一步你都看得懂。

### 第二阶段：跑通真实项目工作流

1. [读懂陌生代码库](/codex/workflows/understand-codebase)
2. [复现并修复 Bug](/codex/workflows/fix-bugs)
3. [开发一个完整功能](/codex/workflows/build-feature)
4. [补测试与建立验证门槛](/codex/workflows/testing)
5. [根据截图实现和迭代界面](/codex/workflows/ui-from-screenshot)
6. [做可回退的重构与迁移](/codex/workflows/refactor)
7. [代码审查、Git 与 PR 闭环](/codex/workflows/code-review-git)
8. [更新文档并准备发布](/codex/workflows/docs-release)

这一阶段的重点：每次改动都有证据、有边界、能审查、能回退。我见过太多人让 AI 狂写一通代码，最后谁也看不懂、改不动、回不去——那不是在提效，是在给自己埋雷。

### 第三阶段：把你自己的经验固化下来

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

这一阶段的重点：把前面靠口头交代和临时操作的经验，沉淀成项目里的规则、配置和自动化。这样 AI 的行为可预期、可复用、有护栏，换人接手或长期维护时也不用重新摸索一遍。

## 办公、商业与创作实战

[场景实战](/codex/practice/) 这一块，我刻意没做成「提示词大全」那种风格。每个场景都从不用写代码的起步方式开始，脚本、自动化、程序验证这些列为可选项——你想要更高效的时候再捡起来用：

- [制作可交付的 PPT](/codex/practice/ppt)
- [搭建电商运营工作流](/codex/practice/ecommerce)
- [制作 AI 漫剧与短片](/codex/practice/comic-drama)
- [处理 Word、Excel、PDF](/codex/practice/documents-spreadsheets-pdf)
- [完成带来源的研究报告](/codex/practice/research-report)
- [分析数据并制作可视化](/codex/practice/data-analysis)
- [从想法做到可运行 Web 应用](/codex/practice/web-app)
- [制作图文、短视频与内容素材](/codex/practice/content-video)

## 关于账号、模型和第三方服务

本站讲的是 ChatGPT Work 和 Codex 的通用方法，不绑定套餐；这套方法同样适用于 DeepSeek Harness 等同类产品，发布后本站会补充对应教程。OpenAI 账号、套餐和产品界面以官网为准。

连 Plugin 前先看数据范围和读写权限，别让它悄悄读取你的文件，或未经你确认就对外操作；装第三方 MCP 或社区 Skill 前翻翻源码、许可证和隐私条款，防止窃取密钥、执行任意命令或数据外泄。

感谢 CCWS 的赞助。如果你正在寻找中转站以使用 Codex，可以使用 CCWS 提供的服务，具体看 [CCWS Codex 配置文档](https://docs.ccws.pro/guide/codex)。
