---
publishedRevision: "5b5a98622cd1cf60da3c4bc3c9d2258d973f506e"
title: 值得关注的社区 Codex Skill 推荐
description: 按 PPT、社交图文、插画、架构图和学习工作流整理活跃社区 Skill，并说明输出路线、许可证和安装前风险。
---

# 值得关注的社区 Codex Skill 推荐

嘿，朋友们！这篇文章是我平时收藏的一些社区 Codex Skill，按 PPT、社交图文、插画、架构图还有学习工作流分了类，方便你按需翻牌子。

不过先说句实在话：这些项目都是社区维护者用爱发电的，OpenAI 没有给它们背书。下面整理的是 2026 年 7 月 11 日公开仓库的情况——用途、活跃度、目录结构、许可证这些。代码随时可能变，安装之前一定按[安全审计流程](/codex/skills/install-audit)自己再过一遍。

> 普通用户日常做个 PPT、写个文档、处理点办公任务，大概率用不上这些社区项目——先把你手头工具自带的能利用好再说。想了解 Skill 和 Plugin 到底怎么回事的话，先翻翻[普通人的 Skill 和 Plugin 入门](/codex/everyday/skills-plugins)。本页是写给愿意自己读源码、手动装东西的朋友的。

## 先看一个导航型仓库

我刚开始逛社区 Skill 的时候特别懵，GitHub 上一搜一大堆，根本不知道从哪下手。后来发现了这个——

### ComposioHQ/awesome-codex-skills

