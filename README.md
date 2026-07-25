# 程序员小枫同学

面向开发者与普通工作者的系统化技术教程站，当前首先公开 Codex 教程，并分别提供不依赖编程的日常工作路线和面向开发者的工程路线。

## 站点地址

- 正式地址：`https://www.xiaofengtongxue.com/`
- GitHub Pages 镜像：`https://xiaofengtongxue-lab.github.io/xiaofengtongxue_tech/`
- 兼容跳转域名：`https://www.xinge.ac.cn/`
- CCWS 产品文档：`https://docs.ccws.pro/`

## 本地运行

```bash
npm install
npm run docs:dev
```

默认开发地址为 `http://localhost:5173/xiaofengtongxue_tech/`。

## 构建验证

```bash
npm run docs:build
npm run docs:preview
```

## 自动部署

当前提交同时发布到 GitHub Pages 和正式服务器：

```bash
npm run deploy
```

脚本会等待 GitHub Actions、原子切换服务器版本并执行线上验收。详细环境变量和回退行为见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 当前发布范围

- 首页：`/`
- Codex 教程：`/codex/`

其他栏目暂不参与 VitePress 构建，也不会进入导航、站内搜索和 sitemap；对应源文件继续保留，待内容准备完成后再开放。

## SEO 与 GEO 基础

- 页面自动生成 title、description、canonical、Open Graph、Twitter Card 和 JSON-LD。
- `sitemap.xml` 只收录当前公开页面，`llms.txt` 提供统一实体、权威入口和内容边界。
- IP、公众号和网站名称统一为“程序员小枫同学”。

仓库只保存正式文档、站点配置和部署所需文件。内容规划、选题、素材和草稿在本地知识库中维护。

部署和域名切换步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
