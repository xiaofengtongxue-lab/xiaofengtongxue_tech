# 程序员小枫同学

面向开发者与普通工作者的系统化技术教程站，当前公开 Codex 与 AI Agent 两套完整教程。Codex 分为普通用户和开发者路线；AI Agent 分为零基础导读、实战主线和工程进阶。

## 站点地址

- 正式地址：`https://www.xiaofengtongxue.com/`
- GitHub Pages 教程域名：`https://tutorial.xiaofengtongxue.com/`
- 兼容跳转域名：`https://www.xinge.ac.cn/`
- CCWS 产品文档：`https://docs.ccws.pro/`

## 本地运行

```bash
npm install
npm run docs:dev
```

默认开发地址为 `http://localhost:5173/`。

本地开发直接显示正在编辑的正文，方便持续修改。公开构建不会直接使用当前正文，而是读取每篇文章确认过的 Git 版本。

## 内容定稿

查看当前状态：

```bash
npm run content:status
```

日常提交只用于保存编辑记录。正文确认后，先提交正文，再更新定稿指针：

```bash
npm run content:approve -- docs/path/to/article.md
```

命令只修改文章 frontmatter 中的 `publishedRevision`，不会自动提交。没有定稿指针的页面在线上显示“文章正在拼命赶稿中”，并且不会进入 sitemap、站内搜索或 `llms.txt`。

仓库如果公开，草稿源码仍能在 GitHub 中看到，不能把密码、Token、真实密钥或私有资料写进 Markdown。

## 构建验证

```bash
npm run docs:build
npm run docs:check
npm run docs:preview
```

`docs:build` 构建公开定稿；需要检查全部当前编辑内容时，使用 `npm run docs:build:drafts`。

## 自动部署

当前提交同时发布到 GitHub Pages 和正式服务器：

```bash
npm run deploy
```

脚本会等待 GitHub Actions、原子切换服务器版本并执行线上验收。详细环境变量和回退行为见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 当前发布范围

- 首页：`/`
- Codex 教程：`/codex/`
- AI Agent 大白话教程：`/agents/`

其他栏目暂不参与 VitePress 构建，也不会进入导航、站内搜索和 sitemap；对应源文件继续保留，待内容准备完成后再开放。

## SEO 与 GEO 基础

- 页面自动生成 title、description、canonical、Open Graph、Twitter Card 和 JSON-LD。
- `sitemap.xml` 只收录当前公开页面，`llms.txt` 提供统一实体、权威入口和内容边界。
- IP、公众号和网站名称统一为“程序员小枫同学”。

## 开源协议

本仓库采用双协议：

- `docs/` 下的教程正文、插图与图表等原创内容适用 [CC BY-NC-ND 4.0](./LICENSE-CC-BY-NC-ND-4.0.txt)（署名-非商业性使用-禁止演绎）；
- 示例代码、构建脚本与站点配置等其他部分适用 [MIT](./LICENSE)。

转载、引用或使用代码前，请先阅读对应协议的完整条款。

仓库保存教程正文、站点配置和部署所需文件。内容规划、选题、素材和调研笔记仍在本地知识库中维护。

部署和域名切换步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
