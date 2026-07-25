---
title: ChatGPT 与 Codex 官方及高价值 Skill、Plugin 推荐
description: 面向普通用户和开发者，按办公文件、开发、浏览器、设计、数据、电商和视频场景整理内置能力与官方精选 Plugins，并给出使用边界。
---

# ChatGPT 与 Codex 官方及高价值 Skill、Plugin 推荐

嘿，朋友！如果你正在琢磨 ChatGPT 和 Codex 到底该装哪些 Skill 和 Plugin，那咱俩想到一块去了。我刚接触这块的时候，一口气装了二十几个，结果每次打开都卡得不行，好多根本没用过。后来学乖了，先搞清楚哪些是真正高频的，哪些只是看着炫。这篇文章就是我把踩过的坑整理出来，咱们按场景聊聊。

下面的列表核验于 2026 年 7 月 11 日。可用项会随着版本、登录方式、套餐和工作区策略变来变去，安装前还是以你本机实际显示的为准。

## 先看看你本机有哪些

如果你是普通用户，打开 ChatGPT 桌面应用，直接在 Skills 或 Plugins 列表里翻就行，输入框里也能选。ChatGPT / Work 一般用 `@` 选 Plugin，Codex 用 `$` 选 Skill——界面上会标得很清楚，照着点就行。

下面这两条命令是给开发者用的，普通用户可以跳过：

```bash
codex plugin marketplace list
codex plugin list --available --json
```

一个小提醒：别看到文章里写了个名字就直接装。那东西可能改名了，也可能下架了。建议先翻翻 [Skill 和 Plugin 入门](/codex/everyday/skills-plugins)，心里有个底。

## 第一组：每个 Codex 用户都值得了解

这几个是我觉得最基础、装了不亏的。

### OpenAI Docs

用途：查 OpenAI API、Codex、模型和官方最新行为。我写教程、排查参数或者想升级模型的时候，第一个就找它。

边界：它只管 OpenAI 官方的事，别的框架和业务系统的资料你得另找。

### Skill Creator

用途：把你已经跑通的重复工作打包成 Skill。它会帮你设计触发描述、目录结构、资源和验证方式。

边界：先有真实流程再创建。我犯过一个错——把一段临时的提示词包装成 Skill，结果每次触发都跑偏，还得回头改。

### Skill Installer

用途：安装精选 Skill，或者直接从 GitHub 路径拉。

边界：能装不等于安全。第三方源码和脚本还是得自己看一眼，别闭着眼睛装。

### Plugin Creator

用途：把 Skills、MCP/App、Hooks 还有素材打包成可安装的 Plugin。

边界：单个仓库的流程先用 Skill 就够了，真需要跨项目分发或者做连接器的时候再考虑 Plugin。

### ImageGen

用途：生成和编辑 UI 素材、插图、背景、概念图、Sprite 和透明图。

边界：涉及品牌、商品、人物的图要单独核验版权。另外别拿生成图当真实产品截图用，这个坑我也踩过。

好了，上面这些是打底的。接下来咱们按场景分组看。

## 第二组：文件与办公交付

在 OpenAI primary runtime 里常见的能力，我列了个表，一眼扫过去就知道哪个适合你：

| 能力 | 适合任务 | 必做验证 |
| --- | --- | --- |
| Documents | DOCX 创建、编辑、批注、红线 | 逐页渲染、样式和分页 |
| Presentations | PPTX/Slides 创建与修改 | 全页渲染、数据、可编辑性 |
| Spreadsheets | XLSX/CSV 分析和生成 | 公式重算、抽样核对 |
| PDF | PDF 读取、生成、比较、OCR | 逐页渲染、文本层和链接 |
| Template Creator | 从已有模板提炼可复用工作流 | 用真实样例回归模板 |

说真的，用这些能力做 PPT 和办公文件特别顺。我之前帮朋友批量生成周报模板，就是靠 Template Creator + Documents 联动的。感兴趣可以看看这两个实战：[PPT 实战](/codex/practice/ppt) 和 [办公文件实战](/codex/practice/documents-spreadsheets-pdf)。

## 第三组：浏览器、桌面和可视化

这一组跟「看得见」的东西打交道，表格走起：

| Plugin | 适合任务 | 使用建议 |
| --- | --- | --- |
| Browser | 控制应用内浏览器、验证本地网站 | 读取优先，操作前观察页面状态 |
| Chrome | 使用用户 Chrome 已登录状态和扩展 | 只在确实需要现有 Chrome 会话时使用 |
| Computer Use | 操作本地桌面应用 | 付款、发送、删除和权限变更前人工确认 |
| Visualize | 图表、交互式比较和模拟器 | 数据口径与导出结果另行核对 |
| Record & Replay | 把演示过的稳定流程转成 Skill | 先在测试数据上录制和回放 |

