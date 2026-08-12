---
title: Codex Skill 推荐与学习路线
description: 理解 Skill、Plugin 和 MCP 的区别，按办公、开发、研究、设计、电商和视频场景选择能力，并学习安装审计和自定义 Skill。
breadcrumbs:
  - { name: "Codex 实战教程", path: "/codex/" }

---

# Codex Skill 推荐与学习路线

嘿，朋友！如果你刚接触 Codex 的 Skill，有点懵很正常——我第一次看到 `SKILL.md` 这个词的时候也一头雾水，心想这又是哪个新名词。别急，咱们慢慢聊。

Skill 说白了就是一套「可复用的任务方法」，通常由一个 `SKILL.md` 文件、一些可选脚本、参考材料和模板组成。它干的事情很简单：把稳定的流程、质量标准和工具用法打包好，每次任务都能直接拿来用。你不需要先搞懂文件结构或者安装路径，直接在 ChatGPT Work 或 Codex 输入框里选一个可用的 Skill，用自然语言试试效果就行。甚至可以让 ChatGPT 帮你随手创建一个简单的 Skill。建议先翻翻[普通人怎样使用 Skill 和 Plugin](/codex/everyday/skills-plugins)这篇，下面的内容更适合需要安装、审查、共享或者自己动手写 Skill 的同学。

## 本栏目怎样选 Skill

我们不搞「必装 100 个」那种列表。说个我踩过的坑：刚上手那会儿，我看到好用的 Skill 就往里塞，一口气装了二十几个，结果触发描述互相打架，该触发的没触发、不该触发的跳出来了，上下文也撑得满满的。后来学乖了，推荐顺序是这样的：

1. 先用 Codex 自带的系统 Skill；
2. 再看看 OpenAI 官方或精选 Plugin 里的 Skill；
3. 然后是维护活跃、源码清楚、许可证明确的社区 Skill；
4. 最后才是团队自己从真实流程里提炼的仓库 Skill。

每装一个 Skill 之前，问自己几个问题：它替掉了我哪段重复劳动？输入输出是什么？怎么验证它干对了？需要什么权限？万一翻车了怎么停用？想清楚再装，比盲目堆数量靠谱得多。

## Skill、Plugin、MCP 怎么选

这三个概念放一起确实容易搞混，用一个表格来区分就清晰了：

| 需求 | 选择 |
| --- | --- |
| 固定一种分析、写作或交付流程 | Skill |
| 安装一组 Skills、连接器和工具 | Plugin |
| 访问实时外部数据或动作 | MCP/App |
| 强制命令或生命周期检查 | Rules/Hooks |

实际干活的时候，一个成熟的流程往往是组合拳：Skill 定义方法，MCP 读取数据，Plugin 负责分发，Hook 做机械检查。各司其职，谁也不抢谁的活。

## Skill 怎样被触发

触发方式分三种情况：

- **普通用户**：从输入框或 Skills 列表里直接选，或者描述任务让 Codex 自动匹配；
- **显式触发**：在 CLI/IDE 里用 `/skills` 或者输入 `$skill-name`；
- **隐式触发**：任务内容和 Skill 的 `description` 对上了，Codex 自己决定调用。

有个细节值得留意：Codex 一开始只加载 Skill 的名字和描述，真正要用的时候才读取完整的 `SKILL.md`。这意味着如果你装了一大堆 Skill 而且描述写得又长又啰嗦，有些 Skill 可能直接被压缩甚至忽略掉。所以「少而准」比「全都装」高明得多——这也是我前面踩坑总结出来的血泪教训。

## 当前 Skill 位置

按照目前官方推荐的 authoring 方式，Skill 放在这些地方：

- 仓库级：从当前目录到仓库根目录的 `.agents/skills/`；
- 用户级：`$HOME/.agents/skills/`；
- 管理员级：`/etc/codex/skills/`；
- 系统级：Codex 内置。

> ⚠️ 注意：部分旧版安装器可能还在用 `$CODEX_HOME/skills` 或 `~/.codex/skills`。我也被这个坑过一次，手动建了目录结果 Codex 死活找不到，最后发现是路径没对上。以安装器输出和 `/skills` 实际列出来的结果为准，别自己猜。

## 推荐阅读顺序

按这个顺序读，不容易迷路：

1. [官方与高价值 Skill/Plugin 推荐](/codex/skills/official)
2. [社区 Skill 推荐](/codex/skills/community)
3. [第三方 Skill 安装与安全审计](/codex/skills/install-audit)
4. [从零创建自己的 Codex Skill](/codex/skills/create)

## 第一次使用 Skill 的正确方法

还记得我第一次用社区 Skill 的时候，兴冲冲直接拿真实数据跑，结果它往项目根目录写了一堆临时文件，清理了半天。后来我给自己定了个流程，六步走：

1. 在新任务里显式调用，别让它自动触发；
2. 先让它说清楚输入、输出、依赖和写入范围；
3. 用虚构数据或者副本数据跑一个小样本；
4. 检查它实际调了哪些工具、生成了什么文件、有没有联网；
5. 用真实应用打开产物看看效果；
6. 确认没问题了，再决定要不要允许隐式触发或者上真实数据。

示例：

```text
$presentations

先不要生成文件。说明这个 Skill 需要哪些输入、会调用哪些工具、会写到哪里、怎样验证 PPTX，以及哪些步骤需要人工确认。
```

这一步花五分钟，比事后收拾残局划算太多了。

## 评价 Skill 的五个指标

我自己判断一个 Skill 靠不靠谱，就看这五点：

- **触发准确**：该来的时候来，不该来的时候别乱入；
- **流程完整**：不止扔一个初稿就跑，还包含验证和失败处理；
- **权限最小**：只读该读的、只写该写的，别到处伸手；
- **产物可复核**：有来源、有日志、有渲染结果或者测试，能追溯；
- **维护成本低**：结构清楚、依赖好装、版本号和许可证都标明白了。

五个都过关的 Skill，用起来才踏实。

## 与场景教程配合

光看概念可能不过瘾，配合具体场景上手更快：

- [PPT 实战](/codex/practice/ppt)
- [电商实战](/codex/practice/ecommerce)
- [漫剧实战](/codex/practice/comic-drama)
- [Word、Excel、PDF 实战](/codex/practice/documents-spreadsheets-pdf)
- [数据分析实战](/codex/practice/data-analysis)

## 事实来源

- [OpenAI：Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Open Agent Skills 标准](https://agentskills.io)
