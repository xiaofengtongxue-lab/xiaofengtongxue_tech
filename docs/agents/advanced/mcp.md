---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: MCP 入门：它统一了什么，没解决什么
description: 从 Host、Client、Server、数据层和传输层理解 MCP，分清 Tools、Resources、Prompts，并处理远程授权、审批和供应链风险。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# MCP 是什么，解决了什么问题，没解决什么问题

每个 Agent 应用都为 GitHub、数据库、文件系统和内部服务各写一套工具适配。真正难维护的不是函数本身，是能力发现、参数描述、连接生命周期、授权和兼容性。MCP 解决的是这层连接协议。但它不替你设计 Agent 的目标、循环、记忆和权限策略——这些仍然是你的事。

<figure class="agent-diagram">
  <img src="/diagrams/agents/mcp-architecture.svg" alt="MCP Host 内的 Agent Runtime 和多个 Client 连接文件资料与业务系统 Server，并暴露 Tools、Resources、Prompts 的架构图">
  <figcaption>一个 Host 通常为每个 Server 建立独立 Client 连接。Server 提供能力，Host 决定怎样把能力交给模型和用户。</figcaption>
</figure>

## 三个角色先别叫混

### Host

Host 是用户真正使用的 Agent 应用——IDE、桌面 Agent、聊天应用或你的业务服务。它负责：

- 选择模型和组装 Context；
- 管理 Agent Loop、状态和记忆；
- 创建并管理 MCP Client；
- 展示审批界面；
- 执行本地安全策略；
- 决定哪些 Server 能连接。

### Client

Client 位于 Host 内，通常与一个 Server 保持一条有状态连接。它处理协议消息、能力协商和调用关联。

### Server

Server 把某个数据源或系统能力用 MCP 暴露出来——文件、GitHub、数据库、浏览器或内部工单系统。Server 仍要自己做身份验证、输入校验、租户隔离和业务权限。

一句话："接了 MCP"不等于 Host 可以信任 Server 返回的所有内容。

## MCP 有数据层，也有传输层

数据层定义 JSON-RPC 消息、生命周期和能力语义；传输层负责消息怎样到达：

- 本地进程常用 `stdio`；
- 远程 Server 常用基于 HTTP 的传输；
- 授权方式取决于 Host、Server 和部署场景。

同一个 Server 的能力语义不应该因为从本地 `stdio` 换成远程 HTTP 就全变。但威胁面会扩大——网络身份、令牌存储、TLS、回调地址、跨租户访问和服务端日志，每一项都要重新评估。

## Tools、Resources、Prompts 不是三种同义工具

| 能力 | 谁主动使用 | 适合什么 |
| --- | --- | --- |
| Tools | 模型或 Host 发起调用 | 搜索、查询、创建草稿、执行动作 |
| Resources | Host 读取或订阅上下文数据 | 文件、文档、数据库记录、当前项目资料 |
| Prompts | 用户或 Host 选择模板 | 标准化任务入口和参数化提示 |

把所有资料访问都做成 Tool，模型就得多做一堆"要不要调用"的决策——这些决策它本不该做。把有副作用的动作伪装成 Resource，审批和审计就被绕过去了。能力类型应该符合真实语义，别偷换概念。

## Function Calling 和 MCP 是上下两层

可以这样理解：

```text
Function Calling：模型怎样表达"我要调用 get_issue"

MCP：Host 怎样发现远端提供了 get_issue，怎样连接并把调用送过去
```

MCP Server 的 Tool 最终仍需要 Host 映射给模型；Host 也可以把本地 Function Tool 和 MCP Tool 放在同一任务中。两者不是"旧技术被新技术替代"的关系。

## MCP 不负责 Agent 的四件事

协议不会替 Host 决定：

1. 任务应该怎样规划；
2. 哪些历史和记忆进入当前 Context；
3. 高风险工具何时必须人工确认；
4. 怎么判断任务已经完成。

一个 Agent 接了十个 MCP Server，却没有停止条件、租户隔离和结果验证——它只是拥有更多攻击面而已。

## 连接前先审计 Server

第三方 Server 至少检查：

- 源码和发布者是否可信；
- 安装脚本会执行什么；
- 依赖和许可证；
- 需要哪些本地文件、环境变量和网络权限；
- 是否收集遥测；
- Tool 的读写范围；
- 更新机制和版本固定方式；
- 发生问题时如何撤销令牌和连接。

本地 `stdio` Server 跟普通可执行程序一样，拥有当前进程授予的系统权限。它不会因为用了标准协议就自动进入沙箱。别想当然。

## 远程 MCP 的授权要绑定用户和租户

远程 Server 常涉及 OAuth 或服务令牌。Host 不能用一把全局管理员令牌替所有用户调用，再指望 Prompt 里一句"只看自己的数据"就能隔离。

正确边界通常包括：

- 每个用户或租户独立授权；
- Scope 只包含当前任务需要的能力；
- 短期 Token 和安全刷新；
- Server 端再次验证资源归属；
- 调用日志记录主体、工具、参数摘要和结果状态；
- 用户能查看并撤销连接。

## 工具清单本身也可能不可信

Server 返回的 Tool 名称、描述和参数 Schema 会进入 Host 上下文。恶意描述可能诱导模型泄露数据或调用其他工具。

Host 应该：

- 只连接明确允许的 Server；
- 对高风险 Tool 额外分类，不只相信 Server 自报；
- 把 Server 返回内容视为外部数据；
- 使用审批显示真实 Server、Tool 和参数；
- 限制一个 Server 能看到的其他上下文；
- 对工具清单和版本变化建立审计。

## 什么时候值得引入 MCP

优先考虑 MCP 的信号：

- 同一能力要被多个 Host 复用；
- 希望按标准方式发现 Tools、Resources 和 Prompts；
- 连接生命周期和授权已经成为重复成本；
- 能力由另一个团队或产品维护；
- 需要把本地和远程数据源用统一接口接入。

如果只有一个应用调用一个稳定内部函数，直接 Function Calling Adapter 更简单。协议带来复用，也带来版本、连接和供应链成本。别为了"用上 MCP"引入你不需要的复杂度。

## MCP 接入的最小验收清单

1. 空权限用户看不到什么；
2. 两个租户是否严格隔离；
3. Server 断开、超时和返回错误时 Host 怎样恢复；
4. Tool Schema 更新是否破坏旧调用；
5. 高风险 Tool 是否显示真实参数并审批；
6. Server 返回恶意指令时会不会触发数据外传；
7. 断开连接和撤销 Token 后旧会话还能不能调用；
8. Trace 能否定位到具体 Server、Tool 和调用 ID。

## 下一步：连接更多资料以后，Context 更容易失控

MCP 能让 Agent 访问更多工具和资源，但"能取到"不等于"应该全部塞给模型"。下一篇进入 [上下文工程](/agents/advanced/context)，处理 Context Budget、状态压缩和长期任务续接。

## 参考与版本

- 本页核验日期：2026 年 7 月 26 日。
- MCP 规范与传输会继续演进，实际字段、授权流程和客户端支持以你使用的 Host、Server 和当前官方规范为准。
- [Model Context Protocol：Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [Model Context Protocol：Specification](https://modelcontextprotocol.io/specification/)
- [OpenAI：MCP and Connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
