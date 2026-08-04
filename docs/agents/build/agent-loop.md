---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: Agent 怎样循环干活：Loop、停止与失败处理
description: 在 Tool Calling 之上实现可控 Agent Loop，处理多轮工具调用、错误反馈、最大轮次、无进展检测和最终结果验收。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 让 Agent 自己转起来：循环、停止条件和失败处理

Tool Calling 解决了一次“模型提议、应用执行、结果回传”。可资料盘点至少需要列目录、搜索、读文件、写草稿四类动作。谁负责把这些调用一轮接一轮地串起来？

就是 Agent Loop。

<AgentLanguageSwitch />

<figure class="agent-diagram agent-diagram-compact">
  <img src="/diagrams/agents/agent-loop.svg" alt="Agent 在观察现状、决定下一步、调用工具、读取结果和检查验收条件之间循环的图解">
  <figcaption>Loop 的价值不只是让模型继续调用工具，更重要的是每一轮都有边界、反馈和退出条件。</figcaption>
</figure>

## 最小循环其实只有三种结果

每次调用模型后，应用处理三种结果：

1. 模型提出了工具调用：执行工具，把结果送回去，进入下一轮；
2. 模型没有调用工具：运行任务验证器，通过才结束；
3. 达到安全边界：主动停止，保留现场让人排查。

省略检查点保存、事件记录和重复调用检测后，示例项目的主循环可以缩成：

::: code-group
```java [Java]
for (int step = state.nextStep; step < settings.maxSteps(); step++) {
    ModelTurn turn = model.complete(
        INSTRUCTIONS,
        tools.schemas(),
        List.copyOf(state.inputItems)
    );
    state.inputItems.addAll(turn.items());

    if (turn.toolCalls().isEmpty()) {
        VerificationResult verification = ReportVerifier.verify(
            tools, settings.draftPath()
        );
        if (verification.passed()) {
            state.status = "ready_for_approval";
            return new AgentRunResult(
                state,
                settings.draftPath(),
                verification,
                turn.outputText()
            );
        }

        state.inputItems.add(userMessage(
            "草稿尚未通过确定性验收，请修正后再次调用 "
                + "save_report_draft。问题："
                + String.join("；", verification.issues())
        ));
        continue;
    }

    for (ToolCall call : turn.toolCalls()) {
        Map<String, Object> result = tools.dispatch(
            call.name(), call.arguments()
        );
        state.inputItems.add(ResponseInputItem.ofFunctionCallOutput(
            ResponseInputItem.FunctionCallOutput.builder()
                .callId(call.callId())
                .output(toJson(result))
                .build()
        ));
    }
}
```

```python [Python]
for step in range(state.next_step, settings.max_steps):
    turn = model.complete(
        instructions=INSTRUCTIONS,
        tools=tools.schemas,
        input_items=state.input_items,
    )
    state.input_items.extend(turn.items)

    if not turn.tool_calls:
        verification = verify_report(tools, settings.draft_path)
        if verification.passed:
            state.status = "ready_for_approval"
            return AgentRunResult(
                state=state,
                draft_path=settings.draft_path,
                verification=verification,
                final_text=turn.output_text,
            )

        state.input_items.append({
            "role": "user",
            "content": (
                "草稿尚未通过确定性验收，请修正后再次调用 "
                "save_report_draft。问题："
                + "；".join(verification.issues)
            ),
        })
        continue

    for call in turn.tool_calls:
        tool_result = tools.dispatch(call.name, call.arguments)
        state.input_items.append({
            "type": "function_call_output",
            "call_id": call.call_id,
            "output": json.dumps(tool_result, ensure_ascii=False),
        })
```
:::

代码不长。真正的难点都藏在“什么时候继续，什么时候必须停”里面。

## 模型停止输出，不代表任务完成

有些实现看到模型返回最终文本，就直接 `return response.output_text`。这等于把完成标准交给模型自评。

我们的资料盘点有更硬的标准：

- 草稿文件存在；
- 恰好一个 H1；
- 三个必需章节齐全；
- 文件总数跟真实目录一致；
- 至少引用一个真实文件路径；
- 不包含越界或虚构路径。

所以模型没再调用工具时，程序先跑确定性验证器。验收失败会把具体问题作为新反馈送回模型，让它修一次。只有验证器通过，状态才变成 `ready_for_approval`。

“模型停止”和“任务完成”，这是两回事。

## 最大轮次是最便宜的一道保险

模型可能不断搜索、不断改写，也可能因为工具结果不够清楚而犹豫。不管原因是什么，循环都不能无限运行。

::: code-group
```java [Java]
for (int step = state.nextStep; step < settings.maxSteps(); step++) {
    // 执行一轮模型与工具交互
}

throw new IllegalStateException(
    "超过最大执行轮次 " + settings.maxSteps() + "，任务没有通过验收"
);
```

