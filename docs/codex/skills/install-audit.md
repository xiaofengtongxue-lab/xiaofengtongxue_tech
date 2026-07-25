---
title: 第三方 Codex Skill 安装与安全审计
description: 在安装社区 Skill 前审查来源、许可证、SKILL.md、脚本、依赖、网络、凭证和写入路径，并用小样本测试触发与产物。
---

# 第三方 Codex Skill 安装与安全审计

哈喽，我是小枫。今天聊一个我自己踩过坑的话题——安装别人写的 Codex Skill 之前，到底要看哪些东西。

Skill 这东西吧，它能跑脚本、读文件、联网、调工具，说白了就是你给它开了个"代驾"权限。装之前心里得有个数：它什么时候会自己动起来、干了什么、碰了哪些数据、东西写到哪儿了、万一不爽怎么卸掉。下面这九个步骤是我自己折腾出来的流程，不一定最专业，但够实用。

> 这篇是技术向的审计教程，需要你会用 GitHub、终端和看源码。如果你是普通用户，优先用应用内置或者管理员审批过的能力就行，不用自己折腾社区 Skill。先看看这两篇打底：[普通人的 Skill 和 Plugin 入门](/codex/everyday/skills-plugins) 和 [隐私、权限与审批](/codex/everyday/safety)。

## 第一步：确认仓库身份

先看看这仓库到底是谁的、还活没活着。我用 GitHub CLI 一把梭：

```bash
gh repo view owner/repo \
  --json nameWithOwner,description,url,isArchived,stargazerCount,pushedAt,licenseInfo,defaultBranchRef
```

主要盯这几个点：

- URL 和维护者跟推荐来源对得上吗；
- 仓库是不是已经归档了（归档基本等于没人管）；
- 最近还有没有在维护；
- License 写清楚了没；
- README 里有没有交代依赖、数据和外部服务；
- 有没有正经的 Release 或 tag。

星标数和更新时间看看就行，别太当真——我自己就见过星标不少但半年没更新的 Skill，装上去各种报错。

## 第二步：查看完整目录

接着把整个仓库的文件树拉下来瞅一眼：

```bash
gh api 'repos/owner/repo/git/trees/main?recursive=1' --jq '.tree[].path'
```

重点关注这几个：

- `SKILL.md`；
- `scripts/`；
- `assets/` 和模板；
- `references/`；
- `agents/openai.yaml`；
- package/requirements/lock 文件；
- Hooks、MCP、Plugin manifest；
- 安装和更新脚本。

说个我遇到的坑：有个 Skill 看着功能很单纯，结果目录里塞了好几个二进制文件和压缩包，打开一看是没文档的闭源依赖，果断放弃。一个简单 Skill 带大量二进制、压缩包或者混淆脚本，这时候就该警惕了。

## 第三步：阅读 SKILL.md

SKILL.md 是这个 Skill 的"身份证"，frontmatter 长这样：

```yaml
---
name: example-skill
description: ...
---
```

读的时候我习惯问自己这几个问题：

- description 是不是写得太宽了，会不会抢别的任务的触发？
- 有没有要求读家目录、浏览器数据、密钥或者整块磁盘？
- 有没有自动发送、发布、删除、安装的操作？
- 会不会把网页或者文档里的指令当授权用？
- 输出、验证和失败处理有明确写吗？
- 有没有引用不存在或者远程随时能改的文件？

有一次我碰到一个 Skill，description 写得巨宽泛，结果我在聊天里随口提了一句相关话题它就触发了，搞得我一脸懵。后来学乖了，description 太"野心勃勃"的我都先打问号。

## 第四步：逐个审查脚本和依赖

这一步最花时间，但也最关键。先用 GitHub 搜索扫一遍高风险关键词：

```bash
gh search code 'repo:owner/repo (curl OR wget OR sudo OR rm OR token OR password OR telemetry)' --limit 100
```

GitHub 搜索语法和权限可能会变，别全指望这个，还得手动翻脚本。我一般检查这些：

- 有没有删除、覆盖、递归文件操作；
- 有没有下载完直接执行的；
- 有没有 `sudo` 或系统级安装；
- 有没有读环境变量和凭证；
- 有没有上传、遥测、调第三方 API；
- shell 拼接有没有命令注入的风险；
- 会不会写用户配置、shell 启动文件或 Git Hooks；
- 依赖有没有固定版本、有没有安装期脚本；
- 输出路径是不是可控的。

