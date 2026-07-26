---
title: AI Agent 上下文工程教程
description: 为长任务 Agent 设计 Context Budget，分清手动重放、previous_response_id、Conversations API 和 Compaction，并避免长上下文噪声。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 上下文工程：不是塞得越多，Agent 就越聪明

Agent 运行 30 轮后，Context 里可能同时出现系统规则、用户目标、工具 Schema、长网页、错误日志、旧计划和重复结果。上下文窗口还没满，模型却已经开始忘记当前约束、重复旧动作。问题不是容量不够，而是有效信息被噪声挤走了。

## Context 是一次调用的最终输入

<figure class="agent-diagram">
  <img src="/diagrams/agents/state-context-memory.svg" alt="规则、用户输入、History、Workflow State、RAG 和 Long-term Memory 组装成当前 Context 的图解">
  <figcaption>History、State、Memory 和 RAG 是候选来源；Context 是经过选择后真正发送给模型的成品。</figcaption>
</figure>

这意味着 Context Engineering 不是“把数据库都连上”，而是每一轮决定：

- 哪些规则仍然生效；
- 当前目标和验收标准是什么；
- 哪些工具结果会影响下一步；
- 哪些旧过程已经过期；
- 需要从外部知识或记忆取回什么；
- 为模型输出预留多少空间。

## 先做一张 Context Budget

```text
模型总上下文
  - 输出和推理预留
  - 系统与开发者规则
  - 工具 Schema
  - 当前用户输入
  - Workflow State
  - 必要 Tool Call / Result
  - RAG 证据
  = 可用于近期历史、摘要和长期记忆的预算
```

预算不足时，通常优先保留：

1. 当前安全和业务规则；
2. 当前用户目标与验收标准；
3. 已验证的任务状态；
4. 直接影响下一步的工具结果；
5. 相关外部证据；
6. 最近原始对话；
7. 长期偏好和低相关历史。

不要为了保留寒暄，拆散 Tool Call 和 Tool Result 的协议配对。

## 三种 Responses 状态策略怎么选

### 手动维护输入 Item

应用保存并重放所需 Item：

```python
input_items.extend(response.output)
input_items.append({
    "type": "function_call_output",
    "call_id": call_id,
    "output": result,
})
```

优点是状态完全由应用掌控，便于自定义保留和持久化；代价是必须正确保留 Item 类型、调用 ID、推理内容和顺序。

### `previous_response_id`

把上一条 Response ID 交给服务端续接，应用只发送新输入。适合不需要自己重写历史、可以接受服务端状态策略的普通多轮任务。

需要注意：新的 `instructions` 不会自动从上一条 Response 继承，应用必须按当前请求重新提供生效规则。即使使用 `previous_response_id`，历史输入 Token 仍可能计入计费，不能把它当作免费记忆。

### Conversations API

把多轮输入和输出归入一个持久 Conversation，适合跨会话或跨设备继续。它解决的是服务端会话状态，不会自动完成业务 Workflow State、长期 Memory 和权限恢复。

三种方案不是质量等级。选择依据是数据保留、可审计性、恢复方式、ZDR 要求和你是否需要自定义压缩。

## 长任务为什么需要 Compaction

简单截掉最旧消息会丢失目标、关键结论或调用配对。Compaction 的目标是压缩旧过程，同时保留后续继续工作所需的机器状态。

常见策略：

- 使用服务端 Context Management 在阈值触发压缩；
- 应用主动调用 Compaction 接口，并把返回结果原样用于下一轮；
- 自己生成结构化阶段摘要，再保留最近原始窗口。

如果接口返回的是机器续接状态，不要当成人类摘要随意编辑。自己做摘要时至少区分：

```json
{
  "confirmed_facts": [],
  "unverified_claims": [],
  "constraints": [],
  "completed_actions": [],
  "pending_actions": [],
  "open_questions": [],
  "source_event_ids": []
}
```

“可能是缓存问题”不能在摘要里升级成“根因已经确定是缓存”。

## Workflow State 应该结构化，不要只写一段总结

```json
{
  "goal": "盘点资料并发布报告",
  "phase": "waiting_approval",
  "verified": {
    "file_count": 23,
    "source": "list_files:call_17"
  },
  "pending_action": {
    "action_id": "publish_42",
    "draft_sha256": "...",
    "expires_at": "..."
  },
  "constraints": ["不得修改原文件"]
}
```

结构化状态能让应用验证字段、做状态转移和审计。自然语言摘要仍可帮助模型理解背景，但不能独自承载授权和业务事实。

## 工具 Schema 本身也占 Context

80 个工具的名称、描述和 JSON Schema 可能在用户还没说话前就消耗大量输入。优化顺序通常是：

1. 删除重复和废弃工具；
2. 按当前状态只暴露允许动作；
3. 按业务域路由后加载候选集；
4. 使用支持工具搜索或延迟加载的能力；
5. 在固定前缀稳定时利用 Prompt Cache。

不要靠把描述压成含糊缩写省 Token。工具更短但更难选，整体成本可能更高。

## RAG 证据要有检索预算

一次塞入 Top-50 文档并不等于证据充分。建议为检索定义：

- 当前问题需要哪些来源类型；
- 权限过滤先于语义排序；
- 单来源和总 Token 上限；
- 时间和版本约束；
- 冲突证据怎样展示；
- 哪些结论必须带引用；
- 找不到证据时怎样明确说不足。

外部文档始终是不可信数据，其中的 Prompt Injection 不能修改系统规则或工具权限。

## 上下文质量怎样评测

不要只记录平均 Token。至少测试：

- 关键约束保留率；
- 过期事实误用率；
- Tool Call / Result 配对完整率；
- 长工具输出后目标恢复能力；
- 摘要把猜测写成事实的比例；
- 跨用户或跨租户泄露率；
- 压缩前后完成率、延迟和费用；
- 同一阶段多轮后的重复调用率。

建立“信息变更、用户纠正、超长结果、恶意注入、暂停恢复”五类长对话样例，比只测一条顺利会话更有价值。

## Context 和 Memory 的分界

Context 关心“这一轮需要看什么”；Memory 关心“哪些信息值得跨轮或跨任务保存，并在何时取回”。下一篇进入 [Agent 记忆](/agents/advanced/memory)，重点讨论写入、冲突、遗忘和投毒，而不是继续扩大上下文窗口。

## 版本与事实来源

- 本页核验日期：2026 年 7 月 26 日。
- Responses 的状态、Compaction 和 Prompt Cache 参数会随模型和账户策略变化，实施前应核对当前接口文档和数据保留要求。
- [OpenAI：Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
- [OpenAI：API deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist)
- [OpenAI：Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
