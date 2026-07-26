---
title: 跑通第一个 AI Agent
description: 下载并运行本地资料盘点 Agent，先看到工具调用、草稿、确定性验收和人工审批的完整结果，再逐章拆解实现。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 从会聊天到会干活：先跑通第一个资料盘点 Agent

这篇是 B 级主线的起点。你已经会使用 AI 对话，也能运行基本 Python 命令，但还没有亲手做过 Agent。我们先不从架构图背起，而是把完整项目跑起来：**让 Agent 盘点一个隔离的示例目录，生成报告草稿，通过程序验收，然后停在人工确认之前。**

> 如果终端、虚拟环境或 API Key 还不熟，先看 [环境准备](/agents/start/prepare)。

## 先下载项目，别急着读完所有代码

[下载配套项目 ZIP](/downloads/file-audit-agent.zip)，解压后进入目录：

```bash
cd /path/to/file-audit-agent
```

创建并激活虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e .
```

安装完成后，先别调用模型，直接跑测试：

```bash
python -m unittest discover -s tests -v
```

你应该看到八个测试全部是 `ok`，结尾类似：

```text
Ran 8 tests in ...s

OK
```

这一次可验证成功很重要。它证明路径边界、报告验证、人工确认和无进展停止机制在没有模型参与时已经能工作。如果测试没过，先修环境，不要把问题混进 API 调用里。

## 看一眼 Agent 要盘点什么

示例目录只有三份资料：

```text
sample-workspace/
├── meeting-notes.txt
├── notes/
│   └── ideas.md
└── project-alpha/
    └── README.md
```

其中两份文件分别包含 `TODO` 和 `FIXME`。我们的目标不是让模型凭印象总结，而是让它通过工具找到真实路径，再生成一份能被程序检查的报告。

先记录目录状态：

```bash
git status --short
```

如果你刚解压项目、还没初始化 Git，可以运行：

```bash
git init
git add .
git commit -m "chore: record tutorial baseline"
```

提交只发生在本地。这样任务完成后，`git status --short` 能准确告诉你哪些文件是 Agent 新增的。

## 让 Agent 只生成草稿

在自己的终端设置 API Key 和可用模型：

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export OPENAI_MODEL="gpt-5.6-terra"
```

然后运行：

```bash
file-audit-agent --root sample-workspace --draft-only
```

真实模型的措辞和工具轮数可能不同，但成功结果至少应该包含：

```text
草稿已通过验收：.../sample-workspace/.agent/drafts/inventory.md
真实文件数：3
运行编号：...
已按 --draft-only 停在草稿阶段。
```

打开草稿：

```bash
sed -n '1,220p' sample-workspace/.agent/drafts/inventory.md
```

Windows PowerShell：

```powershell
Get-Content sample-workspace\.agent\drafts\inventory.md
```

一份合格草稿会写出“文件总数：3”，包含文件概况、需要关注、建议下一步，并用反引号标出真实相对路径。具体句子不需要跟教程一模一样。

## 你刚才看到的不是一次长回答

<figure class="agent-diagram">
  <img src="/diagrams/agents/file-audit-architecture.svg" alt="资料盘点 Agent 的模型、工具、工作目录、草稿、验证器和人工确认关系图">
  <figcaption>模型只负责提出下一步。文件访问、路径限制、草稿写入、验证和发布都由应用代码掌控。</figcaption>
</figure>

实际过程大致是：

1. 模型先调用 `list_files`，看到目录中确实有三份文件。
2. 它调用 `search_text` 查找 `TODO` 或 `FIXME`，拿到路径和行号。
3. 必要时调用 `read_text_file` 理解少量上下文。
4. 它调用 `save_report_draft`，只能写入 `.agent/drafts/`。
5. 模型输出结束后，`verify_report` 重新统计目录并检查证据路径。
6. 验收通过后，程序状态只是 `ready_for_approval`，并没有正式发布。

这六步里，只有“下一步选哪个工具、报告怎样组织”交给了模型。安全边界和完成条件仍由普通 Python 代码负责。

## 再跑一次完整的人工确认

确认草稿内容没有问题后，去掉 `--draft-only`：

```bash
file-audit-agent --root sample-workspace
```

程序会显示一段随机确认文字，例如：

```text
APPROVE a1b2c3
```

只有原样输入当前这一次显示的文字，报告才会发布到：

```text
sample-workspace/reports/inventory.md
```

如果输入 `yes`、直接回车，或者确认后草稿内容发生变化，发布都会被拒绝。确认绑定的是**这份草稿的哈希**，不是对未来任意写操作的一次永久授权。

## 最后看 Agent 到底改了什么

运行：

```bash
git status --short
```

你应该只看到 Agent 自己的运行目录和报告目录，例如：

```text
?? sample-workspace/.agent/
?? sample-workspace/reports/
```

三个原始资料文件不应该出现修改标记。再运行测试：

```bash
python -m unittest discover -s tests -v
```

到这里，你已经拿到了三种不同证据：

- **工具证据**：报告引用了真实路径和搜索结果；
- **程序证据**：确定性验证器和 8 个测试通过；
- **人工证据**：你检查了草稿，并对具体内容做了一次确认。

## 没有 API Key，也能先学到一半吗

可以。测试不需要 API Key，你仍然能检查工具边界、验证器、审批哈希和重复循环停止。不能完成的是“真实模型根据反馈自主选择工具”这一段，请明确把它记为尚未验证，不要因为测试通过就声称 API 流程也已跑通。

## 最常见的三个失败

### `file-audit-agent: command not found`

先确认虚拟环境已激活，再运行：

```bash
python -m pip install -e .
```

也可以绕过命令入口：

```bash
python -m file_audit_agent.cli --root sample-workspace --draft-only
```

### 提示 `缺少 OPENAI_API_KEY`

环境变量只对当前终端生效。重新设置后，在同一个终端运行 Agent。不要把 Key 写进源码解决这个问题。

### 超过最大轮次或停止无效循环

这不是程序崩了，而是护栏主动停止。打开 `.agent/checkpoints/` 中对应运行编号的 JSON，查看最后几次工具调用。常见原因是工具描述不清、工具返回的信息不足，或者模型一直重复同一个搜索。

下一篇我们就拆开最关键的一段：[模型怎样提出工具调用，应用又怎样把真实结果送回去](/agents/build/tool-calling)。

## 版本与验证记录

- 本页核验日期：2026 年 7 月 26 日。
- 完整项目在全新虚拟环境中完成 `pip install -e .`，8 个测试通过，OpenAI SDK 适配器导入成功。
- 本地没有使用用户的真实 API Key 代跑付费请求，因此不同账号、模型和限流策略下的实际输出仍需读者自己验证。
- [OpenAI：Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI：Agents SDK 与 Responses API](https://developers.openai.com/api/docs/guides/agents)
