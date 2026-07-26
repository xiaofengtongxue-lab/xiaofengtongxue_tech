---
title: AI Agent 人工审批与结果验证
description: 把写操作拆成草稿、确定性验证和绑定内容哈希的人工确认，避免模型自评完成或复用过期授权。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 让 Agent 敢写又不乱写：人工审批与结果验证

如果 Agent 永远只读，它很安全，却很难完成真正的工作；如果给它任意写入、发送和发布权限，它又很难让人放心。解决办法不是在两端选一个，而是把动作分级：低风险步骤自动执行，高风险副作用先生成可检查的候选，再由程序和人共同把关。

<figure class="agent-diagram">
  <img src="/diagrams/agents/approval-boundary.svg" alt="Agent 工具调用按只读、受限草稿和高风险副作用分级，并在执行前重新校验人工确认的流程图">
  <figcaption>人工确认不是一个布尔值，而是一份绑定真实动作、参数、内容版本和过期时间的授权。</figcaption>
</figure>

## 先把“写文件”拆成两个动作

资料盘点项目没有给模型 `write_any_file(path, content)`。它只能：

```text
save_report_draft(content)
    ↓
.agent/drafts/inventory.md
```

发布正式报告则由应用层完成：

```text
验证草稿
  → 展示真实内容和确认令牌
  → 用户确认
  → 再次核对草稿哈希
  → 写入 reports/inventory.md
```

模型能完成报告，但不能绕过验证器直接交付。

## 验收条件尽量写成普通代码

模型很适合判断“这份总结是否清楚”，但文件总数、路径是否存在、章节是否齐全不需要再问一个模型。

示例验证器会重新扫描工作目录：

```python
files = tools.visible_files()
```

然后检查报告中的计数：

```python
count_match = re.search(r"文件总数[：:]\s*(\d+)", content)
if int(count_match.group(1)) != len(files):
    issues.append("文件总数与真实目录不一致")
```

还会取出反引号里的候选路径，逐个确认是否真实存在。模型即使写得很自信，虚构 `missing.md` 仍然无法通过。

运行验证器测试：

```bash
python -m unittest tests.test_verifier -v
```

这里包含一正一反两条用例：真实路径和正确计数会通过；错误计数和虚构路径会失败。

## 为什么确认文字要带随机令牌

程序会生成类似：

```text
APPROVE a1b2c3
```

用户必须原样输入。这样能避免模型在报告正文里提前写一句“用户已确认”，也避免脚本把普通的 `yes` 当成所有动作的通用授权。

不过随机令牌还不够。确认必须绑定当前草稿内容：

```python
digest = hashlib.sha256(draft_path.read_bytes()).hexdigest()
```

发布前再次计算：

```python
current_digest = hashlib.sha256(draft_path.read_bytes()).hexdigest()
if current_digest != request.draft_sha256:
    raise PermissionError("草稿在确认后发生变化，需要重新检查并确认")
```

如果确认后 Agent、另一个进程或用户修改了草稿，旧授权立刻失效。

## “确认过一次”不能变成永久权限

真实业务中的确认对象至少应包含：

- `action_id`；
- 谁可以确认；
- 工具名和真实参数；
- 影响摘要；
- 内容 Hash 或版本号；
- 创建时间和过期时间；
- 幂等键；
- 当前状态。

例如邮件审批应该显示真实收件人、主题和附件，而不是只显示模型生成的“将发送一封合适的邮件”。参数变化后必须重新确认。

## 哪些动作默认应该停下来

不同业务风险不同，但下面几类通常不应只由模型自行决定：

- 删除或覆盖不可恢复数据；
- 对外发送邮件、消息或文件；
- 正式发布内容、代码或配置；
- 付款、退款、下单和合同承诺；
- 修改账号权限或访问控制；
- 把私有数据传给新的第三方服务。

“让用户确认”也不能代替服务端权限。即使用户输入正确令牌，应用仍要确认他有权执行当前动作。

## 确认之后还要保证幂等

如果发布请求超时，客户端不知道是否成功，再点一次可能产生重复副作用。示例的本地文件替换天然比较简单；支付、发信和工单系统需要业务幂等键：

```text
publish:{tenant_id}:{report_id}:{approved_action_id}
```

同一个批准动作最多成功一次。结果未知时先查询外部系统，而不是直接重试。

## 人工审批不是最后一道结果验证

用户批准的是“允许执行这项动作”，不等于动作已经成功。发布后还要检查：

- 目标文件是否存在且 Hash 匹配；
- 邮件服务是否返回可查询的消息 ID；
- 订单状态是否真的变化；
- 部署后的页面或健康检查是否正常。

授权、执行和验收是三个不同阶段。

## 用测试证明旧授权不能复用

运行：

```bash
python -m unittest tests.test_approval -v
```

测试先输入错误确认，断言正式报告不存在；再输入匹配的 `APPROVE abc123`，确认内容能发布。你还可以自己增加一条用例：生成确认后修改草稿，发布必须失败。

## 下一步：一次成功还不够

到这里，Agent 已经具备工具、循环、状态、验证和审批。但真实模型的行为会随输入、Prompt、模型版本和工具描述变化。昨天成功一次，不能证明明天换一份目录仍然成功。

主线最后一篇讲 [怎样建立 Agent 评测](/agents/build/evaluation)，把失败变成可重复的测试，而不是靠多跑几次凭感觉判断。

## 版本与事实来源

- 本页代码核验日期：2026 年 7 月 26 日。
- 示例审批只作用于本地报告文件，不应直接复制为支付或生产发布系统。
- [OpenAI：Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
- [OWASP：LLM Top 10](https://genai.owasp.org/llm-top-10/)
- [NIST：AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
