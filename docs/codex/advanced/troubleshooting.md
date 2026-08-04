---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: Codex 常见故障分层排查
description: 按入口、版本、登录、配置、权限、网络、Skill/MCP/Plugin 和项目运行时逐层定位 Codex 问题，得到可复现证据再决定是否重装。
---

# Codex 常见故障分层排查

嘿，朋友，Codex 出问题了？先别急着卸载重装——我以前就这么干过，结果把配置和缓存全清了，问题还是老样子，纯纯白折腾。这篇文章是我踩坑踩出来的排查套路，从最外层一步步往里挖，帮你找到真正的问题在哪儿。

Codex 的毛病可能出在 App、CLI、登录、配置、沙箱、网络、插件，甚至是你项目本身。直接重装看起来省事，其实只是把表面抹平了，根因还在那儿。正确的做法是先把原始症状稳住，再一层一层缩小范围。

## 第一步：保留原始症状

出问题的时候，先把现场拍下来：

- 完整的错误文本，一个字别漏；
- 你是用 App、CLI、IDE 还是 Cloud 碰到的；
- 怎么触发的，步骤越细越好；
- 项目路径和分支；
- 是不是只有某个仓库才这样；
- 最近有没有升级、改配置、换网络；
- 你预期它干啥、实际干了啥。

截图和日志记得先脱敏。`auth.json`、API Key、Cookie、内部 URL、用户数据这些东西打死别往外发。

## 第二步：确认版本和实际二进制

说起来你可能不信，我有一次排查了一下午，最后发现系统里装了三个不同版本的 `codex`——Homebrew 一个、npm 一个、安装脚本又一个，PATH 里排在前面的那个根本不是我以为的那个。所以这一步别跳：

macOS / Linux：

```bash
type -a codex
codex --version
```

Windows：

```powershell
Get-Command codex -All
codex --version
```

出来多个路径的话，记下第一个是谁。App 内置 CLI、npm、Homebrew、安装脚本——它们可能和平共处，但版本和行为不一定一样。别想当然觉得同名命令就是同一个东西。

## 第三步：运行健康检查

```bash
codex doctor --summary
```

如果你需要机器可读、脱敏后的诊断结果：

```bash
codex doctor --json
```

`doctor` 会把问题按模块分组，哪个组挂了就盯着哪个组往下查，别一口气把所有设置都改了——那跟重装没啥区别。

## 第四步：检查登录层

```bash
codex login status
```

看看你当前用的是 ChatGPT 登录、API Key 还是企业 Token。我自己踩过一个坑：API Key 在本地跑得好好的，一到 Cloud 任务就各种权限报错，后来才发现 API Key 能用的范围和 Cloud agent 需要的权限根本是两码事。

登录如果一直循环，先从简单的查起：系统时间对不对、默认浏览器有没有问题、代理设置、SSO/MFA、工作区策略。有必要的话先退出再按官方流程重新登录，但别手滑把整个 Codex 目录删了。

## 第五步：隔离配置问题

严格模式检查配置有没有语法问题：

```bash
codex --strict-config --sandbox read-only "只报告配置是否有效"
```

非交互式任务可以临时忽略用户配置，做个对比：

```bash
codex exec --ignore-user-config --sandbox read-only "只读取仓库并报告项目类型"
```

如果忽略配置后问题消失了，那就说明问题出在配置里。逐项排查这些地方：

- `~/.codex/config.toml`；
- 当前选择的 Profile；
- 受信任项目的 `.codex/config.toml`；
- 环境变量和 `CODEX_HOME`；
- Rules、Hooks、MCP 和供应商配置。

改配置别一下子覆盖整个文件，每次只改一小块，改完就试一次。这样才能确定是哪个配置项在捣乱。

## 第六步：检查权限和工作区

用只读模式跑一个最简单的任务试试：

```bash
codex --sandbox read-only -C /path/to/project
```

如果只读能过、一写就挂，那就重点查这些：

- 项目目录是不是在允许写入的根目录下；
- 目标文件的系统权限；
- `.git`、`.codex` 等受保护路径有没有被误锁；
- App/IDE 打开的实际目录跟你以为的是不是同一个；
- 是不是用了 worktree 或远程环境；
- 项目有没有被信任；
- 审批策略是不是直接拒绝了，而不是弹窗问你。

## 第七步：区分搜索网络和命令网络

这个坑我踩得特别深。有一次模型能搜网页、能回答 Stack Overflow 上的问题，我以为网络没问题，结果 `npm install` 就是跑不动。后来才搞明白：模型自己的搜索网络和沙箱里执行命令的网络是两条路。

