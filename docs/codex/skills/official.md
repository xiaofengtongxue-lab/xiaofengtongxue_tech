---
title: Codex 官方与高价值 Skill、Plugin 推荐
description: 按办公文件、开发、浏览器、设计、数据、电商和视频场景整理 OpenAI 内置能力与官方精选 Plugins，并给出安装和使用边界。
---

# Codex 官方与高价值 Skill、Plugin 推荐

本页优先推荐 OpenAI 内置能力和官方 Marketplace/Plugins 仓库中的能力。可用列表会随版本、登录方式、套餐和工作区策略变化，以下内容核验于 2026 年 7 月 11 日，安装前以你本机列表为准。

## 先查看本机可用项

```bash
codex plugin marketplace list
codex plugin list --available --json
```

在任务里使用 `/skills` 或 `$` 查看 Skill。不要根据文章中的旧名称直接安装。

## 第一组：每个 Codex 用户都值得了解

### OpenAI Docs

用途：查询 OpenAI API、Codex、模型和当前官方行为。写 OpenAI/Codex 教程、排查参数或升级模型时优先使用。

边界：只解决 OpenAI 官方事实，不替代其他框架和业务系统资料。

### Skill Creator

用途：把已经跑通的重复工作整理为 Skill，帮助设计触发描述、目录、资源和验证。

边界：先有真实流程再创建，不要把一段临时提示词包装成 Skill。

### Skill Installer

用途：安装精选 Skill 或指定 GitHub 路径。

边界：安装器不等于安全背书，第三方源码和脚本仍要审计。

### Plugin Creator

用途：把 Skills、MCP/App、Hooks 和素材打包成可安装 Plugin。

边界：单一仓库流程先用 Skill，确实需要分发或连接器再做 Plugin。

### ImageGen

用途：生成和编辑 UI 资产、插图、背景、概念图、Sprite 和透明素材。

边界：品牌、商品、人物和版权要单独核验；生成图不能替代真实产品证据。

## 第二组：文件与办公交付

在 OpenAI primary runtime 中常见：

| 能力 | 适合任务 | 必做验证 |
| --- | --- | --- |
| Documents | DOCX 创建、编辑、批注、红线 | 逐页渲染、样式和分页 |
| Presentations | PPTX/Slides 创建与修改 | 全页渲染、数据、可编辑性 |
| Spreadsheets | XLSX/CSV 分析和生成 | 公式重算、抽样核对 |
| PDF | PDF 读取、生成、比较、OCR | 逐页渲染、文本层和链接 |
| Template Creator | 从已有模板提炼可复用工作流 | 用真实样例回归模板 |

这些能力非常适合 [PPT 实战](/codex/practice/ppt) 和 [办公文件实战](/codex/practice/documents-spreadsheets-pdf)。

## 第三组：浏览器、桌面和可视化

| Plugin | 适合任务 | 使用建议 |
| --- | --- | --- |
| Browser | 控制应用内浏览器、验证本地网站 | 读取优先，操作前观察页面状态 |
| Chrome | 使用用户 Chrome 已登录状态和扩展 | 只在确实需要现有 Chrome 会话时使用 |
| Computer Use | 操作本地桌面应用 | 付款、发送、删除和权限变更前人工确认 |
| Visualize | 图表、交互式比较和模拟器 | 数据口径与导出结果另行核对 |
| Record & Replay | 把演示过的稳定流程转成 Skill | 先在测试数据上录制和回放 |

浏览器与桌面工具能看到的内容可能包含账号和私有数据，任务中明确允许的站点、窗口和动作。

## 第四组：Web 与应用开发

### Build Web Apps

包含前端构建、浏览器测试、React、shadcn、Stripe、Supabase 等工作流。适合从原型到可验证前端，不适合未经审查直接接生产付款和数据库。

示例安装（名称以列表为准）：

```bash
codex plugin add build-web-apps@openai-api-curated
```

### Game Studio

适合 2D/3D 浏览器游戏、玩法循环、资产管线和 playtest。先做一个可玩的核心循环，再增加内容。

### Figma

适合读取/生成 Figma 设计、设计到代码、Code Connect、设计系统和 Slides。需要 Figma 授权，注意文件和团队权限。

### Expo / iOS / macOS / Android

分别覆盖 React Native、SwiftUI/AppKit 和移动端测试。只安装与你真实技术栈对应的插件。

## 第五组：工程协作与质量

| Plugin/Skill | 适合任务 |
| --- | --- |
| GitHub | PR、issue、代码和仓库工作流 |
| Linear | issue、项目和团队协作 |
| Sentry | 从错误堆栈定位本地代码 |
| CircleCI | CI 状态和失败排查 |
| CodeRabbit | 代码审查工作流 |
| Codex Security | 在授权仓库中做安全扫描与复核 |
| Cloudflare/Vercel/Netlify/Render | 预览和部署工作流 |

连接仓库或错误平台时使用最小 scope。安全扫描结果需要真实复现和人工确认，不能自动当漏洞事实。

## 第六组：内容、设计与视频

### Canva

包含品牌演示、社交尺寸变体和翻译设计。适合在线协作和模板，但修改/分享设计属于外部写操作。

### Google Drive

统一访问 Drive、Docs、Sheets 和 Slides。适合把来源文件变成交付文件；连接账号后限定文件夹和写入范围。

### Remotion

用 React 程序化制作视频、字幕、音频、动画、图表和转场。适合批量、模板化和可复现视频。

### HeyGen

数字人和个性化视频。肖像、声音和身份必须有明确授权。

### Fal

图像、视频、音频、3D 和编辑模型工作流。使用前确认模型、价格、输入数据和第三方保留政策。

### Hyperframes

适合教学和演示视频工作流。先确认输出、依赖和素材授权。

## 第七组：电商与市场

### Shopify

官方 Shopify 开发工作流，覆盖 GraphQL、Liquid、Hydrogen、Functions、UI extensions 和 CLI。适合开发店铺与应用，不等同于自动运营生产店铺。

### Particl Market Research

提供电商公司、产品、趋势、素材和销售时间序列等结构化市场数据，需要 Particl 账号和授权。

### Semrush / Similarweb / Brand24

用于 SEO、流量、受众和品牌监测。数据定义、地区、时间范围和订阅权限必须写进报告。

### OpenAI Ads Conversions

指导 Measurement Pixel 和 Conversions API 埋点。涉及隐私、同意、去重、归因和秘密管理，发布前需法务/数据负责人确认。

## 第八组：知识与研究

Notion、Google Drive、Zotero、Glean、Box、SharePoint 等适合知识检索、会议和报告。原则是：

- 只连接任务需要的来源；
- 引用真实页面；
- 不把私有知识库内容复制到公开产物；
- 写操作先生成草稿；
- 撤销 Plugin 不忘撤销第三方授权。

## 不要全部安装

按一个月内真实使用频率选择 5-10 个高价值能力。每新增一个：

1. 先说明任务和替代方案；
2. 审查权限和数据流；
3. 在测试数据上验证；
4. 记录安装来源和版本；
5. 不再使用时停用或卸载。

## 相关内容

- [第三方 Skill 安装与安全审计](/codex/skills/install-audit)
- [从零创建自己的 Skill](/codex/skills/create)

## 事实来源

- [OpenAI Plugins 仓库](https://github.com/openai/plugins)
- [OpenAI Skills 文档](https://learn.chatgpt.com/docs/build-skills)
