# 小枫技术教程

面向开发者的系统化技术教程站，覆盖 AI 编程、大模型、AI Agent、Codex、Java、JavaScript、Go、工程实践与开发工具。

## 站点地址

- GitHub Pages 阶段：`https://xiaofengtongxue-lab.github.io/xiaofengtongxue_tech/`
- 备案后的正式地址：`https://tech.xiaofengtongxue.com/`
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

## 内容结构

```text
docs/
├── ai/             AI 编程方法
├── llm/            大模型技术
├── agents/         AI Agent
├── codex/          Codex 教程
├── java/           Java 与 Spring
├── javascript/     JavaScript 与 TypeScript
├── go/             Go
├── engineering/    软件工程实践
└── tools/          开发工具
```

仓库只保存正式文档、站点配置和部署所需文件。内容规划、选题、素材和草稿在本地知识库中维护。

部署和域名切换步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
