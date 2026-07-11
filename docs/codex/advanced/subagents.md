---
title: Codex Subagents 并行协作实战
description: 判断任务能否安全并行，按独立证据或文件边界拆给 Subagents，控制线程、深度、权限和成本，并由主任务统一验证结果。
---

# Codex Subagents 并行协作实战

Subagents 的价值是并行处理相互独立的工作，不是把同一个模糊任务复制给更多模型。拆分错误时，它们会重复搜索、争抢同一文件、给出互相冲突的结论，并消耗更多时间和额度。

## 先判断能否并行

适合拆分：

- 同一 PR 的安全、测试、性能、兼容性独立审查；
- 多个互不依赖模块的只读调查；
- 大批记录按行或文件独立处理；
- 前端、后端、文档在契约已确定后分别实现；
- 多个候选方案独立实验。

不适合：

- 需求和接口还没确定；
- 多个任务必须编辑同一核心文件；
- 下一步依赖上一任务实时结果；
- 生产操作或不可逆决策；
- 只是希望“更聪明”，却没有拆分边界。

## 最稳妥的第一次并行任务：只读审查

```text
并行审查当前分支相对 main 的变化。

请启动三个 Subagents：
1. 安全审查：只找授权绕过、秘密泄漏和不安全外部输入；
2. 正确性审查：只找真实逻辑错误、竞态和兼容性回归；
3. 测试审查：只找关键行为没有覆盖或测试无效的地方。

全部使用只读权限。等待三者完成后，由主任务去重并按 P0-P3 汇总。每条发现要有文件、触发条件和影响。不要修改文件。
```

这类任务共享输入但输出独立，没有文件冲突，最适合验证并行价值。

## 实现任务必须先冻结契约

例如前后端并行前，先由主任务确定：

- API 路径和方法；
- 请求/响应 schema；
- 错误码；
- 权限；
- 数据上限；
- 测试 fixture；
- 文件所有权。

然后分配：

```text
后端 agent 只修改 server/orders/**；前端 agent 只修改 web/orders/**。共享契约文件只读。两边不得提交或推送。完成后返回修改文件、验证命令和未决问题，由主任务统一集成。
```

## 内置角色与自定义角色

当前 Codex 提供常见内置角色，例如通用 `default`、执行型 `worker` 和只读探索型 `explorer`。复杂团队可在用户级 `~/.codex/agents/` 或项目级 `.codex/agents/` 定义自定义 agent TOML。

项目级 `.codex/agents/reviewer.toml` 示例：

```toml
name = "reviewer"
description = "Read-only reviewer for correctness, security, and missing tests."
sandbox_mode = "read-only"
developer_instructions = """
Review code like an owner.
Lead with concrete, reproducible findings.
Ignore style-only preferences unless they hide a real bug.
Never modify files.
"""
nickname_candidates = ["Atlas", "Delta", "Echo"]
```

省略模型时继承父任务，能减少版本漂移。角色要窄，不要创建十个职责重叠的“专家”。

## 控制并行规模

`.codex/config.toml`：

```toml
[agents]
max_threads = 4
max_depth = 1
```

`max_threads` 控制并发线程数量，`max_depth` 控制是否允许子 agent 继续递归派生。一般保持深度 1；递归扇出会快速增加成本和不可预测性。

## 给每个 agent 足够但最小的上下文

子任务应说明：

- 目标和完成格式；
- 可读/可写范围；
- 已冻结的接口；
- 验证命令；
- 不得执行的外部动作；
- 返回给主任务的摘要结构。

不要让每个 agent 都重新扫描整仓库。可以先由 explorer 生成关键路径，再把结果和目标文件分配给其他 agent。

## 主任务的职责不能外包

主任务必须：

1. 检查子任务是否重叠；
2. 等待必要结果；
3. 对冲突结论重新取证；
4. 去重和排序；
5. 审查完整 Git diff；
6. 运行集成和端到端验证；
7. 报告未完成或失败的子任务。

多个 agent 都说“通过”不等于整体构建通过。

## 失败处理

### agent 卡住

先检查是否缺依赖、权限或输入；可缩小任务并重试。不要无限增加运行时间。

### 两个 agent 修改同一文件

停止合并，确定主版本和真实差异。重新分配文件所有权，不让代理自动覆盖另一份工作。

### 结论冲突

让主任务要求双方提供调用链、测试或官方来源，再由证据裁决。

### 成本高但收益低

缩小 agent 数量，只并行最昂贵且独立的调查。小任务单 agent 更快。

## 完成门槛

- [ ] 并行子任务彼此独立。
- [ ] 每个 agent 有明确权限、文件和输出边界。
- [ ] 接口与合并顺序在开始前确定。
- [ ] 主任务去重、解决冲突并运行整体验证。
- [ ] 使用并行确实缩短关键路径，而不是重复劳动。

## 下一步

需要把 Codex 嵌入自己的服务或工具时，继续学习 [Codex SDK 与 App Server](/codex/advanced/sdk-app-server)。

## 事实来源

- [OpenAI：Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
