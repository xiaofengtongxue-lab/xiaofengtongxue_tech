---
title: Codex config.toml 配置实战
description: 分清用户、项目、Profile 和命令行配置优先级，安全设置沙箱、审批、搜索和推理，并用 strict-config 与 doctor 验证配置。
---

# Codex config.toml 配置实战

嘿朋友，今天来聊聊 Codex 的 `config.toml` 配置。说实话我刚上手的时候也是一团乱麻——命令行参数、项目配置、用户配置全搅在一起，改了半天不知道到底哪个生效。踩了几天坑之后总算理清楚了，这篇把我现在用的套路分享给你。

配置文件这东西，适合放“每次启动都长一样”的运行默认值。任务要求丢提示词里，项目工作约定写 `AGENTS.md`，可复用流程做成 Skill。`config.toml` 就是个兜底默认值的地儿，啥都往里塞反而乱。

## 配置层和优先级

Codex 取值大概按这个顺序来，越靠前越能压住后面的：

1. CLI 参数和 `--config`；
2. 受信任项目里的 `.codex/config.toml`，从根到当前目录，离你越近的越优先；
3. `--profile` 选中的用户 Profile；
4. 用户配置 `~/.codex/config.toml`；
5. 系统配置；
6. 内置默认值。

有个坑我踩过：项目没被信任的时候，里面 `.codex/` 的配置、Hooks 和 Rules 统统跳过，悄无声息地就当不存在。这是安全边界，千万别为了“让配置生效”就去盲目信任一个陌生仓库——我就干过这种蠢事，事后一身冷汗。

好，优先级搞清楚了，下面说怎么配。

## 一份安全的个人起步配置

先搞定你自己的 `~/.codex/config.toml`，这是我目前在用的：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "cached"
model_reasoning_effort = "high"
personality = "pragmatic"

[sandbox_workspace_write]
network_access = false
```

逐条唠唠：

- 平时干活默认允许当前工作区写入，够用也不会太受限；
- 需要越界操作的时候它问你一声，不至于悄咪咪干了什么你都不知道；
- 搜索默认走缓存索引，减少直接访问不可信页面，安全一点是一点；
- 命令网络保持关着，需要的时候再临时开；
- 模型和推理档位这些还是受账号、版本和当前模型能力限制，不是写了 `high` 就一定生效。

另外提醒一句：别从网上文章里复制一整份“全参数配置”然后直接贴进去。我见过有人这么干，结果里面混了已经废弃的字段，行为变了都察觉不到。从简开始，需要什么加什么。

## 项目配置只保存可共享差异

团队仓库里，受信任的项目可以加 `.codex/config.toml`，把团队一致的东西放进去：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
writable_roots = ["./docs", "./scripts"]
network_access = false
```

项目配置跟着仓库走，所以得跟代码一起审查。认证信息、模型供应商、个人通知、遥测这些机器级别的设置，别指望项目层能帮你兜底——它兜不住。敏感值更是千万别写进仓库，提上去就是事故。

说到命令行，有时候就临时用一下，没必要动文件。

## 一次性覆盖用命令行

只读调查，一次性搞定：

```bash
codex -c 'sandbox_mode="read-only"' -c 'approval_policy="never"'
```

偶尔需要工作区命令连个网：

```bash
codex \
  -c 'sandbox_mode="workspace-write"' \
  -c 'sandbox_workspace_write.network_access=true'
```

原则很简单：一次性需求别去改永久配置，改来改去迟早把自己绕晕。值按 TOML 解析，字符串引号和 shell 引号都得写对，少一个引号就报错，这个我也被坑过。

如果你发现经常要在几种模式之间切换，那 Profile 就是为你准备的。

## 用 Profile 管理不同工作模式

比如搞个 `~/.codex/audit.config.toml`：

```toml
sandbox_mode = "read-only"
approval_policy = "never"
model_reasoning_effort = "high"
```

启动时指定一下就行：

```bash
codex --profile audit
```

Profile 特别适合“只读审查”“本地开发”“隔离 CI”这种稳定模式。别为了每个小任务都建一份配置，那样维护起来比不用 Profile 还累。我一开始就犯过这个毛病，建了五六个 profile，后来全删了只剩三个。

配置文件写好了，怎么知道它有没有问题呢？

## 严格检查配置字段

现在 CLI 支持这个：

```bash
codex --strict-config --sandbox read-only "只报告当前配置是否有效，不修改文件"
```

未知字段直接报错，比静默忽略强太多了，升级之后跑一遍心里有底。然后再来一个：

```bash
codex doctor --summary
```

跑完 doctor 看看有没有关键配置报错。记得改完配置新开任务，旧任务一般不会完整重载所有启动配置——这个细节不注意的话你会怀疑人生，“明明改了怎么还这样”。

## 不要在配置中明文保存凭证

MCP 和第三方服务需要 Token 的话，配置里保存环境变量名就行：

```toml
[mcp_servers.example]
url = "https://mcp.example.com"
bearer_token_env_var = "EXAMPLE_MCP_TOKEN"
```

千万别这样写：

```toml
# 错误示例
authorization = "Bearer real-secret"
```

静态 Header 一不小心就被提交、备份或者打印到日志里去了，防不胜防。优先走环境变量、OAuth 或者系统凭证存储。这块我郑重提醒，因为我真的见过有人把 token 提交到 GitHub 公开仓库的。

## 常见配置问题

下面这些坑我都踩过，整理出来给你省点时间。

### 修改后没有生效

新开一个任务试试；检查是不是被 CLI 参数、项目配置或者 Profile 覆盖了；确认一下当前 `CODEX_HOME` 对不对。

### 项目配置被忽略

三步排查：仓库被信任了没、文件在正确的 `.codex/` 层级下没、TOML 能正常解析不。

### 网络仍不可用

搜索工具和模型生成命令的网络是不同通道，分开的。把 `web_search`、沙箱网络、代理、域名策略和系统防火墙都顺一遍。

### App 与 CLI 不一致

先对齐 Codex 版本、二进制路径、登录方式和宿主机。远程环境和本地环境不会自动共享所有机器设置，这一点很容易想当然。

## 配置变更验收

改完配置之后，照着这个 checklist 过一遍：

- [ ] 能解释配置放在哪一层以及为什么。
- [ ] `--strict-config` 没有未知字段。
- [ ] `codex doctor --summary` 没有关键配置错误。
- [ ] 通过一个只读任务验证实际权限和搜索行为。
- [ ] 配置和 Git diff 中没有凭证。

## 下一步

配置搞定了，接下来看看 MCP 怎么配：继续读 [Codex MCP 配置与安全实战](/codex/advanced/mcp)。

## 事实来源

- [OpenAI：Config basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [OpenAI：Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference)
