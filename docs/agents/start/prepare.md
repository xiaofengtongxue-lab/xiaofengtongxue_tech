---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: 写 Agent 前要装好的四样东西
description: 面向第一次动手写 Agent 的读者，准备终端、JDK 或 Python、Git 和 API Key；Java 为默认主线，Python 可切换。
datePublished: 2026-07-26
breadcrumbs:
  - name: AI Agent 教程
    path: /agents/
---

# 装好这四样东西，再开始写第一个 Agent

看懂了 Agent 循环，轮到动手时却被终端、JDK、虚拟环境或 API Key 卡住了？这篇只准备后面马上会用到的东西，每一步都有能对照的结果。

<AgentLanguageSwitch />

> Java 是默认主线，使用 JDK 21 和 Maven；Python 版要求 Python 3.11 及以上。选一条跑通即可，不需要同时安装两套环境。

## 先认识终端：它只是另一种操作电脑的方式

平时你双击文件夹，用图形界面告诉电脑"打开这里"。终端做的事一模一样，只是把动作写成了文字。

打开系统自带终端：

- macOS：打开"终端"应用。
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

屏幕上是一个真实路径。路径的意思很简单：你现在站在哪个文件夹里。后面的命令都在这个位置执行，别跳过这一步。

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

路径末尾出现 `agent-learning`，这一步就搞定。专门建练习目录只有一个目的：让 Agent 实验跟你的桌面、照片、工作文件隔开。

## 检查你选择的运行环境

先运行对应命令：

::: code-group
```bash [Java]
java -version
mvn -version
```

```bash [Python]
python3 --version
```
:::

Windows 上的 Python 命令通常是：

```powershell
python --version
```

Java 路线应看到 JDK 21 或更高版本，并且 `mvn -version` 能显示 Maven 信息，例如：

```text
openjdk version "21.0.5"
Apache Maven 3.6.3
```

Python 路线应看到 3.11 或更高版本，例如：

```text
Python 3.14.2
```

版本号不必跟示例完全一样。Java 缺少 JDK 时，从 [Eclipse Temurin](https://adoptium.net/temurin/releases/) 或你信任的 JDK 发行版安装 JDK 21；Maven 缺失时查看 [Apache Maven 安装文档](https://maven.apache.org/install.html)。Python 缺失时，从 [Python 官方下载页](https://www.python.org/downloads/) 安装当前受支持版本。

## 两条路线为什么准备方式不同

Java 项目的依赖版本写在 `pom.xml`，Maven 会在第一次构建时下载到本机缓存，不需要创建 Python 式虚拟环境。先确认 Maven 可用即可：

::: code-group
```bash [Java]
mvn -version
```

```bash [Python]
python3 -m venv .venv
source .venv/bin/activate
python --version
```
:::

Windows PowerShell：

::: code-group
```powershell [Java]
mvn -version
```

```powershell [Python]
.venv\Scripts\Activate.ps1
python --version
```
:::

Python 激活成功后，终端提示符前通常会出现 `(.venv)`。Java 路线没有这个标记，后面在项目目录直接运行 `mvn test`。

## Git 在这里不是为了把代码发到网上

Git 首先是本地记录工具。Agent 读写文件的时候，它能回答两个问题：开始前目录是什么状态，结束后到底改了什么。

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

代码通过模型 API 发请求，需要一把门卡——这就是 API Key。它可能产生费用，也能访问你账号下的资源。所以不能写进截图、Git 仓库、群聊，更不能发给 Agent。

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
test -n "$OPENAI_API_KEY" && echo "已设置" || echo "未设置"
```

PowerShell：

```powershell
if ($env:OPENAI_API_KEY) { "已设置" } else { "未设置" }
```

期望输出：

```text
已设置
```

关闭终端后，这种临时设置通常会失效。这反而适合第一次练习：不需要把密钥永久写进配置文件。

## 模型名称也要当成配置

模型名称和账号权限会变化，不要把教程里的字符串埋进业务代码。先在终端设置：

```bash
export OPENAI_MODEL="deepseek-v4-pro"
```

PowerShell：

```powershell
$env:OPENAI_MODEL="deepseek-v4-pro"
```

`deepseek-v4-pro` 是本教程在 2026 年 7 月 27 日采用的默认模型 ID。先确认你使用的 API 服务提供这个模型，并兼容项目调用的接口；如果不支持，就把它换成自己 API 项目当前可用的模型，再用后面的评测确认质量、延迟和成本。

## 开始主线前做一次体检

依次运行对应命令：

::: code-group
```bash [Java]
java -version
mvn -version
git --version
test -n "$OPENAI_API_KEY" && echo "API Key OK" || echo "API Key missing"
```

```bash [Python]
python --version
git --version
python -c "import os; print('API Key OK' if os.getenv('OPENAI_API_KEY') else 'API Key missing')"
```
:::

满足下面四条，就可以进入主线：

- 当前终端位于专门的练习目录；
- Java 路线使用 JDK 21 且 Maven 可用，或 Python 路线版本不低于 3.11；
- Git 命令可用；
- 终端显示 `API Key OK`，但没有打印真实密钥。

接下来去 [先跑通第一个资料盘点 Agent](/agents/build/from-chat-to-agent)。即使暂时没有 API Key，也可以先运行全部确定性测试，看看哪些安全边界不依赖模型。

## 常见卡点

### `mvn` 或 `java` 找不到

先重新打开终端，再运行 `java -version` 和 `mvn -version`。如果 Java 能用但 Maven 不能用，通常是 Maven 没安装或没有加入 `PATH`；如果显示的不是 JDK 21，先检查 `JAVA_HOME` 指向了哪个 JDK。

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

## 参考与版本

- 本页命令核验日期：2026 年 7 月 27 日。
- 本地核验环境为 macOS、JDK 21.0.5、Maven 3.6.3、Python 3.14.2 和 Git；Windows 提供 PowerShell 等价命令，但不同公司设备可能有额外执行策略。
- [Java 21 文档](https://docs.oracle.com/en/java/javase/21/)
- [Apache Maven 安装](https://maven.apache.org/install.html)
- [Python：创建虚拟环境](https://docs.python.org/3/library/venv.html)
- [Git 官方下载](https://git-scm.com/downloads)
- [OpenAI API Key 安全最佳实践](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
