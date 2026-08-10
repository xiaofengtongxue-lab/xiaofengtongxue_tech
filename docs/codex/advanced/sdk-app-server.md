---
title: Codex SDK 与 App Server 集成实战
description: 在 codex exec、TypeScript/Python SDK、MCP Server 和 App Server 之间做选择，用最小示例创建线程、流式处理事件并控制工作目录与沙箱。
---

# Codex SDK 与 App Server 集成实战

嗨，我是小枫，一枚天天跟代码打交道的技术博主。

今天咱们聊一个很容易踩坑的话题：你的项目什么时候该从 `codex exec` 升级到 SDK，甚至 App Server？我刚接触 Codex 那会儿，上来就想着直接撸 App Server，结果折腾了两天认证和会话管理，最后发现一条 `codex exec` 命令就搞定了——血亏。所以这篇文章，我想用朋友聊天的语气，带你少走点弯路。

## 先从最简单的问题开始：你该选哪一层？

Codex 提供了好几层接入方式，每一层对应不同的场景。选错了，要么功能不够用，要么工程复杂度直接爆炸。我整理了一个速查表，对着你的需求看就行：

| 需求 | 建议接口 |
| --- | --- |
| 一条脚本或 CI 命令 | `codex exec` |
| Node/Python 服务调用 Codex 线程 | Codex SDK |
| Codex 作为更大 Agents SDK 工作流中的工具 | `codex mcp-server` |
| 自己构建类似 IDE 的富客户端 | Codex App Server |

这里多说一句：App Server 要处理认证、会话、审批、事件和协议版本这些全家桶，工程成本最高。普通自动化场景千万别一上来就选它，除非你真的需要自己撸一个类 IDE 界面。

好了，假设你确认 SDK 就是你要的，咱们开始写代码。

## TypeScript SDK：三分钟跑起来

Node.js 18+ 的环境就行，先装依赖：

```bash
npm install @openai/codex-sdk
```

然后新建一个 `run-codex.mjs`：

```ts
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();
const thread = codex.startThread({
  workingDirectory: process.cwd(),
});

const turn = await thread.run(
  "只读检查当前仓库的测试入口，并返回建议的最小验证命令"
);

console.log(turn.finalResponse);
```

跑起来：

```bash
node run-codex.mjs
```

我当初在这里踩过一个坑：默认要求工作目录是 Git 仓库，而我随便建了个临时目录测试，直接报错。如果你确实要在非 Git 目录下跑，可以显式跳过检查，但我建议先想清楚——没有版本控制，出问题了你怎么回退？生产环境还是老老实实用 Git 仓库吧。

## 同一个线程接着聊

Codex 的线程模型就像你跟一个同事持续对话，上下文都在：

```ts
const first = await thread.run("分析失败测试，只报告根因候选");
const second = await thread.run("根据已确认根因生成最小修复");

console.log(first.finalResponse);
console.log(second.finalResponse);
```

跨进程需要用的时候，保存 thread ID 然后 `resumeThread()` 恢复就行。不过提醒一下，thread ID 不是认证凭证，别把它当 token 用，用户的私有线程也别暴露给其他租户——安全问题没有小事。

## 流式事件：别让用户干等

产品里用户盯着屏幕等结果，你不能让人家看 loading 转圈转半天。用流式事件实时推送进度：

```ts
const { events } = await thread.runStreamed("运行最小测试并报告进度");

for await (const event of events) {
  if (event.type === "item.completed") {
    console.log("item", event.item);
  }
  if (event.type === "turn.completed") {
    console.log("usage", event.usage);
  }
}
```

有一点我特别想强调：产品界面里你得把原始事件转成用户看得懂的状态。不要把内部事件、shell 命令、甚至可能包含敏感信息的原始输出一股脑甩给终端用户——这是面向内部工具的习惯，放到产品里就是安全隐患。

## 结构化输出：让机器读得懂

如果你需要下游服务消费 Codex 的输出，JSON schema 是个好帮手：

