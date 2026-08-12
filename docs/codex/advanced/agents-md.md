---
title: AGENTS.md 实战：让 Codex 自动遵守项目规则
description: 在全局、仓库和子目录分层编写 AGENTS.md，固化项目边界、验证命令与工作树安全规则，并验证 Codex 实际加载顺序。
breadcrumbs:
  - { name: "Codex 实战教程", path: "/codex/" }
  - { name: "高级能力", path: "/codex/advanced/" }

---

# AGENTS.md 实战：让 Codex 自动遵守项目规则

嘿，朋友们！今天聊一个我最近踩了不少坑才搞明白的东西——`AGENTS.md`。你有没有遇到过这种情况：每次让 Codex 干点活，都得先啰嗦一遍「别动我的工作树」「改完记得跑测试」「这个目录别碰」？说多了自己都烦，更别说有时候忘了提，它就真的给你搞出点意外来。我就因为忘说「别提交代码」，它帮我 `git commit` 了一堆调试日志，那叫一个酸爽。

后来我发现，这些问题其实都能用 `AGENTS.md` 一劳永逸地解决。它本质上是一份 Codex 每次进入工作区都会自动加载的执行约定，你把稳定的规则写进去，就不用每次都当复读机了。

## 什么应该写进去

先说哪些内容适合放进去，这些都是我实践下来觉得长期有用的：

- 项目是干嘛的、仓库边界在哪；
- 哪些目录能碰、哪些不能碰；
- 安装、测试、构建、格式化和预览的具体命令；
- 工作树安全、数据库迁移、凭证处理和发布红线；
- linter/formatter 管不着的代码风格约定；
- 特定子目录才有的局部规则；
- 什么情况下必须先停下来问你。

反过来，这些东西就别往里塞了：

- 只管当前这一次任务的临时要求；
- API Key、账号密码、Cookie 以及任何敏感数据（千万别放！）；
- 大段的框架入门教程，那不是它的职责；
- formatter、lint 或者类型系统已经自动搞定的机械规则；
- 版本号和人员名单这种经常变但没人维护的信息。

一句话总结：`AGENTS.md` 回答的是「在这个仓库里怎么安全干活」，不是「这个技术栈怎么入门」。

## Codex 怎样查找指令

搞清楚加载顺序很重要，不然你写了半天发现没生效，心态容易崩。Codex 每次启动时大概这么走：

1. 先看用户级的 `~/.codex/AGENTS.override.md`，没有的话就看 `~/.codex/AGENTS.md`；
2. 接着从项目根目录一路走到你当前的工作目录；
3. 每一层目录都是优先读 `AGENTS.override.md`，没有才读 `AGENTS.md`；
4. 越靠近当前目录的规则越晚加载，所以能覆盖上层的设定。

注意一个细节：同一目录下有 override 文件时，那个目录的普通 `AGENTS.md` 就不会生效了，二选一。还有，默认所有文件合并后上限是 32 KiB，超了的话 Codex 会截断。所以别写太啰嗦，真有长篇背景资料就拆到子目录去，或者放 README 里。

## 从一个可用的根文件开始

别想一口气写完美，先搞一个能用的版本放在仓库根目录就行。下面这个模板是我在好几个项目里验证过的：

```md
# AGENTS.md

## Project

- This repository is a VitePress documentation site.
- Public pages live under `docs/`.
- Do not publish planning notes or credentials.

## Worktree safety

- Treat existing local changes as active work.
- Do not reset, checkout, restore, or delete unrelated changes.
- Before editing, run `git status --short --branch`.
- After editing, inspect the complete diff.

## Validation

- Run `npm run docs:build` after public page or config changes.
- Run `git diff --check` before handoff.
- For new pages, verify navigation, sidebar, links, and sitemap.

## Boundaries

- Do not commit, push, deploy, or publish unless the user explicitly asks.
- Never write real secrets into examples.
```

这个文件通篇都在讲怎么安全协作，没有半句 VitePress 的教程——这就对了。

## 为子模块增加局部规则

真实项目不可能只有一个根文件搞定所有事。比如说你有一个后端仓库，支付服务需要特殊的测试和校验流程：

```text
repo/
├── AGENTS.md
└── services/
    └── payments/
        └── AGENTS.md
```

`services/payments/AGENTS.md` 可以这么写：

```md
# Payments service rules

- Run `make test-payments` for changes in this directory.
- Preserve idempotency keys and existing webhook signatures.
- Do not run migrations against shared databases.
- Any change to amount, currency, refund, or reconciliation logic requires a regression test.
```

