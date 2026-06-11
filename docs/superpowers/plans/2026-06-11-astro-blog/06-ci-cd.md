# 子计划 06：CI/CD（GitHub Actions + wrangler.toml）

**子目标：** 建立两个 GitHub Actions workflow（`ci.yml` 全门禁；`deploy.yml` 部署到 Cloudflare Pages）与 `wrangler.toml` 配置文件，本地用 `act` 模拟跑通。

**任务数：** 4

**涉及文件：**
- 创建：`.github/workflows/ci.yml`、`.github/workflows/deploy.yml`、`wrangler.toml`、`.github/ISSUE_TEMPLATE/bug_report.md`、`.github/ISSUE_TEMPLATE/feature_request.md`
- 修改：`.gitignore`（加入 `.wrangler/`）、`README.md`（覆盖）

**前置：** 子计划 05 完成

**完成标志：**
- YAML 语法正确（`actionlint` 通过）
- `wrangler.toml` 字段填写正确
- `pnpm build` 仍全绿
- README 文档说明如何创建 secrets

---

## Task 6.1：写 `wrangler.toml`

**Files:**
- 创建：`wrangler.toml`
- 修改：`.gitignore`

- [ ] **Step 1：写 `wrangler.toml`**

文件：`wrangler.toml`

```toml
name = "blog-zhangzichuan-cn"
compatibility_date = "2026-06-12"
pages_build_output_dir = "dist"

# Cloudflare Pages 不使用 Workers runtime，compatibility_date 仅用于 Pages Functions 兼容性。
# 本站纯静态，不需要 Functions。

# 注意：域名 blog.zhangzichuan.cn 已在 Cloudflare 托管，
# 在 Pages 控制台 → Custom domains 一次性绑定即可。
```

- [ ] **Step 2：补 `.gitignore` 忽略 wrangler 本地缓存**

修改 `.gitignore` 末尾追加：

```gitignore
# wrangler
.wrangler/
.dev.vars
```

- [ ] **Step 3：跑 build 验证 wrangler 不影响构建**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：与之前一致
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add wrangler.toml .gitignore
git commit -m "chore(cicd): add wrangler.toml for Cloudflare Pages project"
```

---

## Task 6.2：写 `ci.yml`

**Files:**
- 创建：`.github/workflows/ci.yml`

- [ ] **Step 1：写 `.github/workflows/ci.yml`**

文件：`.github/workflows/ci.yml`

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        # m11：pnpm 版本必须传字符串 "9"，不要传整数 9（pnpm/action-setup@v4 内部
        # 会对 version 做语义比较，传数字会被识别为无效或默认到 latest）。
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # B1：构建需要 chromium（rehype-mermaid strategy: 'img'）；CI 与 deploy 都要装
      - name: Install Playwright Chromium
        run: pnpm exec playwright install --with-deps chromium

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Unit tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
          retention-days: 7
          if-no-files-found: error
```

> M12（审计）：deploy 重复 build（不上传 artifact）会浪费约 2–3 分钟，但能保证构建与部署 100% 一致，避免 CI 通过但 deploy 失败、还要调试到底是哪边的问题。本项目是个人博客，成本可接受；不合并 build。

- [ ] **Step 2：本地语法校验（不依赖 act）**

```bash
cd /Users/zhangchao/2026/blog
npx --yes actionlint .github/workflows/ci.yml
# 期望：0 错
```

- [ ] **Step 3：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions workflow for typecheck/lint/test/build"
```

---

## Task 6.3：写 `deploy.yml`

**Files:**
- 创建：`.github/workflows/deploy.yml`

> B4：原计划用 `cloudflare/pages-action@v1`，该 action 已被官方 archive（"Pages 部署请使用 wrangler-action"）。改用 `cloudflare/wrangler-action@v3`，通过 `command: pages deploy dist --project-name=...` 直接调用 wrangler。
> 同步在两个 workflow 中安装 Playwright Chromium（rehype-mermaid SSR 必需）。Step 安装时间约 30s，pnpm 缓存能避免重复下载。

- [ ] **Step 1：写 `.github/workflows/deploy.yml`**

文件：`.github/workflows/deploy.yml`

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # B1：rehype-mermaid strategy: 'img' 在构建时启动 headless chromium 渲染 SVG。
      # 复用 pnpm 已装的 playwright CLI 下载 chromium，--with-deps 会装系统依赖。
      - name: Install Playwright Chromium
        run: pnpm exec playwright install --with-deps chromium

      - name: Build
        run: pnpm build

      # B4：cloudflare/wrangler-action@v3 是当前官方维护的 Cloudflare 部署 action。
      # 之前用的 pages-action@v1 已 archive。
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=blog-zhangzichuan-cn --commit-dirty=true
        env:
          PUBLIC_CF_ANALYTICS_TOKEN: ${{ secrets.CLOUDFLARE_ANALYTICS_TOKEN }}
```