[GitHub 仓库](https://github.com/ComposioHQ/awesome-codex-skills)

用途：按开发、协作、写作、数据和工具分好类的社区索引，仓库里自己也带一些 Skill。

适合：想海选候选工作流、对比不同项目的目录结构的时候，拿来当导航地图。

注意：索引里收录的外部项目维护者各不相同，「被收录」跟「通过安全审计」是两码事。另外部分连接能力需要 Composio 账号和外部授权，不是开箱即用的。

## PPT 与演示

PPT 这个品类是我踩坑最多的地方。一开始我天真地以为「一句话生成 PPT」就完事了，结果做出来的东西要么改不动，要么数据对不上，汇报前通宵改稿的滋味不想再尝第二遍。下面这几个各走各的路线，看清楚再上车。

### ningzimu/codex-ppt-skill

[GitHub 仓库](https://github.com/ningzimu/codex-ppt-skill)

定位：走图像生成路线做视觉型 PowerPoint，出来的页面像海报一样。

适合：概念提案、视觉叙事、整页设计感比可编辑性更重要的 deck。

注意：因为是图片型页面，里面的文字、图表、形状不像原生 PPT 那样能直接改，数据和文字想调整就比较费劲。仓库 MIT License，但生成的图片素材，版权和服务条款你得单独操心。

### ningzimu/image-to-editable-ppt-skill

[GitHub 仓库](https://github.com/ningzimu/image-to-editable-ppt-skill)

定位：把幻灯片图片、PDF 或者图片型的 PPTX 转成更好编辑的 PowerPoint。

适合：手里已经有视觉稿，想拆解、重组、继续加工的情况。

注意：OCR、字体、图表、复杂视觉元素不可能百分百还原，逐页对照检查是逃不掉的，可编辑性也得抽查。

### crazyykhllc-bit/CyberPPT

[GitHub 仓库](https://github.com/crazyykhllc-bit/CyberPPT)

定位：高信息密度、可编辑的咨询风格 PPT，主打 SCR 叙事、风格确认和 PPTX QA 这套流程。

适合：给管理层汇报、项目进展、咨询式 presentation。

注意：咨询风格不是万能的，受众不对就容易翻车。先确认品牌调性、字体和页级故事线再动手。MIT License。

## 社交图文与公众号

做社交内容的朋友这个板块可以重点关注。我自己运营公众号和小红书的时候就发现，封面和配图的风格统一太重要了，东拼西凑出来的视觉一眼就露怯。

### op7418/guizang-social-card-skill

[GitHub 仓库](https://github.com/op7418/guizang-social-card-skill)

定位：小红书轮播卡片、公众号宽屏封面和方形封面，HTML → PNG 生产路线，内置多种布局和主题。

适合：需要批量产出成组图文和多比例封面的中文内容团队。

注意：仓库用 AGPL-3.0，同时还有商业许可说明，商业项目一定把许可证影响搞清楚。装之前检查 Node 依赖、渲染脚本和字体资产，别一上来就跑。

### helloianneo/ian-xiaohei-illustrations

[GitHub 仓库](https://github.com/helloianneo/ian-xiaohei-illustrations)

定位：中文文章 16:9 白底手绘配图，固定用「小黑」这个视觉形象，搭配少量彩色批注。

适合：想统一正文插图风格的个人创作者，不用每次都从零画。

注意：辨识度真的很高，也意味着不太容易套到别的品牌上。先拿几张输出看看跟你自己的调性搭不搭。MIT License，记得读一下 NOTICE。

## 技术图与架构表达

### cclank/lanshu-animated-architecture-diagram

[GitHub 仓库](https://github.com/cclank/lanshu-animated-architecture-diagram)

定位：手绘感的动画架构图，包含 scripts、assets、references 和 tests。

适合：技术分享、系统解释、动态演示，能让枯燥的架构活起来。

注意：架构事实必须来自真实代码和配置，动画再好看也不能把错误的调用链给糊弄过去。检查 Python 依赖、字体和输出格式，MIT License。

## 学习与工作习惯

这两个 Skill 跟内容生成关系不大，更多是帮你用好 Codex 本身。说真的，工具用久了怎么保持手感、怎么不让工作区越来越臃肿，都是实际问题。

### DrCatHicks/learning-opportunities

[GitHub 仓库](https://github.com/DrCatHicks/learning-opportunities)

定位：在 AI 辅助编码的时候主动帮你识别学习机会，让你不只是拿到最终代码，还能理解发生了什么。

适合：想真正理解每次修改、保留成长痕迹的开发者和团队。

注意：别让学习提示在紧急修 bug 的时候跳出来捣乱，按任务显式调用就好。许可证 CC BY 4.0，分发和改编记得保留署名。

### vibeforge1111/keep-codex-fast

[GitHub 仓库](https://github.com/vibeforge1111/keep-codex-fast)

定位：备份优先地整理本地 Codex 状态，目标是改善性能和可恢复性。

适合：熟悉 Codex 本地目录结构、需要诊断长期状态膨胀的高级用户。

注意：这个直接操作本地 Codex 状态，风险比内容生成类 Skill 高得多。每个脚本和备份/恢复路径都审查清楚，在副本上先跑，别把「清理」当万能加速药。

## 如何选择 PPT Skill

别按 Star 数选，按你要的交付路线来。我自己的经验是，先想清楚最终要什么东西，再倒推选工具，不然很容易装了用不上。

| 目标 | 优先方向 |
| --- | --- |
| 视觉冲击、每页像海报 | 图片型 PPT Skill |
| 领导汇报、数字需要改 | 原生可编辑 PPTX Skill |
| 已有图片/PDF 要继续编辑 | image-to-editable 路线 |
| 团队在线协作 | Google Slides/Canva Plugin |

不管你走哪条路线，最后一定渲染全页、核对数据、在真实 PowerPoint 里打开看一眼——屏幕上的缩略图和实际投屏效果经常两回事，这个坑我替你踩过了。

## 不建议只凭这些信号安装

这些东西看起来很诱人，但单靠它们做决定就是赌博：

- 星标很多；
- 视频说「一句话完成」；
- README 有漂亮样例；
- 名称包含 official、pro 或 best；
- 能在另一个 Agent 工具中运行；
- 安装命令很短。

真正要看的硬指标：`SKILL.md`、scripts、依赖、网络请求、写入路径、许可证、维护者活跃度、能不能在你自己环境里复现验证。

## 下一步

选出候选之后，照着[第三方 Skill 安装与安全审计](/codex/skills/install-audit)一步步来，千万别直接复制 README 里的安装命令就回车——这个习惯改掉，能省掉无数折腾。
