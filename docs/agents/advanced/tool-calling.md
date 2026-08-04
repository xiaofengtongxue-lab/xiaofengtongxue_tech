---
title: Tool Calling 进阶：上线时会踩的坑
description: 面向已有 Agent 实践的开发者，系统讲解 Function Calling 的协议状态、严格 Schema、并行调用、错误契约、幂等和评测边界。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# Tool Calling 进阶：上线时会踩的坑都在这里

这篇默认你已经实现过至少一个工具调用闭环。我们不再解释"工具是 Agent 的手脚"，直接回答上线时真正容易出错的问题：哪些协议 Item 必须保留，严格 Schema 能保证到哪一步，并行调用何时安全，超时后为什么不能直接重试。

## 先把 Tool Calling 当成协议状态机

一次调用至少经历：

```text
MODEL_REQUESTED
  → ARGUMENTS_VALIDATED
  → AUTHORIZED
  → EXECUTING
  → SUCCEEDED / FAILED / UNKNOWN
  → RESULT_RECORDED
  → RETURNED_TO_MODEL
```

`function_call` 只是 `MODEL_REQUESTED`。模型给出的工具名和参数还没有通过业务校验，也没有产生任何副作用。

<figure class="agent-diagram">
  <img src="/diagrams/agents/tool-calling-sequence.svg" alt="Tool Calling 中用户、应用层、模型和工具之间的请求、执行和结果回传时序">
  <figcaption>应用层需要保存的不只是文本，还包括调用 ID、参数、执行状态和返回结果之间的关联。</figcaption>
</figure>

## `call_id` 是关联键，不是装饰字段

Responses API 的 Function Call 和 Function Call Output 通过 `call_id` 配对：

```json
{
  "type": "function_call",
  "call_id": "call_abc123",
  "name": "query_order",
  "arguments": "{\"order_id\":\"A1024\"}"
}
```

```json
{
  "type": "function_call_output",
  "call_id": "call_abc123",
  "output": "{\"ok\":true,\"status\":\"shipped\"}"
}
```

手动管理上下文时，要把模型输出 Item 和工具结果一起带回。对推理模型，工具调用同时产生的 reasoning Item 也可能是续接所必需的状态。你只摘出可见文本，协议表面还能跑，但质量和连续性会悄悄往下掉。

## 严格 Schema 只保证结构，不保证业务合法

`strict: true` 配合 `additionalProperties: false` 能显著减少多余字段和类型漂移：

```json
{
  "type": "object",
  "properties": {
    "order_id": {"type": "string"},
    "reason": {
      "type": "string",
      "enum": ["duplicate", "damaged", "other"]
    }
  },
  "required": ["order_id", "reason"],
  "additionalProperties": false
}
```

它不能证明：

- 订单属于当前用户；
- 订单仍可退款；
- 当前角色有退款权限；
- 金额没有超过审批阈值；
- 同一退款没有执行过；
- 参数不是从恶意网页中诱导出来的。

所以工具执行前，仍然要过这六关：Schema 校验、身份与租户过滤、当前状态守卫、业务规则、幂等检查和审批策略。

## 工具参数不要变成一份隐形 DSL

参数越复杂，模型越容易在字段组合上犯错。一个万能数据库工具：

```json
{
  "name": "database",
  "parameters": {
    "operation": {"enum": ["select", "insert", "update", "delete"]},
    "table": {"type": "string"},
    "filters": {"type": "object"},
    "data": {"type": "object"}
  }
}
```

这把鉴权、SQL 语义和业务状态全藏进了参数。更稳的做法是暴露业务意图清楚的工具：

```text
get_order(order_id)
list_refundable_items(order_id)
create_refund_draft(order_id, item_ids, reason)
submit_approved_refund(action_id)
```

拆分不是为了增加工具数量。每个工具拥有明确的权限、输入契约和副作用等级，这才是目的。

## 工具选择策略也要版本化

模型通常可以自动选择工具，也可以通过 `tool_choice` 限制或强制。工程上常见三种策略：

| 策略 | 适用场景 | 风险 |
| --- | --- | --- |
| 自动选择 | 开放式但低风险的探索 | 可能漏调或误调 |
| 限定工具集合 | 当前状态只允许少数动作 | 需要应用维护状态到工具映射 |
| 强制某个工具 | 必须结构化提取或执行固定步骤 | 不能把所有任务都硬塞成调用 |

