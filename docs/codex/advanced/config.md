---
title: Codex config.toml 配置实战
description: 分清用户、项目、Profile 和命令行配置优先级，安全设置沙箱、审批、搜索和推理，并用 strict-config 与 doctor 验证配置。
---

# Codex config.toml 配置实战

配置文件适合保存“每次启动都应该一样”的运行默认值。任务要求放提示词，项目工作约定放 `AGENTS.md`，可复用流程放 Skill；不要把所有东西都塞进 `config.toml`。

## 配置层和优先级

Codex 当前按大致以下顺序取值，越靠前优先级越高：

1. CLI 参数和 `--config`；
2. 受信任项目中的 `.codex/config.toml`，从根到当前目录，近者优先；
3. `--profile` 选择的用户 Profile；
4. 用户配置 `~/.codex/config.toml`；
5. 系统配置；
6. 内置默认值。

项目未被信任时，项目内 `.codex/` 配置、Hooks 和 Rules 会被跳过。这是安全边界，不要为了“让配置生效”盲目信任陌生仓库。

## 一份安全的个人起步配置

编辑 `~/.codex/config.toml`：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "cached"
model_reasoning_effort = "high"
personality = "pragmatic"

[sandbox_workspace_write]
network_access = false
```

含义：

- 普通工作默认允许当前工作区写入；
- 需要越界时询问；
- 搜索默认使用缓存索引，减少直接访问不可信页面；
- 命令网络保持关闭；
- 模型和推理档位仍受账号、版本和当前模型能力限制。

不要从网络文章复制一整份“全参数配置”。未知字段可能已经废弃，也可能改变你没注意到的安全行为。

## 项目配置只保存可共享差异

受信任仓库可添加 `.codex/config.toml`：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
writable_roots = ["./docs", "./scripts"]
network_access = false
```

项目配置应与仓库一起审查。认证、模型供应商、个人通知和遥测等机器级设置不能依赖项目层覆盖；敏感值也不应写入仓库。

## 一次性覆盖用命令行

只读调查：

```bash
codex -c 'sandbox_mode="read-only"' -c 'approval_policy="never"'
```

临时开启工作区命令网络：

```bash
codex \
  -c 'sandbox_mode="workspace-write"' \
  -c 'sandbox_workspace_write.network_access=true'
```

一次性需求不要改永久配置。值按 TOML 解析，字符串引号和 shell 引号都要正确。

## 用 Profile 管理不同工作模式

例如创建 `~/.codex/audit.config.toml`：

```toml
sandbox_mode = "read-only"
approval_policy = "never"
model_reasoning_effort = "high"
```

启动：

```bash
codex --profile audit
```

Profile 适合“只读审查”“本地开发”“隔离 CI”这类稳定模式，不适合为每个小任务建一份配置。

## 严格检查配置字段

当前 CLI 支持：

```bash
codex --strict-config --sandbox read-only "只报告当前配置是否有效，不修改文件"
```

未知字段会直接报错，比静默忽略更适合升级后检查。再运行：

```bash
codex doctor --summary
```

修改配置后新开任务，旧任务通常不会完整重载所有启动配置。

## 不要在配置中明文保存凭证

MCP 和第三方服务需要 Token 时，配置应保存环境变量名：

```toml
[mcp_servers.example]
url = "https://mcp.example.com"
bearer_token_env_var = "EXAMPLE_MCP_TOKEN"
```

不要写：

```toml
# 错误示例
authorization = "Bearer real-secret"
```

静态 Header 也可能被提交、备份或打印。优先使用环境变量、OAuth 或系统凭证存储。

## 常见配置问题

### 修改后没有生效

新开任务；检查是否被 CLI 参数、项目配置或 Profile 覆盖；确认当前 `CODEX_HOME`。

### 项目配置被忽略

确认仓库已被信任、文件位于正确 `.codex/` 层、TOML 可解析。

### 网络仍不可用

搜索工具和模型生成命令的网络是不同通道。检查 `web_search`、沙箱网络、代理、域名策略和系统防火墙。

### App 与 CLI 不一致

先比较 Codex 版本、二进制路径、登录方式和宿主机。远程环境和本地环境不会自动共享所有机器设置。

## 配置变更验收

- [ ] 能解释配置放在哪一层以及为什么。
- [ ] `--strict-config` 没有未知字段。
- [ ] `codex doctor --summary` 没有关键配置错误。
- [ ] 通过一个只读任务验证实际权限和搜索行为。
- [ ] 配置和 Git diff 中没有凭证。

## 下一步

继续学习 [Codex MCP 配置与安全实战](/codex/advanced/mcp)。

## 事实来源

- [OpenAI：Config basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [OpenAI：Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference)
