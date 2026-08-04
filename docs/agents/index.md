---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: AI Agent 教程：从聊天到干活
description: 从会和 AI 聊天，到用 Java 或 Python 亲手做出能调用工具、保存状态、请求审批并通过评测的可靠 AI Agent。
datePublished: 2026-07-26
---

# AI Agent 教程：从聊天到干活，一步一步做出能验收的 Agent

我想你肯定跟 AI 聊过天，像豆包、DeepSeek、ChatGPT 这些。它们的联网搜索看着挺像 Agent——能查资料、能总结——但骨子里还是一问一答。Agent 不一样，它能自己连续做事：先查目录、再搜关键词、读了文件写报告，中间不用你推一步动一步。怎么做到的？哪里必须人工把关？如果还说不清，没关系，接下来我们一起来学习。

接下来我们一起来实现一个**本地资料盘点 Agent**，在过程中一步一步学习 Agent 的相关概念：它会查看指定目录、搜索待办、生成报告草稿、接受程序验收，并在正式发布前停下来等你确认。

一句话概括：

> **从会和 AI 聊天，到让 AI Agent 可靠地完成一项真实工作。**

<figure class="agent-diagram agent-diagram-overview">
  <img src="/diagrams/agents/agent-overview.svg" alt="AI Agent 从用户目标、循环判断到程序验收和人工确认的简化流程图">
  <figcaption>先看懂这条主线：Agent 反复观察、决定并调用工具；程序验收通过后，再由人确认结果。</figcaption>
</figure>

## 先按你的起点选路线

不确定从哪开始？对号入座就行：

| 你现在的情况 | 从哪里开始 | 走完能做到什么 |
| --- | --- | --- |
| 没接触过 Agent，也没用过终端或 Git | [零基础：AI Agent 和聊天有什么区别](/agents/start/what-is-agent) | 看懂 Agent 的工作循环，知道它适合什么、不适合什么 |
| 会使用 AI 对话，能运行基本 Java 或 Python 命令 | [实战：十分钟跑通第一个 Agent](/agents/build/from-chat-to-agent) | 独立实现工具、循环、状态、审批、验证和基础评测 |
| 已经做过 Agent，希望解决工程问题 | [进阶：上线时会踩的坑](/agents/advanced/tool-calling) | 设计 MCP、上下文、记忆、评测、多 Agent、安全与生产架构 |

## 零基础：先建立正确直觉

1. [AI Agent 和普通聊天有什么区别？跟一个任务走完就懂了](/agents/start/what-is-agent)
2. [装好这四样东西，再开始写第一个 Agent](/agents/start/prepare)

读完这两篇，你就能分清聊天模型、工具和 Agent 各自干什么，不会被一句"完成了"糊弄过去。

## 实战：做出一个可靠的单 Agent

1. [跑起来再说：十分钟让 Agent 完成一次真实盘点](/agents/build/from-chat-to-agent)
2. [模型的手和脚：一次 Tool Calling 到底发生了什么](/agents/build/tool-calling)
3. [让 Agent 自己转起来：循环、停止条件和失败处理](/agents/build/agent-loop)
4. [工具不是越万能越好：做窄、做安全、做可预测](/agents/build/tool-design)
5. [跑到一半断了怎么办：状态保存、上下文和检查点](/agents/build/state-checkpoints)
6. [Agent 能写文件了，怎么保证它不乱来？](/agents/build/approval-verification)
7. [这次跑通了，下次还能通吗？给 Agent 建一套考试](/agents/build/evaluation)

走完这七章，你会得到一个能跑、能验收的小 Agent。Java 是默认主线，Python 提供等价工程；页面顶部切换一次，后面的代码组和其他章节会继续使用你的选择。

## 进阶：把演示项目变成工程系统

1. [Tool Calling 进阶：上线时会踩的坑都在这里](/agents/advanced/tool-calling)
2. [MCP 是什么，解决了什么问题，没解决什么问题](/agents/advanced/mcp)
3. [上下文工程：不是塞得越多，Agent 就越聪明](/agents/advanced/context)
4. [Agent 记忆：保存什么、何时召回、怎样忘记](/agents/advanced/memory)
5. [Agent 出错了，怎么修、怎么测、怎么保证下次不错？](/agents/advanced/evaluation)
6. [什么时候才需要多 Agent：先证明拆分真的有收益](/agents/advanced/multi-agent)
7. [Agent 被攻击了怎么办？从注入到越权，一次讲清楚](/agents/advanced/security)
8. [把 Agent 送上生产：架构、运行时和发布控制](/agents/advanced/system-design)

实战里跑通的那台 Agent 还只是演示机。这八章把它升级成能上线的：工具调用做稳、上下文管好、补上记忆和评测，再把安全缺口堵上、把发布流程管起来。

## 学完主线，怎样才算真的会了

学完以后，下面这七件事你都能做到：

1. 你能解释 Agent 每一轮观察了什么、为什么调用这个工具。
2. 工具参数由程序校验，目录越界和未知工具会被拒绝。
3. 连续重复同一动作时，Agent 会停止，而不是无限消耗 Token。
4. 长任务有检查点，进程中断后能知道已经做到了哪里。
5. 写操作先进入草稿区，高风险动作绑定真实参数和人工确认。
6. 最终结果由确定性程序验收，不依赖模型自我宣布完成。
7. 修改 Prompt、模型或工具后，会在同一组测试样例上比较结果。

这七条也是整套教程的主线。后面看到新框架、新协议或新模型时，可以先问它解决了其中哪一条，再决定要不要学。

## 示例项目与版本边界

- [下载 Java 版完整项目（ZIP）](/downloads/file-audit-agent-java.zip)
- [下载 Python 版完整项目（ZIP）](/downloads/file-audit-agent-python.zip)
- 内容与代码核验日期：2026 年 7 月 27 日。
- Java 验证环境：JDK 21.0.5、Maven 3.6.3、OpenAI Java SDK 4.45.0。
- Python 验证环境：Python 3.14.2、OpenAI Python SDK 2.48.0；项目声明支持 Python 3.11 及以上版本。
- 示例默认模型为 `deepseek-v4-pro`。本地验证没有使用真实 API Key 发起付费请求；请先确认你使用的 API 服务提供这个模型 ID，并兼容示例项目调用的接口。模型名称、权限和兼容性会变化，别把教程里的默认值当成永久推荐。
- 两套示例各自的 8 个确定性测试已经在本地跑通；真实模型的输出每次可能不一样，第一次跑还是得用你自己的 API Key 和可用模型验收一遍。

## 参考文献

- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit1/what-are-agents)
- [OpenAI：Agents SDK 与 Responses API 的选择](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Model Context Protocol：Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [Chip Huyen：Agents](https://huyenchip.com/2025/01/07/agents.html)
- [HumanLayer：12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
