---
title: AGENTS.md 实战：让 Codex 自动遵守项目规则
description: 在全局、仓库和子目录分层编写 AGENTS.md，固化项目边界、验证命令与工作树安全规则，并验证 Codex 实际加载顺序。
---

# AGENTS.md 实战：让 Codex 自动遵守项目规则

当你在每个任务里重复“先看工作树、不要改生成文件、最后跑测试”时，就该把这些稳定规则写进 `AGENTS.md`。它不是项目百科，而是 Codex 每次进入工作区前都必须读到的执行约定。

## 什么应该写进去

适合长期保留的内容：

- 项目用途和仓库边界；
- 允许和禁止修改的目录；
- 安装、测试、构建、格式化和预览命令；
- 工作树、迁移、凭证和发布安全规则；
- 代码风格中无法由工具自动判断的约定；
- 目录级特殊规则；
- 什么情况必须先问人。

不适合写：

- 只服务当前任务的临时需求；
- API Key、账号、Cookie 和内部敏感数据；
- 大段框架教程；
- 已由 formatter、lint 或类型系统机械执行的冗长规则；
- 经常变化但无人维护的版本和人员名单。

## Codex 怎样查找指令

一次运行开始时，Codex 大致按以下顺序构建指令链：

1. 用户级 `~/.codex/AGENTS.override.md`，不存在时读 `~/.codex/AGENTS.md`；
2. 从项目根目录走到当前工作目录；
3. 每一层优先读 `AGENTS.override.md`，否则读 `AGENTS.md`；
4. 越靠近当前目录的内容越晚加入，因此可以覆盖上层规则。

同一目录有 override 时，该目录普通 `AGENTS.md` 不会同时生效。默认合并大小上限为 32 KiB；过长时应删掉背景材料或拆到更接近目标模块的目录。

## 从一个可用的根文件开始

在仓库根目录创建：

```md
# AGENTS.md

## Project

- This repository is a VitePress documentation site.
- Public pages live under `docs/`.
- Do not publish planning notes or credentials.

## Worktree safety

- Treat existing local changes as active work.
- Do not reset, checkout, restore, or delete unrelated changes.
- Before editing, run `git status --short --branch`.
- After editing, inspect the complete diff.

## Validation

- Run `npm run docs:build` after public page or config changes.
- Run `git diff --check` before handoff.
- For new pages, verify navigation, sidebar, links, and sitemap.

## Boundaries

- Do not commit, push, deploy, or publish unless the user explicitly asks.
- Never write real secrets into examples.
```

这份文件回答的是“在这个仓库怎样安全工作”，而不是“VitePress 是什么”。

## 为子模块增加局部规则

假设后端仓库中支付服务需要特殊验证：

```text
repo/
├── AGENTS.md
└── services/
    └── payments/
        └── AGENTS.md
```

`services/payments/AGENTS.md`：

```md
# Payments service rules

- Run `make test-payments` for changes in this directory.
- Preserve idempotency keys and existing webhook signatures.
- Do not run migrations against shared databases.
- Any change to amount, currency, refund, or reconciliation logic requires a regression test.
```

从支付目录启动的任务会同时获得根规则和局部规则。

## 什么时候使用 override

`AGENTS.override.md` 适合临时或明确替代同层规则的场景，例如迁移窗口期间暂停某类自动操作。它的风险是长期遗忘，因此：

- 写清用途和删除条件；
- 版本控制中的 override 需要团队审查；
- 用户级临时 override 用完立即删除；
- 不要同时维护两份互相冲突的完整规则。

## 全局指令只放个人稳定偏好

`~/.codex/AGENTS.md` 可以包含：

- 你的默认沟通语言；
- 默认先做只读调查；
- 工作树安全偏好；
- 通用验证报告格式。

不要在全局文件强行规定所有项目都用 npm、所有仓库都执行同一测试，项目级文件应拥有更具体的事实。

## 验证 Codex 是否真的读到

新开一次只读运行：

```bash
codex --sandbox read-only --ask-for-approval never "列出本次加载的项目指令来源，并按优先级总结会影响当前目录的规则。不要修改文件。"
```

在子目录重复测试：

```bash
codex -C services/payments --sandbox read-only --ask-for-approval never "列出当前生效的测试和安全规则。不要修改文件。"
```

核对它是否同时识别根规则和局部规则，以及 override 是否按预期替换。

## 让规则可执行而不是口号化

差规则：

```text
写高质量代码，确保安全和性能。
```

可执行规则：

```text
- 修改鉴权逻辑时同时测试允许和拒绝路径。
- 新增数据库查询时检查租户过滤和索引使用。
- 公共 API 行为变化必须更新契约测试和迁移说明。
```

每条规则最好能对应一个动作、检查或停下来的条件。

## 常见失败

### 文件太长

把架构背景放 README 或正式文档；`AGENTS.md` 只保留影响执行的规则。

### 命令已经过期

规则变更应和脚本、CI 一起审查。错误验证命令比没有命令更危险。

### 上下层冲突

写清局部规则是在补充还是替代。必要时使用 override，而不是依赖模糊措辞。

### 把安全规则只写在提示词

长期安全边界应进入仓库规则、配置、Rules、Hooks 或 CI；提示词只负责当前任务的额外限制。

## 完成门槛

- [ ] 根文件说明了项目边界、验证和工作树安全。
- [ ] 子模块规则只放局部差异。
- [ ] 没有任何真实凭证和私有数据。
- [ ] 已在根目录和至少一个子目录验证加载结果。
- [ ] 规则能映射到实际命令或决策。

## 下一步

继续学习 [Codex config.toml 配置实战](/codex/advanced/config)，把权限、搜索、MCP 和运行偏好放到正确的配置层。

## 事实来源

- [OpenAI：Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
