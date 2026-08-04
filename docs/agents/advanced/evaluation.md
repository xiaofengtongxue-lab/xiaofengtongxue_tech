---
title: Agent 评测进阶：Trace、数据集和发布闭环
description: 从单次 Trace 调试走向可重复数据集、结果与过程 Grader、随机性控制、版本对比、发布门槛和线上质量闭环。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# Agent 出错了，怎么修、怎么测、怎么保证下次不错？

Agent 失败时，团队常做两件事：翻一条日志改 Prompt，或者连跑几次看“感觉有没有变好”。前者容易只修当前样例。后者分不清随机波动和真实提升。

更稳的顺序是：**先用 Trace 解释一次失败，再把失败固化成数据集，用多个 Grader 在同一环境比较版本。**

<figure class="agent-diagram">
  <img src="/diagrams/agents/eval-loop.svg" alt="从失败 Trace 生成固定测试样例，批量运行结果、过程和安全评分，比较基线后发布的 Agent 评测循环">
  <figcaption>Trace 是诊断工具，Eval 是决策工具；线上监控再把新失败送回数据集。</figcaption>
</figure>

## Trace 要能重建一次运行

一条可用的 Trace 不只是模型输入和最终回答。至少需要：

```text
run_id / trace_id
用户与租户作用域
app、prompt、model、tool schema、policy 版本
每轮输入摘要与输出 Item
工具名、参数摘要、call_id、结果状态、耗时
Workflow State 转移
审批、拒绝和人工接管
最终验证结果
Token、费用和总延迟
```

高敏感内容脱敏或存入受控系统，Trace 里只保留可关联 ID。日志完整，不等于就能无限保存原始数据。

## 先定位失败发生在哪一层

同样是“报告错误”，根因可能完全不同：

| 层 | 典型失败 | 修复方向 |
| --- | --- | --- |
| 任务定义 | 目标和验收相互矛盾 | 澄清需求、修改完成标准 |
| 检索与 Context | 关键资料没取到或旧信息占满窗口 | 改检索、权限过滤、压缩策略 |
| 模型决策 | 选错工具、过早结束 | 改指令、示例或模型路由 |
| Tool / Harness | 参数校验、超时或返回契约有 Bug | 修普通代码和测试 |
| 权限与 Workflow | 未审批执行或状态守卫缺失 | 修策略和确定性控制 |
| Validator | 错把坏结果判成通过 | 加强验收与反例 |

不分层的话，团队很容易用 Prompt 去修一个本该由权限代码解决的问题。

## 一个 Eval Case 要保存环境，而不只是问题文本

```json
{
  "case_id": "wrong-file-count",
  "input": {"goal": "盘点目录并生成报告"},
  "fixture_version": "workspace-v3",
  "initial_state": {"phase": "collecting"},
  "allowed_tools": ["list_files", "search_text", "save_report_draft"],
  "expected": {
    "validator_passed": true,
    "file_count": 12,
    "must_cite_existing_paths": true
  },
  "forbidden": {
    "publish_without_approval": true,
    "read_outside_workspace": true
  }
}
```

文件夹、数据库快照、工具返回、策略版本——这些没固定的话，同一句输入每次面对的是不同任务，结果就没法比较。

## Grader 至少分结果、过程和安全

### 结果 Grader

判断任务是否真的完成：

- 文件、记录或页面是否存在；
- 业务状态是否满足；
- 引用的路径和数据是否有效；
- 结构化输出是否符合 Schema；
- 人工验收分数。

优先用确定性检查。语义质量确实没法机械判断时，再上人工或 LLM Grader。

### 过程 Grader

判断路线是否合理：

- 是否先读取真实状态；
- 是否调用了禁用工具；
- 参数和调用顺序是否正确；
- 是否出现无效循环；
- 是否在信息不足时过早结束；
- 是否使用了过期 Memory。

过程评分不要求所有成功轨迹完全一致。它只检查关键不变量和明显浪费。

### 安全 Grader

必须独立于“任务完成”统计：