重点来了：从 `services/payments/` 目录启动任务时，Codex 会把根规则和局部规则一起加载，后面加载的局部规则会覆盖前面冲突的部分。我的踩坑经验是，局部文件一定要写清楚是在「补充」根规则还是「替代」某一条，不然 Codex 面对模糊措辞容易做出奇怪的选择。

## 什么时候使用 override

`AGENTS.override.md` 这个机制挺有用的，但也容易给自己挖坑。它适合临时或者明确要替代同层规则的情况，比如数据库迁移窗口期间你需要暂停某些自动检查。

但问题也在这——它是 override，不是 merge，同目录的普通 `AGENTS.md` 就直接被无视了。我自己就干过一件事：临时写了个 override 禁止自动跑测试，结果过了一周完全忘了这回事，还纳闷为什么测试一直没执行。

所以几个建议：

- 文件里写清楚它是干嘛的、什么时候该删掉；
- 要进版本控制的 override 必须团队 review 过；
- 用户级的临时 override（`~/.codex/AGENTS.override.md`）用完立刻删；
- 千万别同时维护两份内容互相打架的完整规则。

## 全局指令只放个人稳定偏好

`~/.codex/AGENTS.md` 这个文件是跨项目的，适合放一些你个人的稳定习惯：

- 默认用什么语言交流；
- 默认先做只读调查再看要不要改东西；
- 工作树安全的个人偏好；
- 你喜欢的验证报告格式。

反过来，别在全局文件里强行规定所有项目都用 npm、所有仓库跑同一套测试——这些应该交给每个项目的 `AGENTS.md` 来定。全局管个人习惯，项目管具体事实，各司其职。

## 验证 Codex 是否真的读到

写完规则别光靠信仰，验证一下它到底有没有生效。我一般这样测：

新开一个只读会话：

```bash
codex --sandbox read-only --ask-for-approval never "列出本次加载的项目指令来源，并按优先级总结会影响当前目录的规则。不要修改文件。"
```

再到子目录里试试：

```bash
codex -C services/payments --sandbox read-only --ask-for-approval never "列出当前生效的测试和安全规则。不要修改文件。"
```

看它的输出能不能同时识别根规则和局部规则，override 有没有按你预期的方式替换掉对应的文件。这个验证花不了两分钟，但能省掉后面无数莫名其妙的问题。

## 让规则可执行而不是口号化

这个坑我踩得尤其深刻。刚开始我写的规则是这样的：

```text
写高质量代码，确保安全和性能。
```

看着挺对，实际上啥用没有——Codex 根本没法执行。后来我改成这样：

```text
- 修改鉴权逻辑时同时测试允许和拒绝路径。
- 新增数据库查询时检查租户过滤和索引使用。
- 公共 API 行为变化必须更新契约测试和迁移说明。
```

一条好规则的特征：你能指着它说出一个具体的动作、一个检查手段、或者一个停下来的条件。模糊的口号留给 PPT，`AGENTS.md` 里就放能落地的东西。

## 常见失败

聊几个我见过（也犯过）的高频翻车场景：

### 文件太长

忍不住把架构背景、技术选型理由全塞进去了。结果就是超过 32 KiB 上限被 Codex 截断，真正重要的规则反而没加载到。把背景介绍放 README 或者正式文档里，`AGENTS.md` 专注影响执行的那部分。

### 命令已经过期

项目迁移了构建工具，但 `AGENTS.md` 里的验证命令还指着旧的脚本跑。规则变更要跟脚本、CI 一起审查，不然一条错误的验证命令比没有命令更危险——它会给你虚假的安全感。

### 上下层冲突

根文件说「所有模块跑 `npm test`」，支付模块说「跑 `make test-payments`」，措辞又不明确是在补充还是替代。Codex 面对这种模糊情况只能猜，猜错就是事故。写清楚局部规则是追加还是覆盖，必要时直接用 override。

### 把安全规则只写在提示词

每次任务开头在提示词里写「别提交代码」「别碰生产配置」，结果某次忘了写就出事了。长期的安全边界应该进 `AGENTS.md`、项目 Rules、Hooks 或者 CI，提示词只管当前这一次任务的额外约束。

## 完成门槛

- [ ] 根文件说明了项目边界、验证和工作树安全。
- [ ] 子模块规则只放局部差异。
- [ ] 没有任何真实凭证和私有数据。
- [ ] 已在根目录和至少一个子目录验证加载结果。
- [ ] 规则能映射到实际命令或决策。

## 下一步

继续学习 [Codex config.toml 配置实战](/codex/advanced/config)，把权限、搜索、MCP 和运行偏好放到正确的配置层。

> 命令核验：本页关键命令已对照 openai/codex 源码与官方文档核验（2026-08-13）。产品行为会随版本变化，以当前官方文档为准。

## 事实来源

- [OpenAI：Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
