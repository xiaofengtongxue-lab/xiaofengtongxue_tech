---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: Agent 任务中断后怎样恢复：状态与检查点
description: 分清对话历史、模型上下文、任务状态和长期记忆，并为多步 Agent 保存可恢复检查点和工具事件。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 跑到一半断了怎么办：状态保存、上下文和检查点

资料盘点跑到第五轮，进程退出了。

重启之后，Agent 应该从头扫一遍，还是知道它已经列过目录、搜索过 `TODO`，接着做没完成的事？这不关"模型记性好不好"——本质是应用有没有保存任务状态。

<AgentLanguageSwitch />

## 先把四个容易混的词分开

| 概念 | 它回答什么 | 生命周期 |
| --- | --- | --- |
| History | 实际发生过哪些消息和工具事件 | 按产品保留策略决定 |
| Context | 这一次模型调用真正看见什么 | 单次调用 |
| Workflow State | 任务做到哪、有哪些错误和待确认动作 | 当前任务直到完成或过期 |
| Long-term Memory | 哪些信息跨任务仍值得以后召回 | 天、月或更久 |

在这个项目里，"已经搜索过 `TODO`"是任务状态；"用户习惯用中文报告"才可能是长期偏好。你把前者错写进长期记忆，下一次新目录盘点就会继承旧现场。

<figure class="agent-diagram">
  <img src="/diagrams/agents/state-context-memory.svg" alt="History、Workflow State、Long-term Memory、RAG、规则和用户输入共同组装当前 Context 的关系图">
  <figcaption>Context 是一次调用的输入成品，不等于数据库里保存的全部 History，也不等于长期 Memory。</figcaption>
</figure>

## 任务状态最少要存些什么

示例项目用 `RunState`：

::: code-group
```java [Java]
public final class RunState {
    public String goal;
    public String runId;
    public String status = "running";
    public int nextStep;
    public List<ResponseInputItem> inputItems = new ArrayList<>();
    public List<ToolEvent> toolEvents = new ArrayList<>();
    public String updatedAt = Instant.now().toString();
}
```

```python [Python]
@dataclass
class RunState:
    goal: str
    run_id: str = field(default_factory=lambda: uuid4().hex[:12])
    status: str = "running"
    next_step: int = 0
    input_items: list[dict[str, Any]] = field(default_factory=list)
    tool_events: list[ToolEvent] = field(default_factory=list)
    updated_at: str = field(default_factory=...)
```
:::

字段没几个，但每一条都解决一个具体的恢复问题：

- `runId` / `run_id`：找到同一次任务；
- `status`：区分运行中、待审批、无进展停止和超过轮次；
- `nextStep` / `next_step`：恢复后从哪一轮继续；
- `inputItems` / `input_items`：保留 Tool Call、Tool Result 和必要模型 Item；
- `toolEvents` / `tool_events`：不用解析整段上下文，也能看到动作轨迹。

## 为什么不能只保存最后一段文本

模型上一轮可能返回：

```text
function_call(call_id=call_123, name=search_text, ...)
```

应用执行后返回：

```text
function_call_output(call_id=call_123, result=...)
```

恢复时只保存"我正在搜索 TODO"这句摘要，会丢掉调用 ID、结构化参数和真实结果。

对需要手动重放上下文的接口，Tool Call 与 Tool Result 必须保持配对，推理 Item 也要按官方要求保留。自然语言摘要适合压缩旧过程，不适合代替关键协议状态。

## 检查点要原子写入

项目不会直接覆盖正式 JSON。它先写临时文件，再替换：

::: code-group
```java [Java]
mapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), state);
FileSupport.replace(temporary, target);
```

```python [Python]
temporary.write_text(
    json.dumps(payload, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
temporary.replace(target)
```
:::

进程写到一半崩了，旧检查点还是完整的。

生产系统还要处理并发版本、数据库事务、对象存储一致性和损坏恢复。但"不要半写一个检查点"是所有方案的共同起点。

## 亲自看一次任务现场

运行 Agent 后列出检查点：

```bash
ls sample-workspace/.agent/checkpoints
```

打开对应运行编号：

```bash
sed -n '1,260p' sample-workspace/.agent/checkpoints/RUN_ID.json
```

你应该能回答：

- 任务当前是什么状态；
- 已经调用过哪些工具；
- 哪一次调用失败了；
- 下一轮编号是多少；
- 报告内容是否被完整抄进了审计摘要。

如果只能看到一大段聊天文本，却无法快速回答这些问题——状态结构还不够清楚。

## 恢复不是把旧状态原样复活

CLI 支持：

::: code-group
```bash [Java]
java -jar target/file-audit-agent.jar \
  --root sample-workspace \
  --resume RUN_ID \
  --draft-only
```

```bash [Python]
file-audit-agent \
  --root sample-workspace \
  --resume RUN_ID \
  --draft-only
```
:::

教学项目只允许从 `running` 或 `stopped_max_steps` 恢复。正式系统恢复前还要重新检查：

- 用户和租户权限是否仍有效；
- 待确认动作是否过期；
- 文件、订单或数据库记录是否已经变化；
- Prompt、工具 Schema 和模型版本是否兼容；
- 上一次工具调用是成功、失败还是结果未知。

付款、发信这类有副作用的操作尤其危险。超时不代表没执行——恢复时应该先查询外部状态，不能直接再做一次。

## Context 不能无限增长

即使模型支持很长的上下文，你也不该把所有旧工具日志永久塞进去。长上下文会带来几个实打实的问题：

- 旧错误和过期信息干扰当前决策；
- 输入 Token、延迟和费用不断增加；
- 敏感内容被重复发送；
- 外部资料里的恶意指令持续存在。

主线项目很短，暂时保留完整 Item 是为了看清机制。长任务需要按优先级组装：

```text
当前生效规则
  + 当前用户目标
  + 已验证 Workflow State
  + 仍然相关的工具结果
  + 最近几轮原始 Item
  + 必要时生成的旧过程摘要
```

怎么压缩、何时使用服务端 Conversation 或 Compaction，会在 [上下文工程进阶](/agents/advanced/context) 继续展开。

## 检查点本身也可能泄露数据

状态文件里可能出现用户输入、文件片段、工具结果和业务 ID。不要因为它藏在 `.agent/` 目录下就默认安全。

生产环境必须搞清六件事：

- 谁能读取；
- 是否加密；
- 保存多久；
- 删除请求怎样传播；
- 日志中哪些字段必须脱敏；
- 不同用户和租户怎样隔离。

示例把报告正文在工具事件中缩成字符数和 SHA-256，但输入 Item 仍会保留工具协议所需内容。这是为了教学可见性，不是生产数据保留建议。

## 下一步：状态里出现了待审批动作

现在 Agent 能写草稿、保存现场并恢复，但"正式发布"仍然是副作用。下一篇把人工确认做成一个可验证的状态，而不是一句"你确定吗"：

[让 Agent 敢写又不乱写：人工审批与结果验证](/agents/build/approval-verification)。

## 参考与版本

- 本页代码核验日期：2026 年 7 月 27 日。
- 示例使用本地 JSON 检查点，只适合单进程教学；生产系统需要并发控制、租户隔离和版本迁移。
- [OpenAI：Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
- [OpenAI：API deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist)
- [HumanLayer：12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