别光盯着 Python 或者 JS 主文件，`package.json` 里的 scripts、Makefile、安装器同样能搞事情。这个我有发言权——之前差点漏了一个 `postinstall` 脚本，它静悄悄地往 `~/.bashrc` 里追加了一行。

## 第五步：理解许可证和素材权利

许可证这事容易被忽略，我简单捋一下：

- MIT/Apache 管的是代码，不管第三方字体、图片和模型输出；
- GPL/AGPL 可能影响你的分发方式和网络服务；
- CC 许可可能要署名或者限制商业使用；
- 商标、人物、模板、音乐有独立条款；
- 连接器还受外部服务的隐私和使用条款约束。

商业项目拿不准的交法务，别让 Codex 替你做法务判断——这是我一个做合规的朋友千叮万嘱的。

## 第六步：固定版本并安装到最小作用域

别一上来就往所有项目里装，先在单个仓库里试试水。用内置安装器的话，在 Codex 里输入：

```text
$skill-installer

安装 https://github.com/owner/repo/tree/<commit-or-tag>/<skill-path>，先说明目标目录和将写入的文件。不要运行该 Skill 的业务脚本。
```

如果安装器不支持固定 commit，就在临时或测试仓库里审查，手动记下安装时的 commit SHA。

装完之后确认一下实际写到哪个目录了。目前官方 authoring 位置一般是 `.agents/skills/` 或 `$HOME/.agents/skills/`；旧安装器可能用 Codex home 下的 Skills 目录，路径不太一样。

## 第七步：新任务中做显式小样本测试

用虚构数据跑一遍，别拿真实项目当小白鼠：

```text
$example-skill

使用 fixtures/sample/ 完成一次最小任务。禁止网络、禁止读取 fixtures 以外文件、禁止发送或发布。先列出将运行的脚本和输出路径，再执行。
```

跑完检查：

- 是不是只在明确调用时才触发；
- 实际读写跟说明对得上吗；
- 有没有偷偷装依赖或者联网；
- 输出能不能正常打开和验证；
- 失败了会不会留半成品或者覆盖原文件；
- 日志有没有泄露数据。

我自己测试的时候习惯开个全新的空目录，这样万一它乱写东西也伤不到正经项目。

## 第八步：做负向触发测试

这个想法来自一次乌龙：一个 PPT Skill，在我问"解释一下 .pptx 的文件结构"的时候自己开始生成文件了，我直接傻眼。所以后来我加了一个负向测试：

```text
解释 .pptx 的基本结构，不创建或修改文件。
```

如果这种跟它功能沾边但明确说了不要动的场景下它还是触发了，那 description 八成写太宽了，或者该在 `agents/openai.yaml` 里关掉隐式调用。

## 第九步：先停用，再决定删除

不想用的话先停用，别直接删——万一之后要回溯呢。在 `~/.codex/config.toml` 里禁用：

```toml
[[skills.config]]
path = "/absolute/path/to/skill/SKILL.md"
enabled = false
```

新开个任务确认它确实不加载了。删之前记好安装路径、来源和本地改了什么，只对明确的目录做精确操作，别跑什么宽范围清理命令。

如果 Skill 连了外部服务，还要把 OAuth、Token、MCP 和 Plugin 授权一并撤销，不然删了目录授权还在就尴尬了。

## 升级策略

升级不是无脑 pull，我习惯先比对：

- 旧/新 commit diff；
- `SKILL.md` 触发条件变了没；
- scripts、依赖、Hooks 和权限；
- 有没有新增遥测或外部服务；
- 许可证变没变；
- 产物还能不能兼容。

比对完重新跑小样本和负向测试。社区主分支自动更新直接用于生产流程，这个我是不敢的——你永远不知道哪个 commit 会带进来什么。

## 审计结论模板

看完上面这些，用这个模板做个记录就行，不用整太花哨：

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

现成 Skill 对不上团队流程的话，去看看 [从零创建自己的 Codex Skill](/codex/skills/create)，我写了另一篇手把手的教程。

---

以上就是我自己审计第三方 Skill 的完整流程。说实话大部分社区 Skill 都是靠谱的，但留个心眼总没错。有问题或者更好的方法，欢迎来交流，我也在持续学习。
