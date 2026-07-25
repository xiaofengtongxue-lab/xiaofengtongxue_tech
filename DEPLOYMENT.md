# 部署与域名切换

## GitHub Pages 教程域名

默认配置：

```text
SITE_URL=https://www.xiaofengtongxue.com
VITEPRESS_BASE=/
```

GitHub Actions 会在 `main` 分支更新后构建并发布 `docs/.vitepress/dist`。GitHub Pages 使用教程域名 `https://tutorial.xiaofengtongxue.com/`，静态资源从域名根路径加载；页面 canonical 仍指向正式主域，避免形成重复内容。

DNS 使用 `tutorial CNAME xiaofengtongxue-lab.github.io`，仓库通过 `docs/public/CNAME` 声明自定义域名。在 GitHub 仓库设置中，将 Pages 的 Source 选择为 `GitHub Actions`，Custom domain 设置为 `tutorial.xiaofengtongxue.com`，证书签发后启用 Enforce HTTPS。

GitHub Pages 的 `robots.txt`、`llms.txt` 和静态资源均位于域名根路径。sitemap、canonical 和结构化数据继续使用正式主域 `https://www.xiaofengtongxue.com/`。

## 本地模拟 GitHub Pages

```bash
npm run docs:build
npm run docs:check
npm run docs:preview
```

## 正式服务器域名

当前规范主域名为：

```text
https://www.xiaofengtongxue.com/
```

`http://xiaofengtongxue.com/`、`https://xiaofengtongxue.com/` 和 `http://www.xiaofengtongxue.com/` 均使用 `301` 跳转到对应的 `https://www.xiaofengtongxue.com/` 路径。证书 `programmer-xiaofeng-blog-xiaofengtongxue` 同时覆盖裸域名与 www 域名。

使用服务器根路径构建：

```bash
SITE_URL=https://www.xiaofengtongxue.com VITEPRESS_BASE=/ npm run docs:build
SITE_URL=https://www.xiaofengtongxue.com VITEPRESS_BASE=/ npm run docs:check
```

Nginx 配置保存在 `deploy/nginx/programmer-xiaofeng-blog.conf`。服务器使用版本化发布目录：

```text
/var/www/programmer-xiaofeng-blog/releases/
/var/www/programmer-xiaofeng-blog/current
```

`current` 是指向当前发布版本的软链接。正式域名构建时，需要同步检查 Nginx 的 `server_name`、证书域名、canonical、sitemap、`robots.txt` 和 `llms.txt`。IP 地址继续保留 HTTP 访问用于应急排查。

## 一键发布到 GitHub 与服务器

自动化脚本会按同一个 Git 提交完成以下流程：

1. 检查当前分支、未提交修改和未跟踪的站点文件。
2. 分别构建并验证 GitHub Pages 与正式域名产物。
3. 推送 `main`，等待 GitHub Actions 完成 Pages 发布。
4. 将正式产物上传到新的版本目录，原子切换 `current` 软链接。
5. 检查首页、Codex、AI Agent、静态资源、sitemap、robots 和域名跳转。
6. 正式站验收失败时，自动切回上一个服务器版本。

首次使用前确认 GitHub CLI 已登录：

```bash
gh auth status
```

推荐先把本机 SSH 公钥添加到服务器，然后直接运行：

```bash
npm run deploy
```

没有配置 SSH Key 时，可以临时通过环境变量提供密码。脚本只把密码交给 `sshpass`，不会打印或写入仓库：

```bash
read -s DEPLOY_PASSWORD
export DEPLOY_PASSWORD
npm run deploy
unset DEPLOY_PASSWORD
```

只验证构建和发布包、不改变 GitHub 与服务器：

```bash
npm run deploy -- --dry-run
```

单独检查正式站：

```bash
npm run deploy:verify
```

常用环境变量：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DEPLOY_HOST` | `43.138.176.186` | 服务器地址 |
| `DEPLOY_USER` | `ubuntu` | SSH 用户 |
| `DEPLOY_ROOT` | `/var/www/programmer-xiaofeng-blog` | 版本目录与 `current` 所在目录 |
| `DEPLOY_SSH_KEY` | 空 | 指定 SSH 私钥路径 |
| `DEPLOY_PASSWORD` | 空 | 未配置 SSH Key 时的临时密码 |
| `DEPLOY_GIT_REMOTE` | `origin` | 需要推送的 Git 远程仓库 |
| `DEPLOY_BRANCH` | `main` | 允许发布的分支 |
| `DEPLOY_GITHUB_WORKFLOW` | `deploy.yml` | GitHub Pages 工作流文件名 |
| `DEPLOY_WAIT_GITHUB` | `1` | 是否等待并验收 GitHub Pages |
| `GITHUB_PAGES_TARGET` | `https://tutorial.xiaofengtongxue.com` | GitHub Pages 线上验收地址 |
| `GITHUB_PAGES_BASE` | `/` | GitHub Pages 静态资源基础路径 |

脚本要求当前分支为 `main`，且所有会参与构建的修改都已提交。它不会自动暂存或提交文件，也不会删除旧版本目录。

## 搜索平台验证

站点支持在构建时注入 Google 和百度的验证 Meta。验证值由平台后台生成，不要把真实值直接写入仓库：

```bash
GOOGLE_SITE_VERIFICATION=<google-verification-value> \
BAIDU_SITE_VERIFICATION=<baidu-verification-value> \
SITE_URL=https://www.xiaofengtongxue.com \
VITEPRESS_BASE=/ \
npm run docs:build
```

GitHub Pages 镜像可以在仓库 Secrets 中设置同名变量。正式服务器构建完成后，应重新抓取首页，确认验证 Meta、canonical 和静态资源路径同时正确。

## 百度链接提交

先完成正式域名构建，再预览准备提交的 URL 数量：

```bash
npm run seo:submit:baidu
```

确认百度搜索资源平台中的站点与主域一致后，使用环境变量提交：

```bash
BAIDU_SITE=https://www.xiaofengtongxue.com \
BAIDU_PUSH_TOKEN=<baidu-push-token> \
npm run seo:submit:baidu -- --submit
```

脚本不会打印 Token。没有 `--submit` 时只读取本地 sitemap，不会向百度发送请求。

## 兼容域名

`xinge.ac.cn` 与 `www.xinge.ac.cn` 仅作为历史兼容域名使用。两个域名的 HTTP/HTTPS 请求都应使用 `301` 跳转到 `https://www.xiaofengtongxue.com`，并保留原始路径和查询参数。页面、sitemap、robots、llms 和结构化数据不得继续把 xinge 域名声明为 canonical。

不要改变已发布文章的路径，只切换域名和站点根路径。
