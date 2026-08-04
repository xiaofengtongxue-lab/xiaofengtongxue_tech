---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: 多 Agent 值得吗：拆分信号与选型
description: 从单 Agent 基线出发，判断 Router、Handoff、Orchestrator-Workers、Evaluator 和 Pipeline 的真实适用条件、协调契约与评测方法。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 什么时候才需要多 Agent：先证明拆分真的有收益

“任务复杂，所以拆成多个 Agent”——这不是充分理由。复杂任务也可能靠更好的工具、结构化状态和确定性 Workflow 解决。多 Agent 存在的前提只有一个：单 Agent 的失败能明确归因于隔离、并行或独立责任的需求，而且评测证明收益大于协调成本。

<figure class="agent-diagram">
  <img src="/diagrams/agents/multi-agent-decision.svg" alt="从单 Agent 基线出发，根据路由隔离、并行、独立候选或固定阶段选择多 Agent 模式，再与基线评测的决策图">
  <figcaption>先有单 Agent 基线和失败记录，再选最小必要模式；不是先画组织架构，再找任务填进去。</figcaption>
</figure>

## 四种值得拆分的信号

### 指令或工具需要隔离

客服、财务和运维用完全不同的规则和高风险工具。全部塞给一个 Agent，误选和权限暴露都会增加。这种情况先路由到专门 Agent。

### 独立任务可以并行

研究十家公司、检查一百个互不依赖文件，由 Orchestrator 分配给多个 Worker，再汇总结果。

### 需要独立候选和裁判

方案生成和质量评估需要不同指令、上下文或模型，Evaluator-Optimizer 才有意义。同一个上下文里两个角色互相附和，不一定有独立性。

### 阶段责任天然不同

检索、分析、合规检查、发布——阶段固定、由不同所有者维护，可以用 Pipeline。其中只有需要动态判断的节点才用 Agent。

如果失败只是工具描述重叠、Context 太长、验证器缺失，先修单 Agent。

## Router / Handoff：隔离不同任务域

```text
用户请求 → Router
  ├─ 退款 Agent
  ├─ 技术支持 Agent
  └─ 账户安全 Agent
```

Router 的输出是有成本的决策。要评测：

- 正确目标 Agent 是否被选择；
- 模糊任务是否请求澄清；
- 高风险请求是否进入安全流程；
- 错路由后能否回退；
- 每个 Agent 是否只拿到自己的工具和数据。

Handoff 时传结构化任务摘要、来源和权限。别把整个原始会话无差别复制给所有 Agent。

## Orchestrator-Workers：适合可并行的开放式拆分

Orchestrator 动态决定子任务，Worker 独立执行：

```text
研究目标
  → Orchestrator 生成 8 个公司子任务
  → 4 个 Worker 并发处理
  → 汇总、去重、验证来源
```

关键约束：

- 并发上限和总预算；
- 每个 Worker 的输入、输出 Schema；
- 任务去重和唯一 ID；
- 部分失败时重试、跳过还是整体失败；
- 汇总器如何处理冲突；
- Worker 不拥有 Orchestrator 的全部权限。

并行降低墙钟时间，但也增加调用量、尾部延迟和失败组合。

## Evaluator-Optimizer：需要可执行的质量标准

```text
Generator 生成候选
  → Evaluator 按明确标准给反馈
  → Generator 修改
  → 达标或达到轮次上限
```

适合代码、翻译、报告——能清楚定义质量标准的任务。不适合“写得更好看”这种没有评分边界的无限润色。

Evaluator 输出结构化缺陷和具体理由，别只给一句“还可以更完善”。循环同样要最大轮次、无进展检测和成本上限。

## Pipeline：不要把固定流程包装成群聊

```text
输入校验 → 检索 → Agent 分析 → 合规规则 → 人工审批 → 发布
```

阶段边界固定时，普通 Workflow 最容易测试和审计。每个节点都建一个 Agent，只会增加随机性和状态同步成本。

Pipeline 的价值是责任清晰，不是参与者名字多。

## 每个 Agent 都要有一份合同

至少定义：

```text
agent_id 和职责
允许输入及可信度
输出 Schema 和关键字段
可用工具与数据范围
Token、时间、工具调用预算
停止条件
可重试和不可重试错误
状态所有者
失败传播规则
人工接管入口
```

没合同，多 Agent 就是自然语言传话。出问题后很难确定是谁丢了字段、谁扩大了权限。

## 状态所有权要唯一

订单状态不能让三个 Agent 各自维护一份“最新版本”。推荐：

- 权威业务状态由确定性服务或数据库拥有；
- Orchestrator 拥有任务图和总体预算；
- Worker 只拥有自己的局部工作状态；
- 共享结果通过版本化事件或结构化 Artifact 传递；
- 写入使用乐观锁、事务或幂等键。

自然语言“我已经更新了订单”不是状态同步协议。

## 失败怎样传播必须提前设计

Worker 失败时，Orchestrator 需要知道：

```json
{
  "task_id": "company-7",
  "status": "failed",
  "error_code": "source_unavailable",
  "retryable": true,
  "evidence": [],
  "attempt": 2
}
```

而不是只收到“抱歉，暂时无法完成”。还要决定：

- 单个 Worker 失败是否影响全部任务；
- 重试由 Worker 还是 Orchestrator 负责；
- 重试是否换模型、工具或数据源；
- 超过预算后返回部分结果还是失败；
- 取消怎样传播到正在运行的 Worker。

## 多 Agent 的安全面会扩大

- 权限可能在 Handoff 中被错误继承；
- 一个 Worker 的恶意内容可能污染 Orchestrator；
- 多份 Context 增加敏感数据复制；
- 并行工具调用更容易撞上速率与业务锁；
- Agent 之间可能形成无限委派；
- Trace 分散后更难审计完整链路。

每个 Agent 使用最小工具集，限制委派深度和并发，所有高风险副作用仍经过统一审批与执行层。

## 怎样证明拆分值得

在同一任务集比较单 Agent 和候选多 Agent：

- 完成率与错误类型；
- P50/P95 延迟；
- 总 Token 和费用；
- 人工接管率；
- 权限与安全失败；
- Trace 可解释性；
- 部分失败后的可恢复性。

多 Agent 只让架构图更丰富却没解决已知失败簇，就回到单 Agent。

## 框架功能和架构必要性不是一回事

SDK 支持 Handoff、Subagent 或并行，不代表你的产品就该启用。供应商的多 Agent API、Beta Header 和 Item 类型会变。先从业务合同和评测出发，再选框架表达。

## 下一步：Agent 越多，安全边界越不能靠默契

下一篇进入 [Agent 安全](/agents/advanced/security)，从 Prompt Injection、数据外传、工具权限、MCP 供应链和事件响应建立完整威胁模型。

## 参考与版本

- 本页核验日期：2026 年 7 月 26 日。
- 页面讲的是通用架构模式，不把任何厂商的多 Agent Beta 能力当作稳定标准。
- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [OpenAI：Agents SDK](https://developers.openai.com/api/docs/guides/agents)
- [Microsoft：AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners)