```ts
const schema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    status: { type: "string", enum: ["ok", "action_required"] },
  },
  required: ["summary", "status"],
  additionalProperties: false,
};

const result = await thread.run("汇总仓库状态", {
  outputSchema: schema,
});

console.log(result.finalResponse);
```

说实话，模型输出的结构化数据虽然方便，但它终究是模型生成的，你下游该做的 JSON 解析、schema 校验和业务验证一样不能少——别把它当可信数据库记录来用。

## Python 用户也别急，SDK 一样好用

Python 3.10+ 环境下：

```bash
pip install openai-codex
```

```python
from openai_codex import Codex, Sandbox

with Codex() as codex:
    thread = codex.thread_start(sandbox=Sandbox.read_only)
    result = thread.run("检查当前仓库的验证入口，不修改文件")
    print(result.final_response)
```

默认是只读沙箱，这个设计挺贴心的。需要写操作的时候，显式切到 `Sandbox.workspace_write`。多租户服务里千万不要默认给 full access——听起来像废话但我真见过有人这么干，后来回滚都回不过来。

## 服务端集成，这些护栏一个都不能少

SDK 接入服务端之后，你面对的不再是自己电脑上的玩具项目了。以下是我从实际项目里总结出来的必要护栏：

- 每个请求绑定独立工作目录或 worktree；
- 路径由服务端 allowlist 决定，拒绝用户传任意绝对路径；
- 传给 Codex 的环境变量最小化，别把整台机器的 env 都喂进去；
- 外部网络和 MCP 工具按租户隔离；
- 设置任务超时、并发数、输出大小和成本上限；
- 记录状态和审计摘要，但提示内容、日志和凭证必须脱敏；
- 写操作先产出候选 diff，走人工或策略审批再合并；
- 绝对不要向匿名公网暴露"执行任意 Codex 任务"的接口。

## 什么时候真的需要 App Server？

App Server 是 Codex IDE 这类富客户端背后的接口。你需要的其实是这些能力的时候，才值得上它：

- 创建、恢复、分叉和列出线程；
- 流式展示 turn/item 事件；
- 展示工具调用、文件变更和审批状态；
- 管理模型、Skills、MCP、Hooks 和运行状态；
- 自己实现一套完整的交互界面。

本地先看看帮助信息：

```bash
codex app-server --help
```

默认走 stdio 就行。WebSocket 监听牵涉认证、非 loopback 暴露和协议安全，千万别把实验性服务直接绑到公网上——我年轻的时候干过，被安全同事追着打。

生成当前版本的协议绑定和 Schema：

```bash
codex app-server generate-ts --help
codex app-server generate-json-schema --help
```

App Server 目前还包含实验性接口，升级时记得固定 Codex 版本并重新生成/验证协议，不然兼容性问题够你喝一壶。

## Codex 作为 MCP Server：当它只是大 workflow 里的一环

有时候 Codex 的角色就是更大智能体系统里的"代码专家"，这时候不需要自己维护线程和状态：

```bash
codex mcp-server
```

外层由 Agents SDK 或其他 MCP 客户端来编排，Codex 专心搞定代码任务，整体状态、工具和审批都归外层管。各司其职，架构反而清爽。

## 上线前对着这个 checklist 过一遍

- [ ] 已证明 `codex exec` 真的不够用了。
- [ ] 工作目录、环境变量和沙箱完全由服务端控制。
- [ ] 线程、租户和凭证彼此隔离。
- [ ] 输出经过了 schema 和业务校验。
- [ ] 写操作不会直接进主分支或生产环境。
- [ ] SDK/App Server 版本已固定并测试通过。

## 下一步

团队或产品环境部署之前，推荐接着看 [Codex 团队安全与数据边界](/codex/advanced/security)，安全意识提前拉满总没错。

## 事实来源

- [OpenAI：Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [OpenAI：Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [OpenAI Codex 开源组件](https://learn.chatgpt.com/docs/open-source)
