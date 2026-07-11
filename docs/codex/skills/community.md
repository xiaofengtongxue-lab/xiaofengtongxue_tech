---
title: 值得关注的社区 Codex Skill 推荐
description: 按 PPT、社交图文、插画、架构图和学习工作流整理活跃社区 Skill，并说明输出路线、许可证和安装前风险。
---

# 值得关注的社区 Codex Skill 推荐

社区 Skill 能覆盖更细的中文内容和行业场景，但它们不是 OpenAI 官方背书。下面项目基于 2026 年 7 月 11 日公开仓库的用途、活跃度、目录和许可证整理；代码可能随时变化，安装前仍要按 [安全审计流程](/codex/skills/install-audit) 重新检查。

> 普通用户不需要为了 PPT、办公或内容任务先安装社区项目，应优先使用当前应用内置能力；需要外部能力时先阅读 [普通人的 Skill 和 Plugin 入门](/codex/everyday/skills-plugins)。本页面向愿意审查源码和安装过程的读者。

## 先看一个导航型仓库

### ComposioHQ/awesome-codex-skills

[GitHub 仓库](https://github.com/ComposioHQ/awesome-codex-skills)

用途：按开发、协作、写作、数据和工具分类的社区索引，也包含仓库内 Skill。

适合：发现候选工作流和比较目录结构。

注意：索引中的外部项目来自不同维护者；“被收录”不等于安全审计。部分连接能力需要 Composio 账号和外部授权。

## PPT 与演示

### ningzimu/codex-ppt-skill

[GitHub 仓库](https://github.com/ningzimu/codex-ppt-skill)

定位：使用图像生成路线制作视觉型 PowerPoint。

适合：概念提案、视觉叙事、整页设计感优先的 deck。

注意：图片型页面的文字、图表和形状不一定像原生 PPT 那样易编辑；数据和文字修改成本较高。仓库使用 MIT License，但生成素材仍要单独处理版权和服务条款。

### ningzimu/image-to-editable-ppt-skill

[GitHub 仓库](https://github.com/ningzimu/image-to-editable-ppt-skill)

定位：把幻灯片图片、PDF 或图片型 PPTX 转换为更可编辑的 PowerPoint。

适合：已有视觉稿需要拆解、重组和继续编辑。

注意：OCR、字体、图表和复杂视觉无法保证完全还原；逐页对照和可编辑性抽查必不可少。

### crazyykhllc-bit/CyberPPT

[GitHub 仓库](https://github.com/crazyykhllc-bit/CyberPPT)

定位：高信息密度、可编辑、咨询风格 PPT，强调 SCR 叙事、风格确认和 PPTX QA。

适合：管理层、项目进展和咨询式汇报。

注意：咨询风格不适合所有受众；先确认品牌、字体和页级故事线。仓库为 MIT License。

## 社交图文与公众号

### op7418/guizang-social-card-skill

[GitHub 仓库](https://github.com/op7418/guizang-social-card-skill)

定位：小红书轮播卡片、公众号宽屏与方形封面，使用 HTML → PNG 生产路线，包含多种布局和主题。

适合：需要成组图文和多比例封面的中文内容团队。

注意：仓库使用 AGPL-3.0，并另有商业许可说明；商业项目必须理解许可证影响。安装前检查 Node 依赖、渲染脚本和字体资产。

### helloianneo/ian-xiaohei-illustrations

[GitHub 仓库](https://github.com/helloianneo/ian-xiaohei-illustrations)

定位：中文文章 16:9 白底手绘配图，使用固定“小黑”视觉语言和少量彩色批注。

适合：希望统一正文插图风格的个人创作者。

注意：风格辨识度很高，不适合直接套到所有品牌；先确认输出是否与自身品牌冲突。仓库为 MIT License，并应阅读 NOTICE。

## 技术图与架构表达

### cclank/lanshu-animated-architecture-diagram

[GitHub 仓库](https://github.com/cclank/lanshu-animated-architecture-diagram)

定位：手绘感的动画架构图，包含 scripts、assets、references 和 tests。

适合：技术分享、系统解释和动态演示。

注意：架构事实必须来自真实代码和配置；动画不能掩盖错误调用链。检查 Python 依赖、字体和输出格式。仓库为 MIT License。

## 学习与工作习惯

### DrCatHicks/learning-opportunities

[GitHub 仓库](https://github.com/DrCatHicks/learning-opportunities)

定位：在 AI 辅助编码中主动识别学习机会，而不是只接收最终代码。

适合：希望理解修改、保留成长反馈的开发者和团队。

注意：不要让学习提示打断紧急修复；可按任务显式调用。许可证为 CC BY 4.0，分发和改编时保留署名。

### vibeforge1111/keep-codex-fast

[GitHub 仓库](https://github.com/vibeforge1111/keep-codex-fast)

定位：备份优先地整理本地 Codex 状态，改善性能和可恢复性。

适合：熟悉 Codex 本地目录、需要诊断长期状态膨胀的高级用户。

注意：它会涉及本地 Codex 状态，风险高于内容生成 Skill。先审查每个脚本和备份/恢复路径，在副本上测试，不能把“清理”当通用加速方案。

## 如何选择 PPT Skill

不要按热度选，按交付路线选：

| 目标 | 优先方向 |
| --- | --- |
| 视觉冲击、每页像海报 | 图片型 PPT Skill |
| 领导汇报、数字需要改 | 原生可编辑 PPTX Skill |
| 已有图片/PDF 要继续编辑 | image-to-editable 路线 |
| 团队在线协作 | Google Slides/Canva Plugin |

任何路线都要渲染全页、核对数据和打开真实 PowerPoint。

## 不建议只凭这些信号安装

- 星标很多；
- 视频说“一句话完成”；
- README 有漂亮样例；
- 名称包含 official、pro 或 best；
- 能在另一个 Agent 工具中运行；
- 安装命令很短。

真正重要的是：`SKILL.md`、scripts、依赖、网络、写入路径、许可证、维护者和可复现验证。

## 下一步

选出候选后，按 [第三方 Skill 安装与安全审计](/codex/skills/install-audit) 操作，不要直接运行 README 中的任意安装脚本。
