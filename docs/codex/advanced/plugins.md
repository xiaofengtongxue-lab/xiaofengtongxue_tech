---
title: Codex Plugins 安装与管理实战
description: 分清 Plugin、Skill 与 MCP，查看 Marketplace、安装官方或团队插件、完成认证和权限检查，并在新任务中验证插件是否真正可用。
---

# Codex Plugins 安装与管理实战

嘿，朋友！今天咱聊聊 Codex 的插件系统。我第一次接触这套东西的时候，脑子里一堆词儿——Plugin、Skill、MCP、Hook——说实话当时直接懵了：这都啥跟啥啊，装哪个才对？踩了不少坑之后总算理顺了，这篇就跟你唠唠我的实战心得。

Plugin 本质就是一个「能力大礼包」：它可以打包 Skills、MCP 应用、连接器、Hooks、素材，甚至定时任务模板。你想分发一套完整工作流，Plugin 就特别合适。当然啦，如果你只是想给 Codex 塞一份可复用的操作说明，单独搞个 Skill 会更轻便。

## 先分清三个概念

在动手之前，咱先把这三个东西掰扯清楚，不然很容易张冠李戴。

| 能力 | 主要解决什么 | 典型内容 |
| --- | --- | --- |
| Skill | 让 Codex 按固定方法做一类任务 | `SKILL.md`、模板、脚本、参考资料 |
| MCP/App | 访问实时外部数据或执行工具 | 搜索文档、读取 Figma、操作服务 |
| Plugin | 安装和分发完整能力包 | Skills + MCP/App + Hooks + 资产 |

记住一个原则就好：十行团队检查表那种小东西，直接写个 Skill，别费劲搞 Plugin；反过来，也别指望一个纯 Skill 就能去调 Figma API 拉设计稿——它没那个外部访问能力。

## 查看当前 Marketplace

工欲善其事，先看看「货架」上有啥。下面这个命令列出你可用的 Marketplace：

```bash
codex plugin marketplace list
```

查看已安装插件：

```bash
codex plugin list
```

想看看还能装啥、拿到完整 ID，加个 JSON 输出更直观：

```bash
codex plugin list --available --json
```

> 注意：Marketplace 名称会因版本、套餐和组织不同而有差异，一切以你自己终端跑出来的结果为准。

## 安装一个可用插件

好，假设你跑完上面的命令看到类似这样的东西：

```text
build-web-apps@openai-api-curated
```

那就直接装：

```bash
codex plugin add build-web-apps@openai-api-curated
```

装完再确认一下：

```bash
codex plugin list
```

**这里有个我踩过的坑：** 装完插件后我兴冲冲在当前任务里就用，结果怎么调都没反应，折腾了半天。后来才发现——安装或更新插件后，你得新开一个任务才行，旧任务不会自动重新加载新的技能和工具。记住这个，能省半小时 debug。

## 添加团队或开源 Marketplace

你们的团队可能会维护自己的插件仓库，或者你发现了一个很棒的开源 Marketplace。确认仓库来源靠谱之后：

```bash
codex plugin marketplace add owner/repo --ref main
```

也支持本地路径或 Git URL。不过，加之前务必审查下面这些东西，别闭着眼睛装：

- Marketplace 清单指向哪些插件；
- 插件 manifest、Skills、MCP 配置和 Hooks；
- 脚本有没有下载或执行外部内容；
- 需要哪些账号和 OAuth scope；
- 许可证、维护状态和升级方式。

刷新 Git Marketplace：

```bash
codex plugin marketplace upgrade <marketplace-name>
```

生产环境的话，别开自动追踪主分支——哪天主分支一个不留神推了 breaking change，全团队跟着遭殃。固定到一个经过审查的 ref 或版本才睡得着觉。

## 安装后做能力验收

装完不等于能用，得验收。我现在的习惯是：新开一个任务，先问个只读问题探探路。

以 Web 应用插件为例，先这样问：

