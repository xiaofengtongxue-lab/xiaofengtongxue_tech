---
title: Codex Plugins 安装与管理实战
description: 分清 Plugin、Skill 与 MCP，查看 Marketplace、安装官方或团队插件、完成认证和权限检查，并在新任务中验证插件是否真正可用。
---

# Codex Plugins 安装与管理实战

Plugin 是可安装的能力包，可以同时包含 Skills、MCP 应用、连接器、Hooks、素材和定时任务模板。它适合分发完整工作流；如果只需要一份可复用操作说明，单独 Skill 更轻。

## 先分清三个概念

| 能力 | 主要解决什么 | 典型内容 |
| --- | --- | --- |
| Skill | 让 Codex 按固定方法做一类任务 | `SKILL.md`、模板、脚本、参考资料 |
| MCP/App | 访问实时外部数据或执行工具 | 搜索文档、读取 Figma、操作服务 |
| Plugin | 安装和分发完整能力包 | Skills + MCP/App + Hooks + 资产 |

不要为了一个十行团队检查表就构建插件，也不要用纯 Skill 假装拥有真实外部系统访问权。

## 查看当前 Marketplace

```bash
codex plugin marketplace list
```

查看已安装插件：

```bash
codex plugin list
```

查看可安装项和完整 ID：

```bash
codex plugin list --available --json
```

安装命令中的 Marketplace 名称必须以你的列表为准。不同版本、套餐和组织可能拥有不同来源。

## 安装一个可用插件

假设列表返回：

```text
build-web-apps@openai-api-curated
```

安装：

```bash
codex plugin add build-web-apps@openai-api-curated
```

再次检查：

```bash
codex plugin list
```

安装或更新后新开任务。旧任务不一定会重新加载新技能和工具。

## 添加团队或开源 Marketplace

确认仓库来源和内容后：

```bash
codex plugin marketplace add owner/repo --ref main
```

也可以使用本地路径或 Git URL。添加前审查：

- Marketplace 清单指向哪些插件；
- 插件 manifest、Skills、MCP 配置和 Hooks；
- 脚本是否下载或执行外部内容；
- 需要哪些账号和 OAuth scope；
- 许可证、维护状态和升级方式。

刷新 Git Marketplace：

```bash
codex plugin marketplace upgrade <marketplace-name>
```

不要默认自动追踪主分支用于生产环境。团队使用时固定经过审查的 ref 或版本更稳妥。

## 安装后做能力验收

以 Web 应用插件为例，新任务中先问：

```text
列出 build-web-apps 插件提供的可用 Skills、工具和外部依赖。只报告，不修改项目，也不要开始认证。
```

再执行一个只读小任务：

```text
使用该插件检查当前前端项目的构建入口和浏览器验证方式。不要编辑文件，不要访问需要登录的服务。
```

验收重点：

- 插件是否实际被加载；
- 触发的是哪个 Skill 或工具；
- 是否要求不必要的认证；
- 是否把数据发送到第三方；
- 写操作是否触发审批；
- 失败时能否清楚说明缺少什么。

## 外部连接器的权限边界

安装插件、连接账号和执行动作是三个不同阶段。

例如 Google Drive 插件可能访问 Drive、Docs、Sheets 和 Slides。连接时使用最小账号与权限；任务中明确是读取、创建草稿还是修改现有文件。未经授权不要分享、发送或改变访问权限。

插件卸载后，第三方连接器可能仍保持授权，需要在 ChatGPT 或第三方账号设置中单独断开。

## Hooks 和脚本必须单独审查

插件可以携带 Hooks。启用前检查：

- 触发时机；
- 实际命令和解释器；
- 读取/写入路径；
- 网络访问；
- 环境变量；
- 失败是否阻塞任务；
- 更新后 Hook 哈希是否变化。

Codex 会要求信任非托管 Hook 的当前定义。不要为了消除提示长期使用绕过信任参数。

## 更新和移除

移除插件：

```bash
codex plugin remove build-web-apps@openai-api-curated
```

移除 Marketplace：

```bash
codex plugin marketplace remove <marketplace-name>
```

之后检查：插件缓存、MCP 配置、第三方授权、项目生成文件和用户配置是否仍有残留。

## 常见失败

### 安装成功但任务不触发

新开任务，确认插件 enabled；直接用插件或 Skill 名称显式调用；检查描述是否匹配任务。

### 插件列表与网上截图不同

可用项受版本、Marketplace、登录方式和工作区策略影响。以本机 `--available --json` 为准。

### 插件要求登录但无法完成

检查连接器是否允许当前账号、浏览器回调、组织管理员策略和 OAuth scope。不要改用共享凭证绕过。

### 安装社区插件后权限过大

卸载、撤销第三方授权，检查 Hooks 和配置变更，再从源码和 manifest 重新评估。

## 完成门槛

- [ ] 知道插件来自哪个 Marketplace 和版本/ref。
- [ ] 审查了 manifest、Skills、MCP 和 Hooks。
- [ ] 用只读小任务验证加载。
- [ ] 外部账号使用最小权限。
- [ ] 知道如何移除并撤销授权。

## 下一步

需要并行处理任务时，继续学习 [云任务与 Git worktree 实战](/codex/advanced/cloud-worktrees)。场景化插件推荐见 [Codex Skill 推荐](/codex/skills/)。

## 事实来源

- [OpenAI：Plugins](https://learn.chatgpt.com/docs/plugins)
- [OpenAI Plugins 仓库](https://github.com/openai/plugins)
