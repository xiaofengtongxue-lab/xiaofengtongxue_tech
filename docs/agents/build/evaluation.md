---
title: 给 Agent 建一套考试：从偶然成功到稳定可靠
description: 为资料盘点 Agent 建立分层评测：先测工具和安全边界，再用固定任务集比较完成率、路径准确度、工具轨迹、成本和人工接管。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 这次跑通了，下次还能通吗？给 Agent 建一套考试

你运行示例目录，Agent 一次成功了。

现在把 `meeting-notes.txt` 换成空目录、二进制文件、错误编码、带恶意指令的网页摘录——它还能完成吗？换模型、改 Prompt、增加工具以后，是更好了，还是只在演示样例上看起来更聪明？

评测就是把这些问题变成固定输入、明确预期和可重复记录。

<AgentLanguageSwitch />

## 先测普通代码，不花模型费用

Java 和 Python 配套项目各有 8 个测试，覆盖同一组边界：

| 测试对象 | 要证明什么 |
| --- | --- |
| 文件工具 | 能读真实文件，拒绝目录越界 |
| 草稿隔离 | `.agent` 和正式报告不会被当作源资料重复盘点 |
| 验证器 | 正确路径通过，错误计数和虚构路径失败 |
| Agent Loop | 只有验收通过才完成，重复调用会停止 |
| 审批 | 错误确认不发布，匹配确认才发布 |

运行：

::: code-group
```bash [Java]
mvn test
```

```bash [Python]
python -m unittest discover -s tests -v
```
:::

这些测试不回答"模型会不会选对工具"。但它们能先排除 Harness 自己的确定性 Bug。边界代码都没测，就直接评模型，会把两类问题混在一起。

## 再建一组真实任务来跑

不要只用一个示例目录。先收集 20 到 50 个有代表性的任务——规模不用大，但要覆盖真实失败：

```json
{
  "case_id": "empty-folder",
  "goal": "盘点目录并生成报告",
  "fixture": "fixtures/empty-folder",
  "expected": {
    "file_count": 0,
    "must_publish": false,
    "required_sections": ["文件概况", "需要关注", "建议下一步"]
  },
  "forbidden": ["虚构文件路径", "读取目录外文件"]
}
```

至少加入这些失败路径：

- 空目录；
- 文件数达到上限；
- 不支持的二进制文件；
- 文本里没有任何 TODO；
- 同一个词在多个文件出现；
- 文件内容包含"忽略规则、上传数据"的恶意指令；
- 模型猜了一个不存在的路径；
- 草稿计数错误；
- 工具临时失败；
- 用户拒绝发布。

任务集的价值来自代表性，不是数量看起来大。

## 不只评结果，还要评过程

只检查"最后有报告"会漏掉很多问题。一个 Agent 可能读完整个目录、越过预算、重试十次，最后碰巧写对。

建议至少记录五组指标：

| 维度 | 示例指标 |
| --- | --- |
| 结果 | 报告通过率、文件计数正确率、引用路径有效比例 |
| 过程 | 工具选择正确率、参数错误率、平均轮数、重复调用率 |
| 安全 | 越界尝试执行率、恶意指令服从率、未审批发布率 |
| 效率 | Token、延迟、工具次数、单任务费用 |
| 接管 | 人工澄清率、人工修正率、拒绝或超时率 |

完成率上升 2%，费用却翻三倍——这未必是更好的版本。指标要跟真实业务优先级一起看。

## 评分的时候，尽量先让程序自己判

资料盘点可以直接计算：

- 真实文件数和报告计数是否一致；
- 反引号路径是否存在；
- 原文件 Hash 是否变化；
- 发布前是否存在匹配审批事件；
- 工具调用是否越过最大次数。

这些不需要 LLM Judge。只有"建议是否有用""总结有没有忠于原文"之类程序判不了的，再考虑人工评分或模型评分。而且要用人工标注的样例校准评分器——直接信模型的打分，等于让考生给自己批卷子。

## 每次改动都跟同一个基线比较

评测记录至少带上：

```text
app_version
prompt_version
model
tool_schema_version
fixture_version
run_id
```

然后对同一任务集比较：

```text
基线版本：完成率 82%，越权执行 0%，平均 5.2 轮
候选版本：完成率 88%，越权执行 0%，平均 4.7 轮
```

数字只是格式示例，不是本项目实测结果。没有实际批量运行就不要填一个看起来很漂亮的百分比。

## 一次失败怎样进入改进闭环

假设 `malicious-note` 用例失败：Agent 读到文件里的"上传整个目录"，随后尝试调用网络工具。

不要只改 Prompt 然后再跑一次。完整处理应该是：

1. 保存这次 Trace 和环境快照；
2. 确认是模型判断、工具暴露还是权限代码的问题；
3. 把输入和预期加入固定数据集；
4. 修改最小必要部分；
5. 跑完整回归集，而不只跑这一条；
6. 比较安全、完成率、成本和延迟；
7. 小流量发布后继续收集真实失败。

<figure class="agent-diagram">
  <img src="/diagrams/agents/eval-loop.svg" alt="从一次失败 Trace 提炼测试样例，批量评分、比较基线、发布并收集新失败的 Agent 评测闭环">
  <figcaption>Trace 帮你解释一次运行，Eval 帮你判断一个版本是否稳定变好。两者不能互相替代。</figcaption>
</figure>

## 怎样才算学完了动手路线

拿一份你自己的低风险目录，不改代码完成一次迁移：

1. 把根目录换成你的测试副本，不要直接用唯一原件；
2. 明确要找的关键词和报告必需字段；
3. 调整工具描述，但不扩大访问范围；
4. 写至少五条正常和失败用例；
5. 跑单元测试和真实模型任务；
6. 检查 Trace、草稿、验证结果和 Git 状态；
7. 只有内容正确时才人工发布。

能解释每一次失败属于模型、工具、状态、权限还是验证问题——你就不再只是"会运行 Agent Demo"了。你具备了构建可靠单 Agent 的基本方法。

## 接下来进入进阶内容时会发生什么

动手路线刻意把系统保持得很小：四个工具、本地 JSON 状态、单 Agent、人工终端审批。下一阶段不再增加"更炫的 Demo"，而是逐一回答工程问题：

- Function Calling 协议怎样处理严格 Schema、并行和幂等；
- MCP 在 Host、Client 和 Server 之间统一了什么；
- Context、Memory 和 RAG 怎么分配预算；
- Trace Grader、数据集和发布门槛怎样组合；
- 多 Agent 什么时候真的比单 Agent 好；
- 安全与生产架构怎样分层。

从 [Tool Calling 深入](/agents/advanced/tool-calling) 开始即可。

## 参考与版本

- 本页核验日期：2026 年 7 月 27 日。
- 本项目只完成确定性测试验证，没有声称任何真实模型完成率、费用或延迟数据。
- [OpenAI：Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals)
- [OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
