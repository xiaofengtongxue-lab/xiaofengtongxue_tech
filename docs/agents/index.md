---
title: AI Agent 大白话教程
description: 从会和 AI 聊天，到亲手做出能调用工具、保存状态、请求审批并通过评测的可靠 AI Agent，提供零基础导读、项目主线和工程进阶三条路线。
datePublished: 2026-07-26
---

# AI Agent 大白话教程：从会聊天到可靠完成真实工作

如果你已经会和 ChatGPT、Claude 或其他大模型聊天，却还说不清 Agent 为什么能连续做事、怎样接工具、哪里必须人工确认，这套教程就是给你的。我们不从十几个架构名词开始，而是一起做一个真实的**本地资料盘点 Agent**：它会查看指定目录、搜索待办、生成报告草稿、接受程序验收，并在正式发布前停下来等你确认。

一句话概括这套教程：

> **从会和 AI 聊天，到让 AI Agent 可靠地完成一项真实工作。**

<figure class="agent-diagram">
  <img src="/diagrams/agents/file-audit-architecture.svg" alt="本地资料盘点 Agent 从用户目标、工具调用、草稿验证到人工确认发布的完整架构图">
  <figcaption>贯穿 B 级主线的资料盘点 Agent。每一章只增加一个必要能力，最后才得到这张完整图。</figcaption>
</figure>

## 先按你的起点选路线

| 你现在的情况 | 从哪里开始 | 走完能做到什么 |
| --- | --- | --- |
| 没接触过 Agent，也没用过终端或 Git | [A 级导读：AI Agent 到底是什么](/agents/start/what-is-agent) | 看懂 Agent 的工作循环，知道它适合什么、不适合什么 |
| 会使用 AI 对话，具备一点 Python 或终端经验 | [B 级主线：先跑通第一个资料盘点 Agent](/agents/build/from-chat-to-agent) | 独立实现工具、循环、状态、审批、验证和基础评测 |
| 已经做过 Agent，希望解决工程问题 | [C 级进阶：工具调用的协议与边界](/agents/advanced/tool-calling) | 设计 MCP、上下文、记忆、评测、多 Agent、安全与生产架构 |

三条路线不是难度标签，更不是身份标签。它们只回答一个问题：**这篇文章默认你已经知道什么。** 单篇文章不会在 A、B、C 三种表达密度之间来回跳；需要补基础或深入机制时，正文会明确给出链接。

## A 级导读：先建立正确直觉

1. [AI Agent 到底是什么：跟着一个任务走完闭环](/agents/start/what-is-agent)
2. [第一次写 Agent 前，补齐终端、Git、Python 和 API Key 基础](/agents/start/prepare)

这条路线不要求你预先认识 Function Calling、MCP 或上下文窗口。读完后，你至少能分清聊天模型、工具、Agent 和固定工作流，不会把“模型说完成了”误当成“任务真的完成了”。

## B 级主线：做出一个可靠的单 Agent

1. [先跑通第一个资料盘点 Agent](/agents/build/from-chat-to-agent)
2. [给模型接上工具：Tool Calling 完整闭环](/agents/build/tool-calling)
3. [让它连续做事：Agent Loop、停止条件与失败反馈](/agents/build/agent-loop)
4. [把工具做窄：Schema、路径边界和错误契约](/agents/build/tool-design)
5. [任务跑一半也能接着做：状态、上下文与检查点](/agents/build/state-checkpoints)
6. [让 Agent 敢写又不乱写：人工审批与结果验证](/agents/build/approval-verification)
7. [从“这次成功”到“稳定成功”：给 Agent 建立评测](/agents/build/evaluation)

主线用 Python 和 OpenAI Responses API 展示最小机制，但教学目标不是绑定某个模型厂商。模型适配器、工具执行器、状态、验证器和审批层彼此分开，更换模型时不必推倒业务边界。

## C 级进阶：把演示项目变成工程系统

1. [Tool Calling 深入：协议、严格 Schema、并行与幂等](/agents/advanced/tool-calling)
2. [MCP 到底统一了什么：Host、Client、Server 和安全边界](/agents/advanced/mcp)
3. [上下文工程：不是塞得越多，Agent 就越聪明](/agents/advanced/context)
4. [Agent 记忆：保存什么、何时召回、怎样忘记](/agents/advanced/memory)
5. [Agent 评测：从 Trace 调试到可重复回归测试](/agents/advanced/evaluation)
6. [什么时候才需要多 Agent：先证明拆分真的有收益](/agents/advanced/multi-agent)
7. [Agent 安全：Prompt Injection、最小权限与数据边界](/agents/advanced/security)
8. [生产级 Agent 系统设计：Workflow、运行时和控制面](/agents/advanced/system-design)

## 学完主线，怎样才算真的会了

不是背下 ReAct、Memory、MCP 这些词，而是能拿出下面七类证据：

1. 你能解释 Agent 每一轮观察了什么、为什么调用这个工具。
2. 工具参数由程序校验，目录越界和未知工具会被拒绝。
3. 连续重复同一动作时，Agent 会停止，而不是无限消耗 Token。
4. 长任务有检查点，进程中断后能知道已经做到了哪里。
5. 写操作先进入草稿区，高风险动作绑定真实参数和人工确认。
6. 最终结果由确定性程序验收，不依赖模型自我宣布完成。
7. 修改 Prompt、模型或工具后，会在同一组测试样例上比较结果。

这七条也是整套教程的主线。后面看到新框架、新协议或新模型时，可以先问它解决了其中哪一条，再决定要不要学。

## 示例项目与版本边界

- [下载完整示例项目（ZIP）](/downloads/file-audit-agent.zip)
- 内容与代码核验日期：2026 年 7 月 26 日。
- 本地验证环境：Python 3.14.2、OpenAI Python SDK 2.48.0；项目声明支持 Python 3.11 及以上版本。
- 示例默认模型写为 `gpt-5.6-terra`，你应替换为自己 API 项目当前可用并经过评测的模型。模型名称、权限和能力会变化，不能把本页默认值当成永久推荐。
- 示例的确定性代码和 8 个单元测试已经本地验证；真实模型输出具有非确定性，首次运行仍需使用你自己的 API Key 和可用模型完成验收。

## 主要事实来源

- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit1/what-are-agents)
- [OpenAI：Agents SDK 与 Responses API 的选择](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Model Context Protocol：Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [Chip Huyen：Agents](https://huyenchip.com/2025/01/07/agents.html)
- [HumanLayer：12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
