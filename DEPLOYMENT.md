# 部署与域名切换

## GitHub Pages 阶段

默认配置：

```text
SITE_URL=https://xiaofengtongxue-lab.github.io/xiaofengtongxue_tech
VITEPRESS_BASE=/xiaofengtongxue_tech/
```

GitHub Actions 会在 `main` 分支更新后构建并发布 `docs/.vitepress/dist`。

在 GitHub 仓库设置中，将 Pages 的 Source 选择为 `GitHub Actions`。

GitHub Pages 项目站阶段，`robots.txt` 和 `llms.txt` 位于 `/xiaofengtongxue_tech/` 子路径。页面会通过 sitemap 和 `<link rel="alternate">` 暴露对应入口；切换到正式域名后，这两个文件会位于域名根路径。

## 本地模拟 GitHub Pages

```bash
npm run docs:build
npm run docs:preview
```

## 切换正式域名

备案和 DNS 准备完成后：

1. 将 `tech.xiaofengtongxue.com` 的 CNAME 指向 `xiaofengtongxue-lab.github.io`。
2. 在 GitHub Pages 设置中填写 Custom domain：`tech.xiaofengtongxue.com`。
3. 在仓库变量中设置 `SITE_URL=https://tech.xiaofengtongxue.com`。
4. 在仓库变量中设置 `VITEPRESS_BASE=/`。
5. 新增 `docs/public/CNAME`，内容为 `tech.xiaofengtongxue.com`。
6. 将 `docs/public/robots.txt` 和 `docs/public/llms.txt` 中的旧地址替换为正式域名。
7. 重新部署并检查 canonical、静态资源、sitemap 和内部链接。
8. 在搜索平台添加新站点并提交新的 sitemap。

不要改变已发布文章的路径，只切换域名和站点根路径。
