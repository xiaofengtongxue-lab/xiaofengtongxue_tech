---
title: Codex 云任务与 Git Worktree 并行实战
description: 分清本地目录、Codex 管理的 worktree 和云环境，安全并行任务、配置依赖、审查远程 diff，并把结果应用回本地。
---

# Codex 云任务与 Git Worktree 并行实战

并行工作的关键不是“多开几个任务”，而是让每个任务拥有独立文件状态和清楚的合并边界。多个代理同时编辑同一目录，会把速度优势变成覆盖、冲突和无法归因的差异。

## 三种执行位置

| 位置 | 文件在哪里 | 适合什么 |
| --- | --- | --- |
| Local | 你的日常工作目录 | 前台调试、真实设备、已有本地服务 |
| Worktree | 同一 Git 仓库的独立 checkout | 本机并行任务、后台修改、独立分支 |
| Cloud | OpenAI 管理的隔离环境 | 远程长任务、并行尝试、云端 PR |

Worktree 与本地共享 Git 对象，但各自有文件副本。云环境则需要单独准备依赖、变量和网络策略。

## 什么时候应该用 Worktree

适合：

- 你正在本地开发，想让 Codex后台修另一个问题；
- 两个任务修改不同模块；
- 定时任务不应干扰日常工作树；
- 想比较两个实现方案；
- 任务可以在独立 checkout 中验证。

不适合：

- 两个任务必须频繁修改同一核心文件；
- 项目依赖只能在一个全局实例中运行；
- 大量未跟踪或 ignored 文件没有准备复制规则；
- 任务没有清楚的起始分支和合并顺序。

## 在桌面应用创建 Worktree 任务

1. 项目必须是 Git 仓库。
2. 新建任务时选择 **Worktree**。
3. 选择起始分支或明确的当前状态。
4. 发送任务，并在任务头部确认运行位置。
5. 完成后选择在 worktree 中创建分支，或通过 **Handoff** 移回 Local。

Codex 管理的 worktree 默认可能处于 detached HEAD。需要提交或推送时先创建明确分支。Git 不允许同一个分支同时在两个 worktree 中 checkout。

## 给并行任务分配文件所有权

主任务提示：

```text
把工作拆为两个互不重叠的 worktree 任务：

任务 A：只修改 backend/orders/** 和对应测试，完成导出接口。
任务 B：只修改 frontend/orders/** 和对应测试，完成下载 UI。

共享 API 契约先由主任务确定并写入 docs/order-export-contract.md。两个任务都不得修改该文件。等待两边完成后再统一集成和端到端验证。
```

如果两边都需要改同一类型或配置，先由一个任务完成接口基线，再让其他任务基于新基线开始。

## Worktree 中的依赖和 ignored 文件

新 worktree 不会天然拥有：

- `node_modules`、虚拟环境和构建缓存；
- `.env.local` 等 ignored 文件；
- 本地数据库和正在运行的服务；
- 未提交但不在起始状态中的文件。

桌面应用的 Local environments 可以为 worktree 配置 setup scripts 和常用 actions，并将共享配置保存在仓库根目录 `.codex/`。对需要复制的 ignored 文件，使用官方支持的 `.worktreeinclude` 规则，并只包含安全且必要的本地文件；不要把真实密钥复制到不受控目录。

## 命令行手动创建 Git Worktree

不使用桌面应用时，可以用 Git：

```bash
git worktree add ../project-feature -b codex/feature-name main
```

进入新目录：

```bash
cd ../project-feature
git status --short --branch
codex
```

完成并确认不再需要后，先检查未提交修改和分支，再按 Git 官方流程移除。不要把清理命令当作自动步骤运行在仍有工作的目录上。

## 什么时候使用 Cloud

云任务适合：

- 本机不想长时间占用；
- 任务可以在标准容器中重现；
- 需要多个尝试或并行分支；
- 希望直接形成云端 diff/PR；
- 仓库和依赖可以安全授权给云环境。

云环境的 setup 阶段可以安装依赖并访问配置的秘密；代理工作阶段默认离线，除非你为环境开启互联网访问。秘密在 setup 和 agent 阶段的可用边界要按当前官方说明设计，不要假设它和本地 shell 一样。

## 用 CLI 提交和检查云任务

查看环境和任务：

```bash
codex cloud list
```

提交：

```bash
codex cloud exec --env <ENV_ID> --branch <BRANCH> "实现已确认的里程碑 1，并运行相关测试"
```

需要多个候选尝试时：

```bash
codex cloud exec --env <ENV_ID> --attempts 2 "比较两种最小实现，保持公开 API 不变"
```

检查状态与差异：

```bash
codex cloud status <TASK_ID>
codex cloud diff <TASK_ID>
```

确认差异后应用到当前本地仓库：

```bash
codex cloud apply <TASK_ID>
```

应用前运行 `git status --short --branch`，避免覆盖本地并行修改。多个 attempt 时使用 `--attempt <N>` 指定已审查的结果。

## 云结果回本地后的验证

云端通过不代表本地通过。至少检查：

```bash
git status --short
git diff --stat
git diff
```

然后在本地真实环境运行相关测试、构建、设备或浏览器验证。云环境可能缺少本机服务、私有网络、硬件和未提交上下文。

## 常见失败

### Worktree 缺少 `.env` 或依赖

把可共享 setup 写进 Local environment；敏感变量通过安全方式注入，不复制整个个人环境。

### 两个任务互相覆盖

说明文件所有权，避免共享核心文件，或按依赖顺序串行。

### 云任务无法访问私有包

在 setup 阶段配置最小网络、凭证和源；确认凭证不会进入 agent 输出和仓库。

### 应用云 diff 时冲突

先停止自动应用，比较起始基线与本地当前状态。必要时在独立分支/worktree 中应用再合并。

## 完成门槛

- [ ] 每个并行任务有独立目录和明确基线。
- [ ] 文件所有权和合并顺序已定义。
- [ ] 依赖、ignored 文件和秘密边界已处理。
- [ ] 云/worktree diff 已人工审查。
- [ ] 结果回到本地后重新验证。

## 下一步

把稳定的重复工作交给 [Codex 定时任务与持续目标](/codex/advanced/automation)。

## 事实来源

- [OpenAI：Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [OpenAI：Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment)
