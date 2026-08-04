---
title: Tool Calling 到底是什么：模型的手和脚
description: 拆开一次完整 Tool Calling：定义工具 Schema、接收 function_call、应用层执行函数，再把 function_call_output 返回模型。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 模型的手和脚：一次 Tool Calling 到底发生了什么

上一章里，模型真的找到了 `TODO`。问题来了：模型本身不会直接执行你项目里的 Java 或 Python 代码，它到底怎样“使用”了 `list_files`？

答案就是 Tool Calling。拆开来看分四步：**应用先把可用工具的名字、说明和参数结构告诉模型；模型返回一次结构化调用建议；应用校验并执行真实函数；再把结果绑定到原调用送回模型。**

<AgentLanguageSwitch />

<figure class="agent-diagram">
  <img src="/diagrams/agents/tool-calling-sequence.svg" alt="用户、应用层 Agent Loop、模型和本地工具之间完成一次 Tool Calling 的时序图">
  <figcaption>模型没有直接碰工具。应用层始终站在模型和真实环境之间。</figcaption>
</figure>

## 为什么不能只在 Prompt 里写“你可以读文件”

Prompt 只能告诉模型应该怎么做，不能凭空给它操作系统权限。你写：

```text
请读取 notes/ideas.md。
```

如果应用没有提供读文件工具，模型最多根据文件名猜内容。Tool Calling 增加的是一条真实的数据通路，不是一句更强势的提示词。

## 把普通函数翻译成模型能读懂的 Schema

打开 Java 版的 `WorkspaceTools.java` 或 Python 版的 `file_audit_agent/tools.py`，`list_files` 的工具定义核心是：

::: code-group
```java [Java]
return FunctionTool.builder()
    .name("list_files")
    .description("列出工作目录内的文件、大小和类型。开始盘点时优先调用。")
    .parameters(FunctionTool.Parameters.builder()
        .putAdditionalProperty("type", JsonValue.from("object"))
        .putAdditionalProperty("properties", JsonValue.from(Map.of(
            "relative_dir", Map.of(
                "type", "string",
                "description", "工作目录内的相对目录，例如 . 或 notes")))
        .putAdditionalProperty("required", JsonValue.from(List.of("relative_dir")))
        .putAdditionalProperty("additionalProperties", JsonValue.from(false))
        .build())
    .strict(true)
    .build();
```

```python [Python]
{
    "type": "function",
    "name": "list_files",
    "description": "列出工作目录内的文件、大小和类型。开始盘点时优先调用。",
    "parameters": {
        "type": "object",
        "properties": {
            "relative_dir": {
                "type": "string",
                "description": "工作目录内的相对目录，例如 . 或 notes",
            }
        },
        "required": ["relative_dir"],
        "additionalProperties": False,
    },
    "strict": True,
}
```
:::

这段 Schema 解决三个问题：

1. 工具叫什么：`list_files`；
2. 什么时候用：开始盘点、需要看真实文件列表时；
3. 参数长什么样：必须提供字符串 `relative_dir`，不能夹带其他字段。

模型会读这份说明来做选择。但 `strict: true` 也不等于参数自动安全——路径是不是越界、当前用户有没有权限，仍要在应用层检查。

## 模型返回的是调用请求，不是函数结果

一次 Responses API 输出可能包含这样的 Item：

```json
{
  "type": "function_call",
  "call_id": "call_abc123",
  "name": "list_files",
  "arguments": "{\"relative_dir\":\".\"}"
}
```

注意两个细节：

- `arguments` 是 JSON 字符串，需要解析和验证；
- `call_id` 用来把后面的工具结果绑定回这一次调用。

这时候文件还没有被读取。模型只是在说：“我建议现在调用 `list_files`，参数是 `.`。”

## 应用层决定能不能执行

示例项目不会根据模型给出的字符串反射调用任意函数。Java 使用显式 `switch`，Python 使用显式注册表：

::: code-group
```java [Java]
Map<String, Object> data = switch (name) {
    case "list_files" -> {
        requireOnly(arguments, Set.of("relative_dir"));
        yield listFiles(requiredString(arguments, "relative_dir"));
    }
    case "read_text_file" -> {
        requireOnly(arguments, Set.of("path"));
        yield readTextFile(requiredString(arguments, "path"));
    }
    case "search_text" -> {
        requireOnly(arguments, Set.of("query", "relative_dir"));
        yield searchText(
            requiredString(arguments, "query"),
            requiredString(arguments, "relative_dir")
        );
    }
    case "save_report_draft" -> {
        requireOnly(arguments, Set.of("content"));
        yield saveReportDraft(requiredString(arguments, "content"));
    }
    default -> throw new IllegalStateException("未处理的工具：" + name);
};
```

