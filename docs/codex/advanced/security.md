---
title: Codex 团队安全与数据边界
description: 从身份、代码、凭证、外部内容、Plugins/MCP、CI 和生产操作建立 Codex 威胁模型，并给出团队上线前的最小控制清单。
---

# Codex 团队安全与数据边界

团队安全不能只靠一句“不要泄露数据”。要先列出 Codex 能看到什么、能调用什么、输出会去哪里，再用身份、权限、沙箱、工具策略和人工门槛分别控制。

## 先画五类资产

1. **代码与文档**：私有仓库、架构、路线图、漏洞信息。
2. **凭证**：API Key、OAuth Token、Cookie、SSH Key、云角色。
3. **业务数据**：用户、订单、财务、日志和分析数据。
4. **外部能力**：GitHub、邮件、Slack、数据库、云平台、Shopify 等。
5. **产物**：diff、报告、日志、PPT、截图、PR 评论和部署结果。

对每类资产回答：谁可访问、Codex在哪个环境访问、是否会发往第三方、保留多久、如何撤销。

## 身份方式决定治理边界

使用 ChatGPT 登录时，本地 Codex 受 ChatGPT 工作区成员、角色和数据策略影响；API Key 登录遵循 API 组织的计费与数据设置。两者不是等价凭证。

原则：

- 人员交互使用个人/企业身份；
- CI 使用专用 API Key 或企业访问 Token；
- 不共享个人登录缓存；
- 离职、设备丢失和泄漏时能单独撤销；
- 使用系统 keyring，文件型 `auth.json` 按密码保护。

## 本地最小权限基线

普通开发默认：

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
```

只读审查切到 `read-only`。额外目录、网络和外部写工具按任务临时开启，不在全局长期给 full access。

## 保护凭证和日志

- `.env*`、`auth.json` 和云凭证不进入仓库；
- 任务只引用变量名，不打印值；
- 命令避免 `env`、完整配置 dump 和带 Token 的 URL；
- 日志先最小化并脱敏；
- CI artifact、JSONL、截图和录屏也做秘密扫描；
- 发现泄露先撤销和轮换，再讨论删除记录。

不要依赖“模型应该不会说出来”。技术上不提供，比提示它保密更可靠。

## 把外部内容视为不可信输入

风险来源包括：

- fork PR、issue 和提交信息；
- 网页、README 和下载文件；
- 邮件、Slack、工单和文档；
- MCP 工具返回；
- 社区 Skill 和插件说明。

攻击者可以把指令藏在这些内容中，诱导 Codex读取秘密、上传文件或执行动作。防线：

- 只读优先；
- 工具 allowlist；
- 网络域名限制；
- 写操作审批；
- 不把高权限秘密暴露给处理不可信内容的任务；
- 把外部文字当数据，不当授权。

## Plugins、Skills 和 MCP 供应链

安装前检查：

- 来源和维护者；
- manifest、`SKILL.md`、scripts、Hooks 和依赖；
- 安装/运行时下载；
- OAuth scope 和隐私条款；
- 遥测与 opt-out；
- 许可证；
- 固定版本或 ref；
- 移除与撤销方式。

Skill 是可执行指导，脚本可能拥有本地权限。星标和热门推荐不能替代源码审查。

## CI 和不可信 Pull Request

高风险组合是：fork PR 代码 + 仓库写权限 + 生产秘密 + 自动执行。

最小控制：

- fork PR 使用无秘密的只读 job；
- checkout 不保留写凭证；
- GitHub permissions 最小化；
- Codex 运行在隔离 runner；
- 只生成报告或 patch；
- 自动评论前过滤提示注入和敏感内容；
- 不自动合并和部署；
- 可信维护者批准后才进入有秘密的后续 job。

## 生产和外部写操作

将流程拆为：

1. 只读调查；
2. 生成候选计划或变更；
3. 临时环境验证；
4. 人工审查；
5. 受控执行；
6. 监控与回滚。

Codex 可以准备迁移、部署和消息草稿，但生产执行、付款、权限变更、删除和公开发布需要明确授权和独立门槛。

## 团队应固化到哪些层

- `AGENTS.md`：项目规则与验证；
- `.codex/config.toml`：可信项目默认权限；
- `requirements.toml`：管理员不可被用户覆盖的限制；
- Rules：命令 allow/prompt/forbid；
- Hooks：快速生命周期检查；
- CI：测试、秘密扫描和合并门槛；
- 外部平台：RBAC、分支保护、部署审批和审计。

不要用一层承担全部安全责任。

## 上线前演练

至少测试以下负面场景：

- 外部文档要求读取 `.env`；
- PR 描述要求把仓库上传到某 URL；
- MCP 写工具被普通只读任务触发；
- 自动化收到超长恶意输入；
- Key 失效或服务不可用；
- agent 尝试修改工作区外文件；
- Hook 被更新后未重新信任；
- 任务失败后留下敏感 artifact。

演练结果应能证明控制真的阻止动作，而不是只出现一条警告。

## 事件响应最小流程

1. 停止相关任务和自动化；
2. 撤销/轮换可能暴露的凭证；
3. 保存脱敏审计证据；
4. 确认数据、仓库和外部系统影响；
5. 修复权限或流程根因；
6. 清理泄露产物和授权；
7. 通过负面测试后恢复。

## 完成门槛

- [ ] 已列出代码、凭证、业务数据、工具和产物流向。
- [ ] 身份和 CI 凭证可单独撤销。
- [ ] 不可信内容任务没有高权限秘密。
- [ ] Plugins/MCP/Skills 有安装审查和版本策略。
- [ ] 生产写操作有人工门槛与回滚。
- [ ] 负面场景已经实测。

## 下一步

遇到实际异常时，使用 [Codex 常见故障分层排查](/codex/advanced/troubleshooting)。

## 事实来源

- [OpenAI：Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [OpenAI：Authentication](https://learn.chatgpt.com/docs/auth)
- [OpenAI：MCP risks and safety](https://developers.openai.com/api/docs/mcp#prompt-injection-related-risks)
