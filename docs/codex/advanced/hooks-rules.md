---
title: Codex Hooks 与 Rules 实战
description: 用 Rules 决定哪些命令允许、询问或禁止，用 Hooks 在生命周期节点执行检查，并与 AGENTS.md 和 CI 组成分层护栏。
breadcrumbs:
  - { name: "Codex 实战教程", path: "/codex/" }
  - { name: "高级能力", path: "/codex/advanced/" }

---

# Codex Hooks 与 Rules 实战

`AGENTS.md` 是给代理的长期指导，Rules 是对命令的机械决策，Hooks 是在工具调用或任务生命周期中运行的程序。高风险规则不能只靠提示词，应该放到能被测试和审查的执行层。

## 四层职责

| 层 | 适合什么 |
| --- | --- |
| AGENTS.md | 项目约定、流程、验证命令 |
| Rules | 命令前缀允许、询问或禁止 |
| Hooks | 调用前后检查、记录、补充上下文 |
| CI/平台策略 | 最终不可绕过的合并与部署门槛 |

例如“不要执行生产迁移”可以同时存在：AGENTS.md 解释原因，Rules 禁止命令前缀，CI 限制生产凭证。

## 创建一个 Rules 文件

在 `~/.codex/rules/default.rules`：

```python
prefix_rule(
    pattern = ["gh", "pr", ["view", "list"]],
    decision = "allow",
    justification = "Read-only pull request inspection",
    match = [
        "gh pr view 123",
        "gh pr list --limit 20",
    ],
    not_match = [
        "gh pr merge 123",
    ],
)

prefix_rule(
    pattern = ["gh", "pr", "merge"],
    decision = "forbidden",
    justification = "PR merging requires an explicit human-run workflow",
    match = ["gh pr merge 123 --squash"],
)
```

可用 decision：

- `allow`：允许匹配命令越过沙箱执行而不再提示；
- `prompt`：每次询问；
- `forbidden`：直接阻止。

多条规则同时匹配时，最严格结果生效。

## 在保存前测试 Rules

```bash
codex execpolicy check --pretty \
  --rules ~/.codex/rules/default.rules \
  -- gh pr view 123 --json title,body
```

再测试必须被拒绝的命令：

```bash
codex execpolicy check --pretty \
  --rules ~/.codex/rules/default.rules \
  -- gh pr merge 123 --squash
```

把 `match` 和 `not_match` 当作规则的内联单元测试。规则前缀要窄，避免允许 `gh`、`aws`、`kubectl` 这类过宽根命令。

## 注意 shell 包装命令

简单的 `&&`、`;`、`|` 链在安全可解析时会被拆开评估；包含重定向、变量展开、通配符和复杂控制流时，整个 `bash -lc`/`zsh -lc` 可能作为单个调用评估。

因此不要以为允许 `git status` 就能自动安全覆盖任意 `bash -lc "..."`。规则应针对实际参数列表测试。

## Hooks 的最小配置

项目可在受信任 `.codex/` 层或插件中配置 Hooks。示意 `hooks.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/check_command.py\"",
            "timeout": 30,
            "statusMessage": "Checking command policy"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/verify_handoff.py\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

从 Git 根目录解析脚本路径，避免 Codex 从子目录启动时找错位置。当前应以 `type: command` 为主，其他 handler 类型和异步行为可能尚未执行。

## 常用 Hook 场景

- `SessionStart`：加载经过筛选的项目状态；
- `PreToolUse`：检查命令、路径或环境；
- `PermissionRequest`：对审批请求做额外策略判断；
- `PostToolUse`：检查命令输出或记录审计摘要；
- `PreCompact`/`PostCompact`：在上下文压缩前后保留必要状态；
- `Stop`：检查测试、工作树或交付报告是否完整；
- `SubagentStart`/`SubagentStop`：约束并行代理。

Hook 输入和输出有正式 schema。不要靠解析人类终端文本实现关键安全策略。

## Hook 设计原则

1. **快**：频繁 Hook 不应每次跑完整测试。
2. **确定性**：相同输入产生相同结果。
3. **失败清楚**：说明阻止原因和修复方式。
4. **最小数据**：不记录完整提示、凭证和用户数据。
5. **可绕过边界明确**：临时绕过需要独立授权和审计。
6. **有测试**：脚本本身进入版本控制和 CI。

## Hook 信任

Codex 会根据 Hook 当前哈希要求审查和信任。脚本变化后需要重新审查，这是正常安全机制。使用 `/hooks` 查看来源、信任状态和禁用项。

不要为了自动化方便长期添加 `--dangerously-bypass-hook-trust`。它只适合外部流程已经验证 Hook 来源的单次受控运行。

## 与 CI 配合

Hooks 提供即时反馈，但本地用户可能禁用或环境不同。真正阻止合并的检查仍放 CI：测试、类型、迁移校验、安全扫描和发布策略。

## 常见失败

### Rules 太宽

把 `pattern = ["git"]` 改为准确的只读子命令，并加入反例测试。

### Hook 造成所有任务变慢

把昂贵检查移到 Stop 或 CI，PreToolUse 只做快速策略判断。

### Hook 脚本读取秘密

限制输入字段和环境变量；日志只保存必要摘要。

### 把实验功能当永久接口

Rules 和 Hooks 都应固定 Codex 版本并在升级后重新运行测试。

## 完成门槛

- [ ] 每条 Rule 有 match 和 not_match 示例。
- [ ] `codex execpolicy check` 验证了允许与拒绝路径。
- [ ] Hook 脚本来源、权限和日志经过审查。
- [ ] Hook 失败信息可执行。
- [ ] 最终关键门槛仍由 CI/平台保证。

## 下一步

需要拆解大型并行工作时，继续学习 [Codex Subagents 实战](/codex/advanced/subagents)。

> 命令核验：本页关键命令已对照 openai/codex 源码与官方文档核验（2026-08-13）。产品行为会随版本变化，以当前官方文档为准。

## 事实来源

- [OpenAI：Rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- [OpenAI：Hooks](https://learn.chatgpt.com/docs/hooks)