- [ ] **Step 2：本地语法校验**

```bash
cd /Users/zhangchao/2026/blog
npx --yes actionlint .github/workflows/deploy.yml
# 期望：0 错
```

- [ ] **Step 3：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to Cloudflare Pages on main push"
```

---

## Task 6.4：Issue 模板 + README 文档

**Files:**
- 创建：`.github/ISSUE_TEMPLATE/bug_report.md`、`.github/ISSUE_TEMPLATE/feature_request.md`
- 修改：`README.md`（覆盖）

- [ ] **Step 1：写 bug 报告模板**

文件：`.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug report
about: 报告一个 bug
title: '[BUG] '
labels: bug
---

## 复现步骤

1. ...
2. ...

## 期望行为

## 实际行为

## 环境

- 浏览器：
- 设备：
- URL：
```

- [ ] **Step 2：写 feature request 模板**

文件：`.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature request
about: 提出新功能想法
title: '[FEAT] '
labels: enhancement
---

## 背景

## 提议方案

## 备选方案
```

- [ ] **Step 3：写 README.md**

文件：`README.md`

```markdown
# 子川的博客

个人博客，托管在 [blog.zhangzichuan.cn](https://blog.zhangzichuan.cn)。

## 技术栈

- [Astro 5](https://astro.build) — 静态站点生成
- TypeScript strict
- Content Collections（zod 校验）
- [Pagefind](https://pagefind.app) — 全文搜索
- [KaTeX](https://katex.org) — 数学公式
- [Mermaid](https://mermaid.js.org) — 图表
- GitHub Actions + Cloudflare Pages

## 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:4321
```

## 写作

在 `src/content/blog/` 下新增 `.md` 或 `.mdx` 文件，frontmatter 字段见 `src/content.config.ts`：

```yaml
---
title: 标题
description: 简述
pubDatetime: 2026-06-12
tags: [A, B]
category: 技术
draft: false   # 草稿设 true，本地可见、生产排除
math: false    # 含数学公式时设为 true
mermaid: false # 含 mermaid 图时设为 true
---
```

## 部署

push `main` → CI 全绿 → 部署到 Cloudflare Pages。

## 部署所需 GitHub Secrets

| Secret | 用途 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌（Pages: Edit 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics 站点 token |

获取步骤见 [子计划 07](docs/superpowers/plans/2026-06-11-astro-blog/07-cloudflare-and-secrets.md)。

## 脚本

```bash
pnpm dev         # 本地开发
pnpm typecheck   # TypeScript + frontmatter schema
pnpm lint        # ESLint
pnpm format      # Prettier 写入
pnpm format:check
pnpm test        # vitest
pnpm build       # astro check + astro build + pagefind
```

## 备案

苏ICP备18064390号-8（见页脚）。

## 许可

源码以 MIT 协议开源；文章内容版权归作者所有。
```

- [ ] **Step 4：跑门禁**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format && pnpm test && pnpm build
echo "ALL GREEN"
```

- [ ] **Step 5：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git add .github/ISSUE_TEMPLATE/ README.md
git commit -m "docs: README and issue templates"
git tag phase-06-cicd
```

---

## 子计划 06 完成

进入 `07-cloudflare-and-secrets.md` 前确认：

- [ ] `.github/workflows/ci.yml` 语法校验通过
- [ ] `.github/workflows/deploy.yml` 语法校验通过
- [ ] `wrangler.toml` 字段：name=`blog-zhangzichuan-cn`、compatibility_date=2026-06-12、pages_build_output_dir=dist
- [ ] README 写明所需的 3 个 secrets
- [ ] `pnpm build` 仍成功
- [ ] `git tag phase-06-cicd` 已存在
