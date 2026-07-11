---
title: Codex 安装、登录与环境检查
description: 在 macOS、Linux 和 Windows 安装 Codex CLI，打开桌面应用或 IDE，选择 ChatGPT/API Key 登录，并完成版本、路径和健康检查。
---

# Codex 安装、登录与环境检查

本页的完成标准不是“安装命令没有报错”，而是你能在目标项目中启动 Codex、确认当前登录方式、知道实际执行的是哪个二进制文件，并通过一次健康检查排除路径和配置问题。

## 普通用户不需要先安装 CLI

如果你主要制作 PPT、Word、Excel、报告、电商或内容素材，只需要安装并登录 ChatGPT 桌面应用，选择 Chat 或 Work，完成附件上传和文件预览即可。不要为了“更专业”先配置终端、PATH、Git 或 API Key。

普通用户请进入 [不用写代码完成第一份工作文件](/codex/everyday/first-result)。本页余下安装、版本、命令和仓库检查面向开发者。

## 安装前先决定登录方式

Codex 本地客户端支持两种 OpenAI 登录方式：

- **使用 ChatGPT 登录**：适合个人交互开发和使用 ChatGPT 工作区能力。
- **使用 API Key 登录**：按 API 用量计费，适合受控脚本、CI 或明确需要 API 组织策略的环境。

Codex cloud 需要 ChatGPT 登录。API Key 登录不自动获得云任务、GitHub 代码审查或工作区连接器等能力。

不要把真实 API Key 写进 `AGENTS.md`、仓库配置、脚本参数或聊天消息。自动化场景通过环境变量或密钥管理器注入。

## 安装 Codex CLI

### macOS 或 Linux

官方安装脚本：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

也可以选择一种包管理器：

```bash
npm install -g @openai/codex
```

```bash
brew install --cask codex
```

不要同时用多种方式反复安装。多版本并存时，升级了一个路径，终端却可能仍在执行另一个路径。

### Windows

PowerShell 安装脚本：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

也可以使用 npm。原生 Windows 下命令通常运行在 PowerShell；如果项目位于 WSL2，请确认你是在 Windows 端还是 WSL 中安装和启动 Codex，两边的路径、Git、Node 和依赖并不共享。

## 检查实际执行路径和版本

macOS、Linux 或 WSL：

```bash
type -a codex
codex --version
```

Windows PowerShell：

```powershell
Get-Command codex -All
codex --version
```

如果列出多个路径，记录第一项。它才是当前 shell 默认执行的版本。遇到“App 里有某功能、终端却没有”的情况，先比较路径和版本，不要急着重装。

## 登录

交互登录只需运行：

```bash
codex
```

在界面中选择使用 ChatGPT 登录或 API Key 登录。也可以先查看状态：

```bash
codex login status
```

这条命令可能显示经过遮挡的凭证标识。不要把完整终端输出粘贴到公开 issue、教程评论或聊天窗口。

API Key 自动化登录支持从标准输入读取：

```bash
printenv OPENAI_API_KEY | codex login --with-api-key
```

不要把 Key 直接写在命令行参数中，否则可能进入 shell 历史和进程列表。

## 打开桌面应用和 IDE

如果已安装 CLI，可从项目目录打开桌面应用：

```bash
cd /path/to/project
codex app .
```

没有安装桌面应用时，该命令会引导安装。IDE 用户从 [Codex IDE 官方页面](https://learn.chatgpt.com/docs/codex/ide) 安装或启用扩展。官方仓库当前明确列出 VS Code、Cursor 和 Windsurf 等 VS Code 兼容编辑器。

CLI 与 IDE 扩展会共享同一套本地 Codex 登录和配置层。桌面应用、CLI 和 IDE 的具体功能仍可能因版本、套餐和工作区策略不同。

## 运行健康检查

```bash
codex doctor --summary
```

需要更完整但经过脱敏的机器可读结果时：

```bash
codex doctor --json
```

重点检查：

- CLI 本身是否可运行；
- 配置文件是否能解析；
- 登录是否有效；
- 当前平台的沙箱依赖是否正常；
- Git、shell 和工作目录是否可用。

健康检查通过不代表项目一定能构建，它只说明 Codex 运行环境基本可用。

## 在项目中做最小启动测试

进入一个 Git 仓库：

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

退出后再次运行 `git status --short`，确认工作区没有新增变化。

## 更新和 shell 补全

当前 CLI 提供更新命令：

```bash
codex update
```

如果你使用包管理器维护版本，也可以继续用对应包管理器升级，但要再次运行 `type -a codex` 确认生效路径。

为 zsh 生成补全脚本：

```bash
codex completion zsh
```

先阅读输出，再按自己的 shell 配置方式加载；不要把生成内容盲目追加到多个启动文件。

## 常见故障

### `codex: command not found`

重新打开终端，检查安装脚本提示的目录是否在 `PATH` 中。不要先复制陌生网站提供的二进制文件。

### 登录成功后仍提示未授权

依次检查 `codex login status`、系统时间、代理、工作区策略和目标功能是否支持当前登录方式。API Key 可用不等于 ChatGPT 云能力可用。

### App 和 CLI 行为不一致

比较两者版本、执行路径、登录方式和读取的配置文件。macOS 上尤其要注意独立安装的 CLI 与应用包内 CLI 可能同时存在。

### Windows 项目路径混乱

确认仓库到底位于 `C:\...` 还是 WSL 的 Linux 文件系统，并在同一侧使用 Git、依赖和 Codex。跨文件系统运行大型项目通常更慢，也更容易出现权限和换行差异。

## 完成检查表

- [ ] `codex --version` 能输出版本。
- [ ] 知道 `codex` 的实际执行路径。
- [ ] 知道当前使用 ChatGPT 还是 API Key 登录。
- [ ] `codex doctor --summary` 没有未理解的关键失败。
- [ ] 能在一个 Git 仓库中以只读模式启动并退出。
- [ ] 退出后工作区状态未发生变化。

## 下一步

环境通过后，进入 [完成第一次可验证任务](/codex/start/first-task)。

## 事实来源

- [OpenAI Codex CLI README](https://github.com/openai/codex)
- [Codex 身份验证](https://learn.chatgpt.com/docs/auth)
- [Codex Windows 说明](https://learn.chatgpt.com/docs/windows/windows-app)