逐个确认这些：

- `web_search` 配置；
- `[sandbox_workspace_write].network_access`；
- 代理环境变量和系统代理设置；
- DNS、防火墙、证书；
- 域名 allow/deny 列表；
- Cloud agent 阶段有没有开互联网权限。

> ⚠️ 代理变量里可能夹着账号密码，分享输出前一定脱敏。

## 第八步：检查 MCP、Plugin 和 Skill

```bash
codex mcp list
codex plugin marketplace list
codex plugin list
```

如果问题只在用某个扩展的时候出现：

- 新开一个任务或者重启试试；
- 确认扩展是 enabled 状态；
- 检查 OAuth / Token 有没有过期；
- 检查工具的 allowlist 和审批设置；
- 检查 Hook 有没有被信任；
- 显式调用 Skill / Plugin 名称测试；
- 用最小只读请求单独测那个连接。

记住一条铁律：别同时升级多个插件又改 MCP 配置，出了问题你根本不知道是谁的锅。

## 第九步：证明是不是项目问题

换个干净的小型 Git 仓库，跑一个只读任务。如果新仓库没事、原仓库挂了，那就盯着原仓库的这些地方：

- `AGENTS.md` 和 `.codex/` 目录；
- 依赖版本；
- 启动脚本；
- 路径长度和文件权限；
- Git 状态或 worktree；
- 本地服务、端口、数据库；
- 特殊的 shell 或平台要求。

Codex 能启动不等于你项目里的命令能跑——这是两回事。项目的原始失败输出一定要留着，后面复现用得上。

## 第十步：制作最小复现

前面九步都走完了还没搞定？那就该准备一份「最小复现包」了：

- Codex 组件和版本；
- 操作系统；
- 最小配置片段（去掉所有秘密信息）；
- 最小仓库或文件结构；
- 精确的复现命令；
- 预期行为 vs 实际行为；
- `doctor` 相关结果（已脱敏）；
- 忽略用户配置后问题是否还在。

先去 [openai/codex issues](https://github.com/openai/codex/issues) 用原始错误文本搜一圈，大概率已经有人碰到过了。真要提新 issue 的话，别写「Codex 不能用」这种废话——把上面的信息贴齐，别人才能帮到你。

## 高频症状速查

### 命令不存在

检查安装路径、PATH，重启一下 shell。有时候就是忘了 `source` 一下配置文件的锅。

### App 有功能、CLI 没有

对比版本、登录方式和二进制来源。有些能力是特定入口才有的，CLI 和 App 的能力面不完全重合。

### 修改不生效

确认你真的在改对的工作目录、项目配置的优先级对不对、有没有新开任务重新加载、分支对不对。我就经常改了半天发现改的是另一个分支的配置。

### 总是要求审批

检查 sandbox、approval、Rules、MCP tool approval 和组织策略。别图省事直接切 full access，那是用权限掩盖问题，换个环境照样翻车。

### Skill 不触发

检查 Skill 放的位置对不对、`SKILL.md` 的 frontmatter 和 description、enabled 状态；新开一个任务，用 `$skill-name` 显式调用测试。

### Cloud 和本地不一致

对比起始 commit、setup 步骤、环境变量、秘密变量、网络策略、平台差异和 ignored 文件。Cloud agent 的环境跟你本地终端可能天差地别。

## 什么时候才考虑重装

只有下面这些条件全满足了，重装才值得考虑：

- 二进制确实损坏或缺失了；
- 官方升级 / 安装流程都试过，修不好；
- 干净配置 + 最小项目依然稳定复现；
- 问题明确锁定在安装层，排除了登录、配置、权限、网络、项目这些层。

重装之前先把现有配置备份好、审查一遍哪些该保留。别把可能带问题的缓存和带秘密的配置复制到公开位置——血的教训。

## 完成门槛

- [ ] 能指出问题在哪个层，而不是光说「Codex 坏了」。
- [ ] 有最小复现步骤和原始错误。
- [ ] 排查过程每次只改一个变量。
- [ ] 没有用放大权限的方式掩盖问题。
- [ ] 分享出去的诊断信息已经脱敏。

## 下一步

走完这套排查流程之后，可以去 [Codex 技巧与场景实战](/codex/practice/) 看看实战技巧，或者逛逛 [Codex Skill 推荐](/codex/skills/) 找找好用的 Skill。

## 事实来源

- [OpenAI Codex Troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting)
- [OpenAI Codex GitHub Issues](https://github.com/openai/codex/issues)