```python [Python]
self._registry = {
    "list_files": RegisteredTool(self._list_files_schema(), self.list_files),
    "read_text_file": RegisteredTool(self._read_text_schema(), self.read_text_file),
    "search_text": RegisteredTool(self._search_text_schema(), self.search_text),
    "save_report_draft": RegisteredTool(self._save_draft_schema(), self.save_report_draft),
}
```
:::

分发器先确认工具存在，再解析 JSON、检查参数类型、执行函数，并把错误变成结构化结果：

::: code-group
```java [Java]
Map<String, Object> result = tools.dispatch(call.name(), call.arguments());
```

```python [Python]
result = tools.dispatch(call.name, call.arguments)
```
:::

目录越界时，模型拿到的不会是一段完整应用堆栈，而是：

```json
{
  "ok": false,
  "error_code": "invalid_tool_call",
  "message": "路径越过了工作目录边界",
  "retryable": false
}
```

给模型一个清晰的错误契约，它才知道：这是换参数就能解决的问题，不是无脑重试三次。

## 把真实结果送回模型

应用执行工具后，追加一条 `function_call_output`：

::: code-group
```java [Java]
state.inputItems.add(ResponseInputItem.ofFunctionCallOutput(
    ResponseInputItem.FunctionCallOutput.builder()
        .callId(call.callId())
        .output(mapper.writeValueAsString(result))
        .build()
));
```

```python [Python]
state.input_items.append(
    {
        "type": "function_call_output",
        "call_id": call.call_id,
        "output": json.dumps(result, ensure_ascii=False),
    }
)
```
:::

然后再次调用模型。模型看到的已经不是“请盘点目录”这一句，而是：

```text
用户目标
  + 模型上一轮提出的 function_call
  + 应用实际执行得到的 function_call_output
```

它可以根据这份观察结果继续搜索，也可以在信息足够时写草稿。

## 为什么要保留完整的模型输出 Item

项目里的适配器会把 `response.output` 中需要继续携带的 Item 追加到下一轮输入：

::: code-group
```java [Java]
if (item.isFunctionCall()) {
    items.add(ResponseInputItem.ofFunctionCall(item.asFunctionCall()));
} else if (item.isReasoning()) {
    items.add(ResponseInputItem.ofReasoning(item.asReasoning()));
} else if (item.isMessage()) {
    items.add(ResponseInputItem.ofResponseOutputMessage(item.asMessage()));
}
```

```python [Python]
items = [item.model_dump(exclude_none=True) for item in response.output]
```
:::

不能只保留一段可见文本。对推理模型来说，工具调用同时返回的推理 Item 也可能需要原样带回。漏掉 Item、调用 ID 或元数据，会让多轮工具调用质量下降，甚至无法继续。

## 用一个测试确认路径越界真的被挡住

运行：

::: code-group
```bash [Java]
mvn -Dtest=WorkspaceToolsTest#rejectsPathTraversal test
```

```bash [Python]
python -m unittest tests.test_tools.WorkspaceToolsTest.test_rejects_path_traversal -v
```
:::

期望结果：

::: code-group
```text [Java]
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
```

```text [Python]
test_rejects_path_traversal ... ok
```
:::

对应测试故意让模型参数指向 `../secret.txt`。通过的含义不是“模型永远不会尝试越界”，而是“即使它尝试，应用层也会拒绝”。

## Tool Calling 还不是完整 Agent

一次工具调用只解决：模型能请求真实能力，并读取一次结果。

如果任务需要“列文件 → 搜索 → 读内容 → 写草稿 → 验收失败后修正”，应用还要反复调用模型，并处理：

- 最大轮次；
- 连续重复动作；
- 工具错误；
- 模型提前结束；
- 结果验证；
- 检查点与恢复。

下一篇就要补上这个：[Agent Loop](/agents/build/agent-loop)。

## 常见误判

### “模型支持 Function Calling，所以工具参数可以直接信”

Schema 约束能减少格式错误，不能替代业务权限、路径边界、金额上限和状态校验。模型输出始终是候选请求。

### “把所有后端接口都注册成工具，Agent 就更强”

名称和描述越相似，模型越容易误选，上下文也越贵。工具应该围绕当前任务按需暴露，高风险工具还要单独审批。

### “工具报错就抛异常，让模型自己理解”

原始异常可能泄露内部路径、数据库信息或凭证，而且模型不知道能不能重试。给它稳定的错误码、可理解说明和 `retryable` 字段更有用。

## 参考与版本

- 本页代码核验日期：2026 年 7 月 27 日。
- Java 示例使用 OpenAI Java SDK 4.45.0，Python 示例使用 OpenAI Python SDK 2.48.0；接口字段变化时以官方文档为准。
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：Responses API create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [JSON Schema](https://json-schema.org/learn/getting-started-step-by-step)
