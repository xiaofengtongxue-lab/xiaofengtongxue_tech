---
title: 生产级 AI Agent 系统设计
description: 将确定性 Workflow、Agent Runtime、Tool Executor、状态、审批、可观测性、评测和发布控制组合成可上线、可恢复的 Agent 系统。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 生产级 Agent 系统设计：Workflow、运行时和控制面

一个 Agent Demo 通常只有模型、几个工具和 `while` 循环。生产系统还要同时处理身份、租户、状态恢复、长任务、审批、幂等、版本、观测、评测和回滚。关键不是把它拆成多少微服务，而是每一类责任有没有明确所有者和可验证边界。

<figure class="agent-diagram">
  <img src="/diagrams/agents/production-system.svg" alt="生产级 Agent 系统的入口、确定性 Workflow、Agent Runtime、Tool Executor、状态检查点、审批和控制面架构图">
  <figcaption>执行面完成一次任务；控制面管理版本、评测、观测和发布门槛。两者通过 Trace 和版本标识形成闭环。</figcaption>
</figure>

## 外层 Workflow 固定不能省的步骤

生产系统通常采用 Agentic Workflow：

```text
身份与租户校验
  → 输入安全与任务分类
  → Agent 处理开放式判断
  → 确定性结果验证
  → 必要时人工审批
  → 执行副作用
  → 记录凭证并返回
```

能写成确定规则的部分尽量确定化。Agent 只负责无法提前穷举、需要根据环境反馈动态选择的部分。

## 一次请求的完整生命周期

### 1. 接入层

- 验证身份、租户和会话；
- 限流、大小限制和内容类型检查；
- 生成 `request_id`、`trace_id` 和安全标识；
- 把用户输入与连接器数据分开标记。

### 2. Workflow 层

- 选择任务模板和风险等级；
- 固定必经节点；
- 创建任务状态和总预算；
- 决定同步处理、后台任务或人工队列。

### 3. Agent Runtime

- 组装当前 Context；
- 调用模型；
- 解析 Tool Call；
- 管理循环、计划、停止和无进展检测；
- 保存检查点；
- 把候选完成交给 Validator。

### 4. Tool Executor

- Schema 和业务参数校验；
- 身份、租户、权限和当前状态守卫；
- 超时、重试、熔断和速率限制；
- 幂等与副作用状态；
- 沙箱和网络出口；
- 返回稳定错误契约。

### 5. 验证与审批

- 确定性结果检查；
- 高风险动作生成待确认 Artifact；
- 审批绑定参数、版本、Hash、授权人和过期时间；
- 执行前重新校验；
- 执行后读取权威系统确认结果。

## State Store 不是聊天记录表

至少分别保存：

- Workflow 当前状态与版本；
- Agent 检查点和待办；
- Tool Call、业务幂等键和执行状态；
- 审批动作与过期时间；
- Artifact 元数据和 Hash；
- 模型、Prompt、Tool、Policy 版本；
- 原始消息或摘要的受控引用。

状态更新使用乐观锁、事务或事件序列，避免两个 Worker 同时把旧状态写成“最新”。

## 长任务要进入可靠任务系统

秒级请求可以同步完成；分钟级到小时级任务需要：

- 持久任务队列；
- Worker 租约或心跳；
- 可取消和截止时间；
- 重试策略和死信队列；
- 检查点恢复；
- 进度事件；
- 人工等待状态；
- 部分结果和失败原因。

不要用一个 HTTP 请求一直挂着，也不要让重启后的 Worker 从头重复全部副作用。

## 控制面管理版本和发布

把下面这些当作可独立版本化配置：

```text
app_version
workflow_version
prompt_version
model_route_version
tool_schema_version
policy_version
memory_strategy_version
eval_dataset_version
```

控制面负责：

- Prompt、工具和策略发布；
- 离线数据集与 Eval Run；
- 候选版本比较和门槛；
- 灰度、影子、只读和回滚；
- 模型路由、预算和降级；
- 审计谁在何时修改了什么。

不要在生产容器里手改 Prompt，然后失去可复现性。

## 可观测性要覆盖一条任务链

### Trace

解释一次任务：每轮模型调用、工具、状态转移、审批和验证怎样连接。

### Metrics

观察整体趋势：

- 任务完成率；
- 工具成功率和错误码；
- P50/P95/P99 延迟；
- Token 与归集费用；
- 平均轮数和无进展停止；
- 人工接管和审批拒绝；
- 安全 Guardrail 与越权拒绝；
- 按版本分组的质量变化。

### Logs

记录结构化事件和关联 ID，不把敏感原文无差别复制。高基数字段和原始 Tool Output 进入受控存储，不直接作为监控标签。

## SLO 要从任务结果定义

Agent 服务 `HTTP 200` 不等于成功。可用性指标可以是：

```text
在 10 分钟内完成并通过业务验证的低风险任务比例
高风险动作未审批执行率 = 0
关键工具 P95 成功延迟
可恢复任务在 Worker 重启后的恢复成功率
```

错误预算耗尽时，暂停扩大流量或新能力，优先处理失败簇。模型供应商可用性只是整体 SLO 的一部分。

## 降级路径要在故障前设计

模型、检索、MCP Server 或业务 API 不可用时，可以：

- 从 Agent 降级为固定 Workflow；
- 从写操作降级为只生成草稿；
- 从实时数据降级为带时间戳缓存；
- 请求用户补充信息；
- 转人工队列；
- 返回已完成的部分和未完成原因。

降级结果必须明确标注，不要用旧数据假装实时成功。

## 从模块化单体开始通常更合适

第一版可以是一个服务进程，但内部模块边界清楚：

```text
api/
workflow/
agent_runtime/
tools/
state/
approval/
validation/
observability/
evals/
```

只有当独立扩缩、故障隔离、团队所有权、合规或技术栈差异形成真实需求时，再拆服务。过早微服务化会让 Agent 状态、Trace 和幂等更难处理。

## 上线前的最小门槛

### 任务与模型

- 目标、输入、输出和停止条件明确；
- 模型路由来自当前业务评测；
- 信息不足时能澄清或失败，不编造完成。

### 工具与状态

- 工具单一职责、严格参数和最小权限；
- 超时、重试、幂等和未知状态有处理；
- 检查点可恢复，状态转移可审计；
- 关键业务事实来自权威系统。

### 安全

- 外部内容按不可信数据隔离；
- Secret 不进入模型 Context；
- 高风险动作绑定具体审批；
- 沙箱、网络出口、MCP 和供应链已审计；
- 跨租户泄露测试为零。

### 质量与发布

- 核心、回归、安全和边界数据集存在；
- 候选版本通过发布门槛；
- 线上 Trace、指标、告警和人工接管可用；
- 有灰度、降级、回滚和事件响应流程。

## 回到整套教程的一句话

从聊天到 Agent，真正增加的不是一个更长的 Prompt，而是一套反馈和责任系统：

```text
模型做候选判断
工具接触真实世界
状态保留任务现场
Workflow 固定必经边界
审批控制高风险副作用
验证器判断是否完成
Trace 和 Eval 推动版本改进
```

如果你能把自己的 Agent 放进这七层，并拿出每层的验证证据，就已经具备从 Demo 走向生产的完整地图。可以回到 [AI Agent 教程总览](/agents/) 按项目需要复查具体章节。

## 版本与事实来源

- 本页核验日期：2026 年 7 月 26 日。
- 架构图是通用责任划分，不要求每个方框都部署成独立服务。
- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [OpenAI：Agents SDK](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI：API deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist)
- [HumanLayer：12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
