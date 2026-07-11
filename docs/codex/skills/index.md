---
title: Codex Skill 推荐与学习路线
description: 理解 Skill、Plugin 和 MCP 的区别，按办公、开发、研究、设计、电商和视频场景选择能力，并学习安装审计和自定义 Skill。
---

# Codex Skill 推荐与学习路线

Skill 是一套可被 Codex 发现和复用的任务方法，通常由 `SKILL.md`、可选脚本、参考资料和模板组成。它的价值不是“增加一个提示词”，而是把稳定流程、质量门槛和工具使用方式放到每次任务都能复用的位置。

普通用户不需要先理解 `SKILL.md` 或安装路径。你可以直接在 ChatGPT Work 或 Codex 的输入框中选择当前可用 Skill，用自然语言测试结果，甚至让 ChatGPT 帮你创建一个简单 Skill。请先阅读 [普通人怎样使用 Skill 和 Plugin](/codex/everyday/skills-plugins)。本页余下内容适合需要安装、审查、共享或开发 Skill 的读者。

## 本栏目怎样选 Skill

我们不做“必装 100 个”的列表。Skill 越多，触发描述越容易互相竞争，也会占用初始上下文。推荐顺序：

1. 当前 Codex 自带的系统 Skill；
2. OpenAI 官方/精选 Plugin 内的 Skill；
3. 维护活跃、源码清楚、许可证明确的社区 Skill；
4. 团队自己从真实流程提炼的仓库 Skill。

每安装一个 Skill，都应该回答：它替代了哪段重复工作、输入输出是什么、怎样验证、需要哪些权限、失败后怎么停用。

## Skill、Plugin、MCP 怎么选

| 需求 | 选择 |
| --- | --- |
| 固定一种分析、写作或交付流程 | Skill |
| 安装一组 Skills、连接器和工具 | Plugin |
| 访问实时外部数据或动作 | MCP/App |
| 强制命令或生命周期检查 | Rules/Hooks |

一个成熟流程可能同时使用：Skill 定义方法、MCP 读取数据、Plugin 负责分发、Hook 做机械检查。

## Skill 怎样被触发

- 普通用户：从输入框或 Skills 列表选择，或者直接描述匹配的工作；
- 显式：在 CLI/IDE 使用 `/skills` 或输入 `$skill-name`；
- 隐式：任务与 Skill 的 `description` 匹配时由 Codex选择。

Codex 先加载 Skill 名称和描述，真正使用时才读取完整 `SKILL.md`。安装太多且描述冗长时，一部分 Skill 可能被压缩或省略，因此“少而准”比“全都装”更好。

## 当前 Skill 位置

面向当前官方 authoring 方式：

- 仓库级：从当前目录到仓库根目录的 `.agents/skills/`；
- 用户级：`$HOME/.agents/skills/`；
- 管理员级：`/etc/codex/skills/`；
- 系统级：Codex 内置。

部分旧版安装器仍可能使用 `$CODEX_HOME/skills` 或 `~/.codex/skills`。不要自行猜路径，以安装器输出和 `/skills` 实际发现结果为准。

## 推荐阅读顺序

1. [官方与高价值 Skill/Plugin 推荐](/codex/skills/official)
2. [社区 Skill 推荐](/codex/skills/community)
3. [第三方 Skill 安装与安全审计](/codex/skills/install-audit)
4. [从零创建自己的 Codex Skill](/codex/skills/create)

## 第一次使用 Skill 的正确方法

1. 在新任务中显式调用；
2. 先让它说明输入、输出、依赖和写入范围；
3. 使用虚构或副本数据跑一个小样本；
4. 检查实际工具调用、生成文件和网络；
5. 用真实应用打开产物；
6. 再决定是否允许隐式触发或真实数据。

示例：

```text
$presentations

先不要生成文件。说明这个 Skill 需要哪些输入、会调用哪些工具、会写到哪里、怎样验证 PPTX，以及哪些步骤需要人工确认。
```

## 评价 Skill 的五个指标

- **触发准确**：该用时触发，不该用时不抢任务；
- **流程完整**：不是只生成初稿，还包含验证和失败处理；
- **权限最小**：只读取和写入必要范围；
- **产物可复核**：有来源、日志、渲染或测试；
- **维护成本低**：结构清楚、依赖可安装、版本和许可证明确。

## 与场景教程配合

- [PPT 实战](/codex/practice/ppt)
- [电商实战](/codex/practice/ecommerce)
- [漫剧实战](/codex/practice/comic-drama)
- [Word、Excel、PDF 实战](/codex/practice/documents-spreadsheets-pdf)
- [数据分析实战](/codex/practice/data-analysis)

## 事实来源

- [OpenAI：Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Open Agent Skills 标准](https://agentskills.io)