- 越权执行率；
- Prompt Injection 成功率；
- 敏感数据外传率；
- 未审批副作用率；
- 跨租户数据泄露率；
- 记忆投毒写入与召回率。

安全用例即使完成率很低，也不能被平均分掩盖。

## LLM Grader 也要被评测

模型评分器容易被输出长度、语气和位置影响。用之前先准备人工标注样例，检查：

- 与人工一致率；
- 同一答案重复评分的稳定性；
- 对提示注入和评分操纵的抵抗；
- 不同语言、长度和格式的偏差；
- Grader 模型升级后的漂移。

关键安全和财务结果，别让 LLM Grader 当唯一裁判。

## Agent 有随机性，单跑一次不够

相同输入可能走出不同工具路径。评测时按风险决定重复次数：

- 确定性 Harness 测试：每次提交都跑；
- 低风险行为样例：至少多次抽样观察波动；
- 高风险安全样例：提高重复次数，任何一次越权都单独记录；
- 费用高的长任务：先小样本筛选，再对候选版本扩大运行。

报告分布，别只报最好那次：成功率、P50/P95 延迟、平均与尾部工具次数、费用分位数、失败簇占比。

## 数据集要同时有黄金样例和真实失败

推荐组合：

1. **核心能力集**：产品必须长期保持的任务；
2. **回归集**：每个线上 Bug 对应至少一条；
3. **安全红队集**：直接与间接注入、越权和数据外传；
4. **边界集**：空输入、超长内容、超时、乱码、依赖不可用；
5. **探索集**：新场景，不直接作为发布硬门槛。

别让数据集泄漏到 Prompt 或开发调试里。团队知道全部标准答案后，会不自觉地过拟合。

## 版本比较要保留成本和风险角色

模型路由通常包含旗舰、平衡档和低成本模型。评测升级时，别把所有路径都换成最强模型然后宣布质量上升。

比较表至少包含：

| 版本 | 完成率 | 安全失败 | P95 延迟 | 单任务费用 | 人工接管 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 基线 | 实测 | 实测 | 实测 | 实测 | 实测 |
| 候选 | 实测 | 实测 | 实测 | 实测 | 实测 |

不同任务角色可以选不同模型，但路由规则本身也要进评测版本。

## 发布门槛不要只写“总分更高”

一个可执行门槛可能是：

```text
核心任务完成率不得下降
安全关键用例零越权执行
P95 延迟不超过预算
平均费用增长超过阈值时需要人工批准
新失败簇必须有已知降级或回滚路径
```

先离线跑数据集，再小流量、影子或只读模式上线，持续按 `app_version + model + prompt_version + tool_schema_version` 分组观察。

## 线上指标不能替代离线 Eval

用户满意度和任务完成率受流量结构影响。离线数据集又覆盖不了全部现实。两者互相补充：

```text
线上 Trace 和反馈
  → 聚类失败
  → 人工确认根因
  → 加入回归或安全数据集
  → 修改候选版本
  → 离线比较
  → 小流量发布
```

只做离线评测会老化。只看线上总指标又难定位回归。

## 评测系统自身也属于安全边界

- 测试夹具不能包含未脱敏生产数据；
- Grader 不应拥有业务写权限；
- Trace 访问按租户和角色控制；
- 数据集、Prompt 和评分规则要版本化；
- 评测结果不能被候选 Agent 自行修改；
- 安全失败要保留记录并触发事件响应。

## 下一步：先用评测证明是否需要拆 Agent

很多团队一失败就拆多 Agent，结果协调成本上升，完成率没变。下一篇 [什么时候才需要多 Agent](/agents/advanced/multi-agent) 把“拆分收益”放回同一套基线评测中判断。

## 参考与版本

- 本页核验日期：2026 年 7 月 26 日。
- 页面中的指标数字均为结构示例，不代表本站对任何模型完成率、成本或延迟的实测结论。
- [OpenAI：Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals)
- [OpenAI Cookbook：Agent improvement loop](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop)
- [OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
