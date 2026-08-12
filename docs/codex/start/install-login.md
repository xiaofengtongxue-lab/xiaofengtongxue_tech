---
title: Codex 安装、登录与环境检查
description: 在 macOS、Linux 和 Windows 安装 Codex CLI，打开桌面应用或 IDE，选择 ChatGPT/API Key 登录，完成健康检查。
breadcrumbs:
  - { name: "Codex 实战教程", path: "/codex/" }
  - { name: "开发者入门", path: "/codex/start/" }

---

# Codex 安装、登录与环境检查

装 Codex 本身不难，几行命令的事。真正的坑在别的地方：装完不知道跑的是哪个版本、登录方式选错导致某些功能用不了、PATH 里有多个 codex 互相打架。

所以这篇文章的目标不是"安装命令没报错就行"，而是装完之后你能确认三件事：**当前跑的是哪个二进制文件、用什么方式登录的、环境是否健康。**

## 不写代码的话，先别折腾 CLI

如果你主要是做 PPT、写文档、整表格、搞电商、做内容，**不需要装 CLI**。装个 ChatGPT 桌面应用，用 Chat 或 ChatGPT Work 就够了。别觉得装了命令行就显得专业——用不上就是给自己添麻烦。

普通用户直接去 [不用写代码完成第一份工作文件](/codex/everyday/first-result)。下面安装、版本、命令和仓库检查都是给开发者看的。

## 先想好用哪种方式登录

Codex 支持两种 OpenAI 登录：

- **ChatGPT 登录**：个人用最省事，能用 ChatGPT 工作区能力
- **API Key 登录**：按用量计费，适合脚本、CI 或者有 API 组织策略的环境

一个很容易踩的坑：**API Key 登录拿不到云任务、GitHub 代码审查、工作区连接器这些能力**。如果你后面发现某个功能用不了，先检查是不是登录方式不对。

另外，永远不要把真实 API Key 写进 `AGENTS.md`、仓库配置、脚本参数或者聊天消息里。自动化场景用环境变量或密钥管理器注入。

## 安装 CLI

### macOS 或 Linux

官方脚本一把梭：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

或者用包管理器：

```bash
npm install -g @openai/codex
```

```bash
brew install --cask codex
```

**别同时用好几种方式装。** 多版本并存的时候，你以为升级了，终端里跑的其实是另一个路径的旧版本。这种问题极其难排查。

### Windows

PowerShell：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

也可以用 npm。注意：如果你在 WSL2 里开发，想清楚 Codex 到底装在 Windows 侧还是 WSL 侧——两边的路径、Git、Node、依赖完全不互通。

## 搞清楚到底跑了哪个版本

这是最容易跳过的步骤，也是出问题时最该先查的。

macOS、Linux、WSL：

```bash
type -a codex
codex --version
```

Windows PowerShell：

```powershell
Get-Command codex -All
codex --version
```

如果 `type -a` 输出了多个路径，**第一行就是当前 shell 默认执行的**。后面出现"App 里有这个功能终端却没有"，先比路径和版本，别急着卸载重装。

## 登录

交互式登录直接：

```bash
codex
```

弹出来的界面里选 ChatGPT 登录还是 API Key。也可以先看看当前状态：

```bash
codex login status
```

这行命令可能会显示部分遮挡的凭证标识，**不要把完整输出贴到公开 issue、教程评论或聊天窗口里。**

API Key 自动化登录这样写：

```bash
printenv OPENAI_API_KEY | codex login --with-api-key
```

注意是通过管道传的，不要把 Key 直接写在命令行参数里——那会进 shell 历史和进程列表。

## 打开桌面应用和 IDE

如果已经装了 CLI，从项目目录打开桌面应用：

```bash
cd /path/to/project
codex app .
```

没装桌面应用的话这个命令会引导你装。IDE 用户去 [Codex IDE 官方页面](https://learn.chatgpt.com/docs/codex/ide) 装扩展，官方目前明确支持 VS Code、Cursor、Windsurf 这些兼容编辑器。

CLI 和 IDE 扩展共享同一套本地 Codex 登录和配置。不过桌面应用、CLI、IDE 各自的能力可能因为版本、套餐和工作区策略不同而有差异。

## 跑一次健康检查

```bash
codex doctor --summary
```

要完整信息的话：

```bash
codex doctor --json
```

重点看这几项：

- CLI 本身能不能跑
- 配置文件能不能解析
- 登录有没有过期
- 当前平台的沙箱依赖是否正常
- Git、shell、工作目录是否可用

健康检查通过不代表你项目能构建，它只说明 Codex 的运行环境基本 OK。

## 在项目里做一次最小启动测试

进到一个 Git 仓库：

```bash
cd /path/to/project
git status --short --branch
codex --sandbox read-only
```

发送：

```text
只读取当前仓库，告诉我项目类型、入口文件和建议的验证命令。
不要修改文件，不要安装依赖，不要访问外部网络。
```

退出后跑 `git status --short`，确认工作区没有偷偷多出东西。

## 更新和 shell 补全

CLI 自带更新命令：

```bash
codex update
```

用包管理器管理的也可以继续用包管理器升级，但升级后务必再跑一次 `type -a codex` 确认生效的路径。

zsh 补全：

```bash
codex completion zsh
```

先看一眼输出内容，按自己 shell 的配置方式加载，别闭着眼睛往多个启动文件里追加。

## 常见故障

### `codex: command not found`

重新开一个终端窗口，检查安装脚本提示的目录在不在 `PATH` 里。不要在网上下载来路不明的二进制文件。

### 登录成功了还提示未授权

依次检查 `codex login status`、系统时间、代理设置、工作区策略、以及你要用的功能支不支持当前登录方式。记住：API Key 能用不等于 ChatGPT 云能力也能用。

### App 和 CLI 行为不一致

比较两者的版本、执行路径、登录方式和读的配置文件。macOS 上尤其注意：独立安装的 CLI 和应用包里的 CLI 可能同时存在，跑的未必是同一个。

### Windows 项目路径混乱

先搞清楚仓库到底在 `C:\...` 还是 WSL 的 Linux 文件系统里，Git、依赖和 Codex 要在同一侧用。跨文件系统跑大项目又慢又容易出权限和换行问题。

## 完成检查表

- [ ] `codex --version` 能输出版本
- [ ] 知道 `codex` 的实际执行路径
- [ ] 知道当前是 ChatGPT 还是 API Key 登录
- [ ] `codex doctor --summary` 没有看不懂的关键报错
- [ ] 能在一个 Git 仓库里以只读模式启动并正常退出
- [ ] 退出后工作区没变化

## 下一步

环境过了，进 [完成第一次可验证任务](/codex/start/first-task)。

## 事实来源

- [OpenAI Codex CLI README](https://github.com/openai/codex)
- [Codex 身份验证](https://learn.chatgpt.com/docs/auth)
- [Codex Windows 说明](https://learn.chatgpt.com/docs/windows/windows-app)