```text
列出 build-web-apps 插件提供的可用 Skills、工具和外部依赖。只报告，不修改项目，也不要开始认证。
```

再跑一个只读小任务试试水：

```text
使用该插件检查当前前端项目的构建入口和浏览器验证方式。不要编辑文件，不要访问需要登录的服务。
```

验收的时候重点盯这几个：

- 插件到底加载了没有；
- 触发的是哪个 Skill 或工具；
- 有没有莫名其妙要求认证；
- 数据会不会发到第三方；
- 写操作是否触发了审批；
- 失败了能不能清楚告诉我缺了什么。

## 外部连接器的权限边界

这里有个容易忽略的点：安装插件、连接账号、执行动作——这是三个独立的阶段。

打个比方，Google Drive 插件可能顺手要了 Drive、Docs、Sheets、Slides 一堆权限。连接时用最小权限的账号，任务里要明确告诉 Codex 你只是读取、创建草稿、还是真的要改现有文件。别稀里糊涂就把分享、发送、改权限的操作授权出去。

还有一个事儿：**插件卸载了，第三方授权可能还在。** 你得去 ChatGPT 设置或者第三方账号管理页面单独断开，不然它还能访问你的数据。

## Hooks 和脚本必须单独审查

插件可以带 Hooks，这东西像「自动化小助手」——但前提是你知道它到底干了什么。启用前逐项过一遍：

- 触发时机；
- 实际命令和解释器；
- 读取/写入路径；
- 网络访问；
- 环境变量；
- 失败是否阻塞任务；
- 更新后 Hook 哈希是否变化。

Codex 碰到非托管 Hook 会弹窗让你确认信任。别为了图省事长期开着绕过信任的参数——那等于把家门钥匙放门垫下面。

## 更新和移除

用不上了就卸掉，保持环境清爽：

```bash
codex plugin remove build-web-apps@openai-api-curated
```

移除 Marketplace：

```bash
codex plugin marketplace remove <marketplace-name>
```

卸完之后别急着关终端，顺手查查这些地方有没有残留：插件缓存、MCP 配置、第三方授权、项目生成文件、用户配置。我遇到过卸载之后 MCP 配置还赖在那儿，新任务莫名其妙报错，找了半天才揪出来。

## 常见失败

### 安装成功但任务不触发

这是我早期最头疼的问题。解法：新开任务（必须的），确认插件 enabled，直接用插件或 Skill 名称显式调用，再看看描述跟任务匹不匹配。有时候就是描述写得太笼统，Codex 不知道怎么路由。

### 插件列表与网上截图不同

别慌，可用项受版本、Marketplace、登录方式、工作区策略一堆因素影响。网上看一万张截图，都不如你自己终端跑 `--available --json` 来得准。

### 插件要求登录但无法完成

检查连接器是否允许当前账号、浏览器回调有没有被拦截、组织管理员策略、OAuth scope 对不对。千万别图方便用共享凭证绕过——坑的是整个团队的安全。

### 安装社区插件后权限过大

果断卸载、撤销第三方授权，检查 Hooks 和配置变更，再从源码和 manifest 重新评估。权限这事，宁可多花十分钟审查，也别事后擦屁股。

## 完成门槛

- [ ] 知道插件来自哪个 Marketplace 和版本/ref。
- [ ] 审查了 manifest、Skills、MCP 和 Hooks。
- [ ] 用只读小任务验证加载。
- [ ] 外部账号使用最小权限。
- [ ] 知道如何移除并撤销授权。

## 下一步

需要并行处理任务的话，接着看 [云任务与 Git worktree 实战](/codex/advanced/cloud-worktrees)。想找场景化的插件推荐，翻翻 [Codex Skill 推荐](/codex/skills/)。

## 事实来源

- [OpenAI：Plugins](https://learn.chatgpt.com/docs/plugins)
- [OpenAI Plugins 仓库](https://github.com/openai/plugins)
