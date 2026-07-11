---
title: Codex 常见故障分层排查
description: 按入口、版本、登录、配置、权限、网络、Skill/MCP/Plugin 和项目运行时逐层定位 Codex 问题，得到可复现证据再决定是否重装。
---

# Codex 常见故障分层排查

Codex 故障经常发生在不同层：App、CLI、登录、配置、沙箱、网络、插件或项目本身。直接重装会清掉表面状态，却无法证明根因。正确方法是先固定原始症状，再逐层缩小。

## 第一步：保留原始症状

记录：

- 完整错误文本；
- 使用 App、CLI、IDE 还是 Cloud；
- 触发步骤；
- 项目路径和分支；
- 是否只在某个仓库出现；
- 最近升级、配置或网络变化；
- 预期与实际。

截图和日志先脱敏。不要公开 `auth.json`、API Key、Cookie、内部 URL 和用户数据。

## 第二步：确认版本和实际二进制

macOS/Linux：

```bash
type -a codex
codex --version
```

Windows：

```powershell
Get-Command codex -All
codex --version
```

多个路径时记录第一项。App 内置 CLI、npm、Homebrew 或安装脚本版本可能并存。功能差异先比较版本，不要假设同名命令就是同一个文件。

## 第三步：运行健康检查

```bash
codex doctor --summary
```

需要机器可读且经过脱敏的诊断：

```bash
codex doctor --json
```

根据失败组继续，不要一次修改所有设置。

## 第四步：检查登录层

```bash
codex login status
```

确认当前是 ChatGPT、API Key 还是企业 Token。API Key 本地任务可用，不代表 Cloud、GitHub 云审查或工作区连接器可用。

登录循环时检查系统时间、默认浏览器、代理、SSO/MFA 和工作区策略。必要时先退出再按官方流程登录，但不要删除整个 Codex 目录。

## 第五步：隔离配置问题

严格解析：

```bash
codex --strict-config --sandbox read-only "只报告配置是否有效"
```

非交互任务可临时忽略用户配置做对比：

```bash
codex exec --ignore-user-config --sandbox read-only "只读取仓库并报告项目类型"
```

如果忽略配置后恢复，逐项检查：

- `~/.codex/config.toml`；
- 选择的 Profile；
- 受信任项目 `.codex/config.toml`；
- 环境变量和 `CODEX_HOME`；
- Rules、Hooks、MCP 和供应商配置。

不要直接覆盖原配置。做小范围编辑并每次重试。

## 第六步：检查权限和工作区

用只读模式做最小任务：

```bash
codex --sandbox read-only -C /path/to/project
```

如果只读可用、修改失败，检查：

- 项目是否在允许写入根目录；
- 目标文件系统权限；
- `.git`、`.codex` 等受保护路径；
- App/IDE 打开的实际目录；
- worktree 或远程环境；
- 项目是否被信任；
- 审批策略是否拒绝而不是询问。

## 第七步：区分搜索网络和命令网络

常见混淆：模型能搜索网页，但 `npm install` 仍失败；或者 shell 能 `curl`，Codex 沙箱命令不能联网。

检查：

- `web_search` 配置；
- `[sandbox_workspace_write].network_access`；
- 代理环境变量和系统代理；
- DNS、防火墙和证书；
- 域名 allow/deny；
- Cloud agent 阶段是否允许互联网。

代理变量可能含账号信息，分享输出前脱敏。

## 第八步：检查 MCP、Plugin 和 Skill

```bash
codex mcp list
codex plugin marketplace list
codex plugin list
```

问题只在扩展任务出现时：

- 新开任务或重启；
- 确认 enabled；
- 检查 OAuth/Token；
- 检查工具 allowlist 和审批；
- 检查 Hook 信任；
- 显式调用 Skill/Plugin 名称；
- 用最小只读请求测试单个连接。

不要同时升级多个插件并修改 MCP 配置，否则难以归因。

## 第九步：证明是不是项目问题

在另一个小型 Git 仓库运行只读任务。如果全局可用、目标仓库失败，检查项目：

- `AGENTS.md` 和 `.codex/`；
- 依赖版本；
- 启动脚本；
- 路径长度和权限；
- Git 状态或 worktree；
- 本地服务、端口和数据库；
- 特殊 shell/平台要求。

Codex 能启动不代表项目命令能运行。保留项目命令的原始失败输出。

## 第十步：制作最小复现

问题仍未解决时，准备：

- Codex 组件和版本；
- 操作系统；
- 最小配置片段（无秘密）；
- 最小仓库或文件结构；
- 精确命令；
- 预期与实际；
- `doctor` 相关脱敏结果；
- 是否在忽略用户配置后仍复现。

到 [openai/codex issues](https://github.com/openai/codex/issues) 搜索原始错误文本，再决定提交 issue。不要只写“Codex 不能用”。

## 高频症状速查

### 命令不存在

检查安装路径、PATH 和 shell 重启。

### App 有功能、CLI 没有

比较版本、登录方式和二进制来源；某些能力只属于特定 surface。

### 修改不生效

确认真实工作目录、项目配置优先级、新任务重载和目标分支。

### 总是要求审批

检查 sandbox、approval、Rules、MCP tool approval 和组织策略，不要直接切 full access。

### Skill 不触发

检查位置、`SKILL.md` frontmatter、description、enabled 状态；新开任务并显式 `$skill-name` 测试。

### Cloud 本地不一致

比较起始提交、setup、环境变量、秘密、网络、平台和 ignored 文件。

## 什么时候才考虑重装

只有在以下证据成立时：

- 二进制损坏或缺失；
- 官方升级/安装流程无法修复；
- 干净配置和最小项目仍稳定失败；
- 问题明确落在安装层，而不是登录、配置、权限、网络或项目。

重装前备份并审查需要保留的配置，不复制可能导致问题的缓存和秘密到公开位置。

## 完成门槛

- [ ] 能指出问题所在层，而不是只描述症状。
- [ ] 有最小复现和原始错误。
- [ ] 每次只改变一个变量。
- [ ] 没有通过放大权限掩盖问题。
- [ ] 分享的诊断已经脱敏。

## 下一步

完成专家路线后，可以进入 [Codex 技巧与场景实战](/codex/practice/) 或 [Codex Skill 推荐](/codex/skills/)。

## 事实来源

- [OpenAI Codex Troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting)
- [OpenAI Codex GitHub Issues](https://github.com/openai/codex/issues)