我以前用 Computer Use 的时候图省事，没设确认步骤，结果差点把测试数据发到客户群里。从那以后，凡是涉及「发送」和「删除」的，我一定加人工确认。浏览器和桌面工具能看到的内容可能包含账号和私有数据，任务里明确允许的站点、窗口和动作才给它碰。

## 第四组：Web 与应用开发

这一块是我日常打交道最多的。

### Build Web Apps

覆盖前端构建、浏览器测试、React、shadcn、Stripe、Supabase 等工作流。做原型和可验证的前端特别快。但涉及生产环境的付款和数据库，还是自己审一遍再上线。

安装示例（名称以列表为准）：

```bash
codex plugin add build-web-apps@openai-api-curated
```

### Game Studio

适合 2D/3D 浏览器游戏、玩法循环、资产管线和 playtest。我的经验是先做一个可玩的最小核心循环，确认手感对了再加内容，不然容易越做越散。

### Figma

读取/生成 Figma 设计、设计到代码、Code Connect、设计系统和 Slides。需要 Figma 授权，注意文件和团队权限——有一次我忘了设权限，把内部设计稿暴露了，教训深刻。

### Expo / iOS / macOS / Android

分别覆盖 React Native、SwiftUI/AppKit 和移动端测试。别全装，只装跟你技术栈对得上那几个就行。

说到协作和部署，下面这组插件也是日常高频。

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

连接仓库或错误平台的时候，授权 scope 给到最小就够。安全扫描结果也别直接当漏洞事实，真实复现一遍再下结论。

## 第六组：内容、设计与视频

### Canva

品牌演示、社交尺寸变体和翻译设计都能搞。在线协作和模板用起来很舒服，但修改和分享设计属于外部写操作，注意范围。

### Google Drive

统一访问 Drive、Docs、Sheets 和 Slides。很适合把来源文件变成交付文件。连接账号后限定文件夹和写入范围，别给全局权限。

### Remotion

用 React 程序化做视频——字幕、音频、动画、图表、转场全包。适合批量、模板化、需要复现的视频。我做过一个自动化周报视频流的 Demo，效果超出预期。

### HeyGen

数字人和个性化视频。肖像、声音和身份必须有明确授权，这个是红线。

### Fal

图像、视频、音频、3D 和编辑模型工作流。用之前确认模型、价格、输入数据和第三方保留政策，别等到账单来了才慌。

### Hyperframes

教学和演示视频工作流，先确认输出、依赖和素材授权再开工。

## 第七组：电商与市场

### Shopify

官方 Shopify 开发工作流，覆盖 GraphQL、Liquid、Hydrogen、Functions、UI extensions 和 CLI。适合开发店铺和应用，别当自动化运营工具用。

### Particl Market Research

提供电商公司、产品、趋势、素材和销售时间序列等结构化市场数据，需要 Particl 账号和授权。

### Semrush / Similarweb / Brand24

SEO、流量、受众和品牌监测。数据定义、地区、时间范围和订阅权限一定要写进报告里，不然过两个月自己都忘了数据怎么来的。

### OpenAI Ads Conversions

指导 Measurement Pixel 和 Conversions API 埋点。涉及隐私、同意、去重、归因和密钥管理，发布前让法务或数据负责人确认。

## 第八组：知识与研究

Notion、Google Drive、Zotero、Glean、Box、SharePoint 这些适合知识检索、会议和报告。用的时候我给自己定了几个原则，分享给你：

- 只连接任务需要的来源；
- 引用真实页面；
- 别把私有知识库内容复制到公开产物；
- 写操作先生成草稿；
- 撤销 Plugin 的时候别忘了把第三方授权也撤了。

## 别一口气全装上

这条是我用血泪换来的经验。一个月内真实用到的，挑 5-10 个高价值的就够了。每新增一个，走一遍这个流程：

1. 先说明任务和替代方案；
2. 审查权限和数据流；
3. 在测试数据上验证；
4. 记录安装来源和版本；
5. 不用了就停用或卸载。

清爽的环境比堆满插件舒服太多了。

## 相关内容

- [第三方 Skill 安装与安全审计](/codex/skills/install-audit)
- [从零创建自己的 Skill](/codex/skills/create)

## 事实来源

- [OpenAI Plugins 仓库](https://github.com/openai/plugins)
- [OpenAI Skills 文档](https://learn.chatgpt.com/docs/build-skills)
