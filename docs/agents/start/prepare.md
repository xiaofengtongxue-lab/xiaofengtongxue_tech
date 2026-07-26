---
title: 写 AI Agent 前的环境准备
description: 面向没用过终端、Git 或 Python 的读者，用可验证的小步骤准备 AI Agent 教程环境，并正确处理 API Key。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 第一次写 Agent 前，补齐终端、Git、Python 和 API Key 基础

如果你看懂了 Agent 的工作循环，却被“打开终端”“创建虚拟环境”“设置 API Key”卡住，这篇就是那块垫脚石。我们只学后面马上会用到的四件事，每做一步都有一个能自己确认的结果。

> 本教程示例以 Python 3.11 及以上版本为目标。命令在 macOS、Linux 和 Windows PowerShell 上都能完成；只有虚拟环境的激活命令不同。

## 先认识终端：它只是另一种操作电脑的方式

平时你双击文件夹，是通过图形界面告诉电脑“打开这里”。终端做的是同一件事，只是把动作写成文字。

打开系统自带终端：

- macOS：打开“终端”应用。
- Windows：打开 PowerShell。
- Linux：打开你发行版自带的 Terminal。

先输入：

```bash
pwd
```

macOS 和 Linux 会显示当前目录。PowerShell 对应的命令是：

```powershell
Get-Location
```

你应该看到一个真实路径。路径就是“你现在站在哪个文件夹里”。后面所有命令都在这个位置执行，所以不要跳过确认。

## 建一个不会碰到真实资料的练习目录

在终端运行：

```bash
mkdir agent-learning
cd agent-learning
```

再确认一次位置：

```bash
pwd
```

PowerShell 仍然可以用 `mkdir` 和 `cd`，最后用 `Get-Location` 查看。

如果路径末尾出现 `agent-learning`，这一步就成功了。我们专门建练习目录，是为了让第一次 Agent 实验跟你的桌面、照片和工作文件隔开。

## 检查 Python，而不是直接开始装库

运行：

```bash
python3 --version
```

Windows 常见命令是：

```powershell
python --version
```

期望看到类似：

```text
Python 3.14.2
```

版本号不必跟示例完全一样，但需要是 Python 3.11 或更高版本。如果系统提示找不到命令，请到 [Python 官方下载页](https://www.python.org/downloads/) 安装当前受支持版本，再重新打开终端验证。Windows 安装界面记得勾选把 Python 加入 PATH。

## 为什么还要创建虚拟环境

你可能在想：Python 已经能用了，为什么不直接装 `openai`？

因为不同项目需要的库版本可能不同。虚拟环境相当于给这个练习项目准备一个独立工具箱，不会把系统里的其他 Python 项目搅在一起。

在 `agent-learning` 目录运行：

```bash
python3 -m venv .venv
```

macOS 或 Linux 激活：

```bash
source .venv/bin/activate
```

Windows PowerShell 激活：

```powershell
.venv\Scripts\Activate.ps1
```

激活后，终端提示符前通常会出现 `(.venv)`。再运行：

```bash
python --version
```

这次统一使用 `python` 即可。能看到版本号，说明你的独立环境已经工作。

## Git 在这里不是为了把代码发到网上

Git 首先是本地修改记录工具。Agent 会读写文件时，它能帮你回答两个关键问题：开始前目录是什么状态，结束后到底改了什么。

先检查：

```bash
git --version
```

如果没有安装，到 [Git 官方下载页](https://git-scm.com/downloads) 安装。然后在练习目录运行：

```bash
git init
git status --short --branch
```

输出通常类似：

```text
## No commits yet on main
```

这里没有连接 GitHub，也没有把任何文件上传。它只是给当前目录建立了一个本地记录区。

## API Key 是门卡，不是聊天内容

代码通过模型 API 发请求时，需要一把属于你自己项目的门卡，这就是 API Key。它可能产生费用，也可能访问你账号下允许的资源，因此不能写进教程截图、Git 仓库、群聊或发给 Agent。

从你使用的模型平台创建 Key 后，只在当前终端设置。macOS 或 Linux：

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

Windows PowerShell：

```powershell
$env:OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

上面的占位符必须替换成你自己的值，但不要把真实值粘贴到聊天窗口。验证变量是否存在时，也不要打印完整内容：

```bash
python -c "import os; print('已设置' if os.getenv('OPENAI_API_KEY') else '未设置')"
```

期望输出：

```text
已设置
```

关闭终端后，这种临时设置通常会失效。这反而适合第一次练习：不需要把密钥永久写进配置文件。

## 模型名称也要当成配置

模型名称和账号权限会变化，不要把教程里的字符串埋进业务代码。先在终端设置：

```bash
export OPENAI_MODEL="gpt-5.6-terra"
```

PowerShell：

```powershell
$env:OPENAI_MODEL="gpt-5.6-terra"
```

这是本教程在 2026 年 7 月 26 日采用的平衡档示例。你需要换成自己 API 项目当前可用的模型，并用后面的评测确认质量、延迟和成本，而不是默认“越新越适合所有任务”。

## 开始主线前做一次体检

依次运行：

```bash
python --version
git --version
python -c "import os; print('API Key OK' if os.getenv('OPENAI_API_KEY') else 'API Key missing')"
```

满足下面四条，就可以进入主线：

- 当前终端位于专门的练习目录；
- Python 版本不低于 3.11；
- Git 命令可用；
- 终端显示 `API Key OK`，但没有打印真实密钥。

接下来去 [先跑通第一个资料盘点 Agent](/agents/build/from-chat-to-agent)。即使暂时没有 API Key，也可以先运行全部确定性测试，看看哪些安全边界不依赖模型。

## 常见卡点

### PowerShell 不允许激活脚本

如果 `.venv\Scripts\Activate.ps1` 被执行策略拦住，不要关闭系统安全设置。可以直接用虚拟环境里的 Python：

```powershell
.venv\Scripts\python.exe --version
```

后续把命令里的 `python` 替换为 `.venv\Scripts\python.exe` 即可。

### `python3` 和 `python` 到底用哪个

创建虚拟环境前，用系统上实际可用的命令。激活虚拟环境后通常统一使用 `python`。判断标准不是教程写了哪个，而是 `--version` 能否给出正确版本。

### Git 显示很多陌生文件

先运行 `pwd` 或 `Get-Location`。你很可能在错误目录执行了 `git init`。不要急着删除任何东西，先确认当前位置，再新建一个干净练习目录继续。

## 核验边界与来源

- 本页命令核验日期：2026 年 7 月 26 日。
- 本地核验环境为 macOS、Python 3.14.2 和 Git；Windows 提供 PowerShell 等价命令，但不同公司设备可能有额外执行策略。
- [Python：创建虚拟环境](https://docs.python.org/3/library/venv.html)
- [Git 官方下载](https://git-scm.com/downloads)
- [OpenAI API Key 安全最佳实践](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