```python [Python]
for step in range(state.next_step, settings.max_steps):
    ...

raise RuntimeError(
    f"超过最大执行轮次 {settings.max_steps}，任务没有通过验收"
)
```
:::

`max_steps=10` 不是通用最佳值，只是这个小任务的本地上限。实际项目还应该同时限制：

- 总耗时；
- 输入和输出 Token；
- API 费用；
- 单个工具调用超时；
- 同类工具调用次数；
- 外部系统请求速率。

边界值应该来自真实任务分布和评测，不要照抄教程。

## 还要识别“看起来在动，其实没进展”

只设最大轮次有个问题：Agent 可能连续十次调用完全相同的工具，白白耗完预算。

示例项目会把每一轮的工具名和参数计算成签名：

::: code-group
```java [Java]
String signature = FileSupport.sha256(name + ":" + arguments);
```

```python [Python]
signature = sha256(f"{name}:{arguments}".encode("utf-8")).hexdigest()
```
:::

同一组调用连续出现三轮时，程序主动停止：

```text
连续重复同一组工具调用，Agent 已停止以避免无效循环
```

运行测试验证：

::: code-group
```bash [Java]
mvn -Dtest=FileAuditAgentTest#stopsRepeatedToolLoop test
```

```bash [Python]
python -m unittest tests.test_agent.FileAuditAgentTest.test_stops_repeated_tool_loop -v
```
:::

期望看到：

::: code-group
```text [Java]
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
```

```text [Python]
test_stops_repeated_tool_loop ... ok
```
:::

生产系统可以进一步判断“没有新增文件、没有新发现、计划没有完成项变化”。签名只是最容易落地的起点。

## 工具失败要变成下一轮能用的信息

假设模型调用：

```json
{"name":"read_text_file","arguments":"{\"path\":\"missing.md\"}"}
```

应用不应该直接退出，也不应该把完整堆栈塞回上下文。一个可用的反馈是：

```json
{
  "ok": false,
  "error_code": "invalid_tool_call",
  "message": "文件不存在：missing.md",
  "retryable": false
}
```

模型据此知道应该先重新列目录，而不是原参数重试。对于网络超时，可以返回 `retryable: true`，但重试次数仍由应用限制。

## 多个工具调用要不要并行

Responses API 可以在一轮里返回多个 Function Call。应用可以并行执行互不依赖的只读工具，比如同时查询两个城市。但资料盘点里“先列目录，再读发现的路径”有依赖关系，强行并行反而会制造猜路径。

判断能不能并行，看三个条件：

- 两个调用输入都已经具备，而且互不修改同一资源——可以考虑并行；
- 第二个调用需要第一个结果——必须串行；
- 任何写操作先按业务锁、幂等和审批要求处理，不能只因为模型同时返回就并发执行。

## 给循环留下可读的现场

每一轮结束时，示例会保存：

- 当前运行编号；
- 下一轮编号；
- 输入和模型输出 Item；
- 工具名、参数摘要、成功状态和错误码；
- 当前任务状态。

所以循环停止不是“什么都没得到”。你仍然能在 `.agent/checkpoints/` 中看到最后一次有效观察，判断是工具设计、模型决策还是验收标准出了问题。

## 现在回头看一次完整成功

`test_completes_only_after_report_passes_verification` 使用一个按脚本返回结果的假模型：先列文件、再搜索、再保存草稿，最后输出结束文本。

::: code-group
```bash [Java]
mvn -Dtest=FileAuditAgentTest#completesOnlyAfterReportPassesVerification test
```

```bash [Python]
python -m unittest tests.test_agent.FileAuditAgentTest.test_completes_only_after_report_passes_verification -v
```
:::

测试通过同时证明：

1. Tool Call 和 Tool Result 能连续配对；
2. 三次工具调用会进入事件记录；
3. 模型结束后仍会运行验证器；
4. 只有报告通过，状态才是 `ready_for_approval`。

它没有证明真实模型每次都能选对工具。那一层需要后面的行为评测，不是单元测试能代替的。

## 下一步为什么要重新设计工具

循环写对了，Agent 仍可能跑偏。很多时候不是模型“不聪明”，而是工具太宽、参数太复杂、错误结果没有方向，或者读取范围根本没限制。

下一篇进入 [工具设计：Schema、路径边界和错误契约](/agents/build/tool-design)。这是把 Agent 从玩具 Demo 拉回工程现实的第一步。

## 参考与版本

- 本页代码核验日期：2026 年 7 月 27 日。
- 两套示例都使用手动输入 Item 管理状态；Java SDK 版本为 4.45.0，Python SDK 版本为 2.48.0。
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [HumanLayer：12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