高风险工具不能只靠"本轮不展示"来保护。隐藏能减少误选，但权限系统仍要在执行层拒绝越权调用。两层都要做。

## 并行调用先检查数据依赖和副作用

一轮模型输出多个 Tool Call 时，先构建依赖关系：

```text
get_weather(Beijing) ─┐
                      ├─ 可并行，互不依赖，只读
get_weather(Shanghai) ┘

search_flights → choose_flight → book_flight
                  必须串行，后一步依赖前一步结果
```

即使两个写操作互不依赖，也要检查：

- 是否修改同一业务对象；
- 是否共享速率限制或事务；
- 是否需要按顺序审计；
- 并发失败时如何补偿；
- 人工确认是否覆盖了全部并行参数。

API 的 `parallel_tool_calls` 是能力，不是命令。不是所有调用都应该并发。

## 超时后的状态可能是 `UNKNOWN`

调用支付或邮件服务超时，有三种可能：

1. 请求没有到达；
2. 请求已执行，响应丢失；
3. 请求仍在处理中。

直接重试可能造成重复付款或重复发信。生产 Tool Executor 应保存业务幂等键，超时后进入 `UNKNOWN` 或 `RECONCILING`，先查询外部系统状态。

```text
事务 1：记录 ACTION_PENDING + idempotency_key
  → 调外部服务
  → 事务 2：记录 SUCCEEDED / FAILED / UNKNOWN
```

"函数抛异常"不能完整表达副作用状态。别拿异常当状态机用。

## 工具错误要区分四个层次

```json
{
  "ok": false,
  "error_code": "rate_limited",
  "message": "订单服务暂时限流",
  "retryable": true,
  "retry_after_ms": 1200,
  "user_action_required": false
}
```

建议至少区分：

- **参数错误**：模型应修改参数；
- **权限或策略拒绝**：不能通过重试绕过；
- **临时基础设施错误**：在预算内退避重试；
- **业务状态冲突**：重新读取最新状态或交给人工。

错误正文属于工具数据。你不能通过返回字符串把它提升为系统指令。

## 工具集过大时先路由，再按需加载

几十个相似工具会增加输入 Token 和误选率。可以按业务域做确定性过滤，或让一个低风险路由步骤选择候选工具集合。

路由同样要评测。如果它把请求送错域，后面的模型只能在错误工具集里继续犯错。至少记录：

- 正确工具是否进入候选集；
- 无关高风险工具是否被暴露；
- 路由延迟和 Token；
- 候选集大小变化后的完成率。

支持工具搜索或按需发现的接口可以降低一次性 Schema 成本，但不会替代权限与评测。它们是两个维度的事。

## Tool Calling 评测要拆成五类样例

1. **该调用时选对**：真实数据必须通过工具获取。
2. **不该调用时克制**：闲聊或已有足够证据时不滥用工具。
3. **参数正确**：日期、枚举、单位、可选字段和边界值。
4. **错误恢复**：读取结构化错误后换参数、降级或停止。
5. **安全拒绝**：面对越权、注入和高风险动作时执行层不放行。

同一个模型在两个天气工具上表现好，不代表面对 80 个内部 API 仍稳定。模型选型必须回到版本化业务数据集。拿你的数据说话。

## Function Calling、Custom Tool 和 MCP 的边界

- **Function Calling**：模型输出结构化函数名和参数，由你的应用执行。
- **Custom Tool / Freeform Tool**：工具输入更适合原始文本、代码或受语法约束的内容时使用，执行责任仍在应用。
- **MCP**：统一 Host 与外部能力提供方之间的发现、调用和上下文交换协议；模型最终仍可能通过工具调用使用这些能力。

下一篇进入 [MCP 架构与安全边界](/agents/advanced/mcp)。

## 参考与版本

- 本页核验日期：2026 年 7 月 26 日。
- OpenAI 相关字段以当日 Responses API 和 Function Calling 文档为基线；不同模型与接口对严格模式、并行和自定义工具的支持需要单独核对。
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling)
- [OpenAI：Responses create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
