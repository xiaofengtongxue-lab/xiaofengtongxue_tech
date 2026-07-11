---
title: Codex SDK 与 App Server 集成实战
description: 在 codex exec、TypeScript/Python SDK、MCP Server 和 App Server 之间做选择，用最小示例创建线程、流式处理事件并控制工作目录与沙箱。
---

# Codex SDK 与 App Server 集成实战

当手动任务和 `codex exec` 已经稳定，但你需要在内部工具、服务或产品界面中管理线程、结构化输出和流式事件时，才值得引入 SDK 或 App Server。先选最小接口，避免直接维护一套复杂客户端协议。

## 选择哪一层

| 需求 | 建议接口 |
| --- | --- |
| 一条脚本或 CI 命令 | `codex exec` |
| Node/Python 服务调用 Codex 线程 | Codex SDK |
| Codex 作为更大 Agents SDK 工作流中的工具 | `codex mcp-server` |
| 自己构建类似 IDE 的富客户端 | Codex App Server |

App Server 需要处理认证、会话、审批、事件和协议版本，工程成本最高。普通自动化不要从它开始。

## TypeScript SDK 最小示例

要求 Node.js 18+：

```bash
npm install @openai/codex-sdk
```

`run-codex.mjs`：

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

运行：

```bash
node run-codex.mjs
```

默认要求工作目录是 Git 仓库。确需非 Git 目录时可以显式跳过检查，但生产工具应先理解为什么没有版本控制和回退能力。

## 继续同一个线程

```ts
const first = await thread.run("分析失败测试，只报告根因候选");
const second = await thread.run("根据已确认根因生成最小修复");

console.log(first.finalResponse);
console.log(second.finalResponse);
```

需要跨进程继续时，保存 thread ID 并使用 `resumeThread()`。不要把线程 ID 当认证凭证，也不要把用户私有线程暴露给其他租户。

## 流式事件

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

产品界面应把事件转换为清楚的状态，不要把原始内部事件、命令和潜在敏感内容全部展示给终端用户。

## 结构化输出

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

下游仍要做 JSON 解析、schema 验证和业务校验。模型生成的结构化数据不是可信数据库记录。

## Python SDK 最小示例

要求 Python 3.10+：

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

需要修改时显式切换到 `Sandbox.workspace_write`。不要在多租户服务中默认使用 full access。

## 服务端集成的必要护栏

- 每个请求绑定独立工作目录或 worktree；
- 路径由服务端 allowlist 决定，不接受任意用户绝对路径；
- 传给 Codex 的环境变量最小化；
- 外部网络和 MCP 工具按租户隔离；
- 设置任务超时、并发、输出大小和成本上限；
- 记录状态与审计摘要，但脱敏提示、日志和凭证；
- 写操作先产生候选 diff，再走人工或策略审批；
- 不向匿名公网直接暴露“执行任意 Codex 任务”的接口。

## 什么时候使用 App Server

App Server 是 Codex IDE 等富客户端使用的接口，适合你需要：

- 创建、恢复、分叉和列出线程；
- 流式显示 turn/item 事件；
- 展示工具调用、文件变化和审批；
- 管理模型、Skills、MCP、Hooks 和运行状态；
- 自己实现完整交互界面。

本机查看帮助：

```bash
codex app-server --help
```

默认可使用 stdio。WebSocket 监听涉及认证、非 loopback 暴露和协议安全，不要把实验服务直接绑定公网。

生成当前版本协议绑定/Schema：

```bash
codex app-server generate-ts --help
codex app-server generate-json-schema --help
```

App Server 当前包含实验接口，升级时固定 Codex 版本并重新生成/验证协议。

## 什么时候把 Codex 作为 MCP Server

如果 Codex 只是一个更大智能体系统里的代码专家，可以运行：

```bash
codex mcp-server
```

由 Agents SDK 或其他 MCP 客户端编排。此时外层系统负责整体状态、工具和审批，Codex 专注代码任务。

## 完成门槛

- [ ] 已证明 `codex exec` 不足以满足需求。
- [ ] 工作目录、环境变量和沙箱由服务端控制。
- [ ] 线程、租户和凭证彼此隔离。
- [ ] 输出经过 schema 与业务校验。
- [ ] 写操作不会直接进入主分支或生产。
- [ ] 固定并测试 SDK/App Server 版本。

## 下一步

在团队或产品环境部署前，继续学习 [Codex 团队安全与数据边界](/codex/advanced/security)。

## 事实来源

- [OpenAI：Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [OpenAI：Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [OpenAI Codex 开源组件](https://learn.chatgpt.com/docs/open-source)
