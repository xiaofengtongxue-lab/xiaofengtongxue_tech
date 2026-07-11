---
title: 第三方 Codex Skill 安装与安全审计
description: 在安装社区 Skill 前审查来源、许可证、SKILL.md、脚本、依赖、网络、凭证和写入路径，并用小样本测试触发与产物。
---

# 第三方 Codex Skill 安装与安全审计

Skill 不是纯文本收藏。它可以指导 Codex运行脚本、读取文件、访问网络和调用工具。安装前审计的目标是回答：它会在什么提示下触发、执行什么、接触哪些数据、写到哪里、怎样停用。

> 本页需要 GitHub、终端和源码阅读，是技术审计教程。普通用户优先使用当前应用内置或管理员批准的能力，不要自行安装社区 Skill；先看 [普通人的 Skill 和 Plugin 入门](/codex/everyday/skills-plugins) 和 [隐私、权限与审批](/codex/everyday/safety)。

## 第一步：确认仓库身份

使用 GitHub CLI：

```bash
gh repo view owner/repo \
  --json nameWithOwner,description,url,isArchived,stargazerCount,pushedAt,licenseInfo,defaultBranchRef
```

检查：

- URL 和维护者是否与推荐来源一致；
- 是否归档；
- 最近是否维护；
- License 是否明确；
- README 是否说明依赖、数据和外部服务；
- Release/tag 是否存在。

星标和更新时间只是辅助信号。

## 第二步：查看完整目录

```bash
gh api 'repos/owner/repo/git/trees/main?recursive=1' --jq '.tree[].path'
```

重点：

- `SKILL.md`；
- `scripts/`；
- `assets/` 和模板；
- `references/`；
- `agents/openai.yaml`；
- package/requirements/lock 文件；
- Hooks、MCP、Plugin manifest；
- 安装和更新脚本。

一个简单 Skill 却带大量二进制、压缩包或混淆脚本时，应提高警惕。

## 第三步：阅读 SKILL.md

检查 frontmatter：

```yaml
---
name: example-skill
description: ...
---
```

关注：

- description 是否过宽，会不会抢占无关任务；
- 是否要求读取家目录、浏览器数据、密钥或整块磁盘；
- 是否包含自动发送、发布、删除或安装；
- 是否把网页/文档中的指令当作授权；
- 是否规定输出、验证和失败处理；
- 是否引用不存在或远程可变的文件。

## 第四步：逐个审查脚本和依赖

搜索高风险操作：

```bash
gh search code 'repo:owner/repo (curl OR wget OR sudo OR rm OR token OR password OR telemetry)' --limit 100
```

GitHub 搜索语法和权限可能变化，也要手动阅读脚本。检查：

- 删除、覆盖和递归文件操作；
- 下载后直接执行；
- `sudo` 或系统级安装；
- 环境变量和凭证读取；
- 上传、遥测和第三方 API；
- shell 拼接和命令注入；
- 写入用户配置、shell 启动文件或 Git Hooks；
- 未固定依赖和安装期脚本；
- 输出路径是否可控。

不要只审查 Python/JS 主文件，`package.json` scripts、Makefile 和安装器同样重要。

## 第五步：理解许可证和素材权利

- MIT/Apache 等代码许可不自动授权第三方字体、图片和模型输出；
- GPL/AGPL 可能影响分发和网络服务；
- CC 许可可能要求署名或限制商业使用；
- 商标、人物、模板和音乐有独立条款；
- 连接器还受外部服务隐私和使用条款约束。

商业项目有疑问时交给法务，不让 Codex替你做最终法律判断。

## 第六步：固定版本并安装到最小作用域

优先仓库级测试，不直接装进所有项目。使用内置安装器时，在 Codex 中输入：

```text
$skill-installer

安装 https://github.com/owner/repo/tree/<commit-or-tag>/<skill-path>，先说明目标目录和将写入的文件。不要运行该 Skill 的业务脚本。
```

如果安装器不支持固定 commit，先在临时/测试仓库审查并记录安装时的 commit SHA。

安装后检查它实际写到哪个目录。当前官方 authoring 位置通常是 `.agents/skills/` 或 `$HOME/.agents/skills/`；旧安装器可能使用 Codex home 下的 Skills 目录。

## 第七步：新任务中做显式小样本测试

使用虚构数据：

```text
$example-skill

使用 fixtures/sample/ 完成一次最小任务。禁止网络、禁止读取 fixtures 以外文件、禁止发送或发布。先列出将运行的脚本和输出路径，再执行。
```

检查：

- 是否只在明确调用时触发；
- 实际读取/写入是否符合说明；
- 是否偷偷安装依赖或联网；
- 输出是否能打开和验证；
- 失败是否留下半成品或覆盖原文件；
- 日志是否泄露数据。

## 第八步：做负向触发测试

一个 PPT Skill 不应在“解释 PowerPoint 文件格式”时自动开始生成文件。测试：

```text
解释 .pptx 的基本结构，不创建或修改文件。
```

如果仍隐式触发，description 过宽，或应在 `agents/openai.yaml` 中关闭隐式调用。

## 第九步：先停用，再决定删除

可在 `~/.codex/config.toml` 禁用：

```toml
[[skills.config]]
path = "/absolute/path/to/skill/SKILL.md"
enabled = false
```

新开任务确认不再加载。删除前记录安装路径、来源和本地修改，只对准确目录做明确文件操作，不运行宽范围清理。

如果 Skill 连接了外部服务，还要撤销 OAuth、Token、MCP 和 Plugin 授权。

## 升级策略

升级前比较：

- 旧/新 commit diff；
- `SKILL.md` 触发变化；
- scripts、依赖、Hooks 和权限；
- 新的遥测/外部服务；
- 许可证；
- 产物兼容性。

重新运行小样本与负向测试。不要把社区主分支自动更新直接用于生产流程。

## 审计结论模板

```text
仓库/commit：
许可证：
安装作用域：
触发范围：
读取：
写入：
网络/外部服务：
凭证：
脚本与依赖：
Hooks/MCP：
验证样本：
未解决风险：
结论：允许测试 / 限制使用 / 不安装
```

## 完成门槛

- [ ] 来源、commit 和许可证已记录。
- [ ] SKILL.md、脚本和依赖已阅读。
- [ ] 网络、凭证、遥测和写入路径清楚。
- [ ] 使用最小作用域和虚构数据测试。
- [ ] 显式与负向触发都符合预期。
- [ ] 知道怎样停用、撤销授权和升级。

## 下一步

现成 Skill 无法匹配团队流程时，进入 [从零创建自己的 Codex Skill](/codex/skills/create)。
