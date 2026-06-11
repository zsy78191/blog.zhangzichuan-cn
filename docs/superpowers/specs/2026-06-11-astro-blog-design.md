# 个人博客（Astro + Cloudflare）架构设计

- **作者**：zhangchao
- **日期**：2026-06-11
- **范围**：从零搭建并长期运营的个人博客
- **域名**：`blog.zhangzichuan.cn`（已托管于 Cloudflare）
- **备案号**：苏ICP备18064390号-8

## 1. 背景与目标

建立一个长期可维护的个人博客，技术内容为主。要求：

1. 写作流程低摩擦（本地 Markdown + git 推送即发布）
2. 部署零运维、访问速度快、长期成本接近 0
3. 排版与阅读体验足够好（暗色模式、搜索、RSS、目录、公式、图示）
4. 主题层面不再额外投入设计精力，复用社区成熟模板

非目标（不在本期范围）：

- 评论系统
- 多语言（i18n）
- SSR/动态 API
- 友链/朋友圈/说说页
- 大规模自定义设计

## 2. 关键技术决策

| 维度 | 选定 | 备选 |
|---|---|---|
| 框架 | Astro 5.x | Next.js / Hugo |
| 模式 | 纯静态 SSG（`output: 'static'`） | SSR、混合 |
| 内容源 | 本地 Markdown / MDX（Content Collections） | Notion、Headless CMS |
| 模板起点 | Astro Paper（fork 后定制） | 官方 `blog` starter、astro-sphere |
| 部署 | Cloudflare Pages（静态产物） | Vercel、Netlify、自建 |
| 域名/分发 | Cloudflare（已托管 `blog.zhangzichuan.cn`） | — |
| CI | GitHub Actions + Cloudflare API Token | Wrangler CLI、Pages 直连 Git |
| 包管理 | pnpm | npm、yarn |
| 搜索 | Pagefind（构建后跑，构建期生成索引） | Algolia |
| 主题切换 | 本地 `<script>` + `localStorage` | — |
| 统计 | Cloudflare Web Analytics | Google Analytics、Plausible |
| 字体 | Noto Sans SC 本地子集（`public/fonts/`） | 远程 CDN 加载 |
| 代码高亮 | Astro 内置 Shiki | Prism |
| 数学公式 | remark-math + rehype-katex | MathJax |
| 图表 | rehype-mermaid（SSR 为 `<img>`） | 客户端 mermaid |
| 类型 | TypeScript strict | — |
| 风格 | ESLint + Prettier | — |
| 草稿 | `frontmatter.draft: true` 在生产构建中过滤 | — |

## 3. 高层架构

```
┌──────────────────────────────────────────────────────────┐
│                 Author (zhangchao)                       │
│            在本地用任意 Markdown 编辑器写 .md             │
└──────────────────────────┬───────────────────────────────┘
                           │  git push origin main
                           ▼
       ┌──────────────────────────────────────────┐
       │   GitHub: zhangchao/blog.zhangzichuan.cn │
       └──────────────┬───────────────────────────┘
                      │  webhook
                      ▼
   ┌────────────────────────────────────────────────┐
   │  GitHub Actions: ci.yml + deploy.yml           │
   │  install → typecheck → lint → build            │
   │  pnpm build → ./dist (静态产物)                │
   │  → pagefind --site dist                        │
   │  通过 Cloudflare API 部署到 Pages               │
   └──────────────────────┬─────────────────────────┘
                          │  wrangler / pages deploy
                          ▼
        ┌────────────────────────────────────────┐
        │  Cloudflare Pages project             │
        │  blog-zhangzichuan-cn                  │
        │  自定义域: blog.zhangzichuan.cn         │
        │  启用 CDN + Web Analytics              │
        └────────────────────────────────────────┘
```

## 4. 仓库结构

```
blog/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # PR 检查：typecheck、lint、build
│   │   └── deploy.yml      # 推 main → Cloudflare Pages
│   └── ISSUE_TEMPLATE/
├── .vscode/                # 推荐扩展 + 格式化配置
├── public/                 # 静态资源：favicon、字体子集
│   └── fonts/              # Noto Sans SC 离线字体子集
├── src/
│   ├── assets/             # 文章内嵌图（Astro 图像优化）
│   ├── components/         # 复用组件
│   ├── content/
│   │   ├── config.ts       # Content Collections schema
│   │   └── blog/           # Markdown 文章目录
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.md
│   │   ├── archive.astro
│   │   ├── tags/index.astro
│   │   ├── tags/[tag].astro
│   │   ├── categories/index.astro
│   │   ├── categories/[category].astro
│   │   ├── search.astro
│   │   ├── rss.xml.ts
│   │   └── 404.astro
│   ├── styles/
│   ├── utils/
│   ├── consts.ts
│   └── content.config.ts
├── astro.config.mjs
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── wrangler.toml
└── README.md
```

### 设计原则

1. **内容与代码完全分离** — `src/content/blog/` 只放 markdown；`dist/` 不进 git。
2. **配置集中** — `src/consts.ts` 是站点唯一可信源（标题、URL、备案号、ICP 链接）。
3. **Content Collections schema 强约束** — frontmatter 字段由 zod 校验，构建时坏数据直接报错。
4. **文件级 ≤ 200 行** — 超过即触发拆分。
5. **三层数据流**：内容文件 → Content Collections（带类型）→ 页面/组件消费。

## 5. 组件契约

### 复用组件（`src/components/`）

| 组件 | Props | 职责 | 依赖 |
|---|---|---|---|
| `Header.astro` | `{ activeNav?: string }` | 顶部导航、Logo、主题切换挂点 | `ThemeToggle` |
| `Footer.astro` | （无） | 版权、ICP 备案号（固定位置）、RSS、GitHub | `consts.ICP_NO` |
| `ThemeToggle.astro` | （无） | 客户端 island：读 localStorage 切 `data-theme` | 内联 `<script>` |
| `Search.astro` | `{ pagefind?: boolean }` | 包装 Pagefind UI | `@pagefind/default-ui` |
| `PostCard.astro` | `Post` | 列表项：标题、日期、摘要、tag | `utils/formatDate` |
| `TagList.astro` | `string[]` | 渲染一组 tag 链接 | `pages/tags` 路由 |
| `Prose.astro` | （slot） | 统一排版（行高、字间距、代码块） | 全局 CSS |
| `Math.astro` | （slot） | 当前页启用 KaTeX CSS | `rehype-katex` |
| `Mermaid.astro` | （slot） | 当前页启用 mermaid 客户端回退 | `mermaid` |

### 布局

- **`BaseLayout.astro`** — 全站壳：`<html lang="zh-CN">`、SEO（OG、canonical、sitemap 链接、Pagefind meta）、`<Header>`、`<slot/>`、`<Footer>`、Cloudflare Web Analytics 脚本。
- **`PostLayout.astro`** — 文章壳：基于 `BaseLayout`，加 `<article>` 包装、`<Prose>`、阅读时间、`<TagList>`、上下篇导航、目录（可选 `headings`）。

### 页面路由

| 路由 | 文件 | 数据来源 |
|---|---|---|
| `/` | `pages/index.astro` | `getCollection('blog')` 取最新 5 篇 |
| `/about` | `pages/about.md` | 文件本体 |
| `/archive` | `pages/archive.astro` | `getCollection` 按 `pubDatetime` 排序 |
| `/tags` | `pages/tags/index.astro` | 聚合 |
| `/tags/[tag]` | `pages/tags/[tag].astro` | `getStaticPaths` |
| `/categories/...` | 同 tags | 同 tags |
| `/search` | `pages/search.astro` | Pagefind UI 挂载点 |
| `/rss.xml` | `pages/rss.xml.ts` | `@astrojs/rss` |
| `/404` | `pages/404.astro` | 静态文案 |

## 6. Content Collections Schema

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(200),
    pubDatetime: z.coerce.date(),
    updatedDatetime: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    math: z.boolean().default(false),
    mermaid: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

**约束语义**：

- 缺字段、字段类型错 → `astro check` 阶段报错
- `draft: true` → 生产构建中通过 `getCollection('blog', ({ data }) => !data.draft)` 过滤
- `math: true` → 当前页注入 KaTeX CSS
- `mermaid: true` → 当前页注入 mermaid 客户端回退

## 7. 构建流水线

### npm scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "typecheck": "astro check",
    "lint": "eslint . --ext .ts,.astro",
    "lint:fix": "eslint . --ext .ts,.astro --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "build": "astro check && astro build && pnpm run search:build",
    "preview": "astro preview",
    "search:build": "pagefind --site dist"
  }
}
```

### `astro.config.mjs` 要点

- `output: 'static'`
- `site: 'https://blog.zhangzichuan.cn'`
- `integrations: [sitemap(), mdx()],`
- `markdown: { remarkPlugins: [remarkMath, remarkGfm], rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: 'img' }]] }`
- `prefetch: { defaultStrategy: 'viewport' }`

### `wrangler.toml`

```toml
name = "blog-zhangzichuan-cn"
compatibility_date = "2026-06-01"
pages_build_output_dir = "dist"
```

### CI（`.github/workflows/ci.yml`）

所有 push 与 PR：

1. checkout
2. `pnpm/action-setup@v4`（version 9）
3. `actions/setup-node@v4`（node 22，缓存 pnpm）
4. `pnpm install --frozen-lockfile`
5. `pnpm typecheck`
6. `pnpm lint`
7. `pnpm format:check`
8. `pnpm build`
9. 上传 `dist` 产物

### Deploy（`.github/workflows/deploy.yml`）

仅 `main` 分支：

- 步骤同 CI 至 `pnpm build`
- 使用 `cloudflare/pages-action@v1`
- 必要 secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- 启用 `concurrency: deploy-pages` + `cancel-in-progress: true` 防止并发部署

## 8. 域名、备案与统计

- 自定义域 `blog.zhangzichuan.cn` 在 Cloudflare Pages 控制台绑定（一次性）
- 备案号 `苏ICP备18064390号-8` 通过 `<Footer>` 固定位置展示，链接到 `https://beian.miit.gov.cn/`
- Cloudflare 自动签发证书，HTTPS 默认开启
- Cloudflare Web Analytics：脚本嵌入 `BaseLayout.astro` 末尾（异步 `defer`），token 存 GitHub Secret

## 9. 错误处理

| 错误类型 | 触发位置 | 用户感知 |
|---|---|---|
| Frontmatter 字段缺失/类型错 | `astro check` 阶段 | 构建失败，CI 红叉 |
| 草稿误发布 | `getCollection` 过滤 | 本地可见、生产排除 |
| 死链（站内） | `astro check` 警告 | 构建期打印 |
| 死链（站外） | 可选 `lychee-action` 周一跑 | 周一 GitHub Issue 报告 |
| 部署后 5xx | Cloudflare Pages 自动回滚 | 邮件告警（需控制台开启） |
| 浏览器 JS 异常 | 上报到 Cloudflare Analytics | 异常事件进入 Web Analytics |
| Pagefind 索引缺失 | `search.astro` 用 `<noscript>` 兜底 | 显示"搜索功能未启用" |
| KaTeX/Mermaid 加载失败 | `crossorigin="anonymous"` + 降级 | 显示原文 |

## 10. 测试策略

### L1 — 静态与构建期（必做）

- `astro check`：TypeScript + frontmatter schema
- ESLint + Prettier
- CI 中 `pnpm build` 冒烟测试

### L2 — 组件契约测试（推荐，+30 分钟）

`@vitest/ui` + `happy-dom` 渲染 Astro 组件：

- `<Footer>` 备案号与跳转链接
- `<PostCard>` 渲染 title/datetime/tags
- `<TagList>` URL 正确
- `<BaseLayout>` OG meta + canonical
- `pages/rss.xml.ts` 输出最新 5 篇（不含草稿）

### L3 — 端到端（可选，加 1 天）

`@playwright/test` 3 条路径：

- 首页 → 列表 → 文章页 → 标签页
- 搜索框输入 → 结果出现
- 暗色模式切换 → localStorage 持久化

不在 MVP 必做项，列入"完成 MVP 后加"。

## 11. 可观测性

| 维度 | 工具 | 成本 |
|---|---|---|
| 访问量、来源 | Cloudflare Web Analytics | 免费、零 Cookie |
| 实时访问 | Cloudflare 控制台 | 免费 |
| 构建失败 | GitHub Actions 通知 | 免费 |
| 部署失败 | Cloudflare Pages 邮件告警 | 免费 |
| 错误监控 | 不上 Sentry（静态站性价比低） | — |

## 12. 性能基线

| 指标 | 目标 | 达成方式 |
|---|---|---|
| Performance | ≥ 95 | 静态 HTML + 字体子集 + 零 JS（默认无 island） |
| Accessibility | ≥ 95 | Astro Paper 主题 a11y 良好 |
| Best Practices | ≥ 95 | HTTPS、OG、ICP 链接 |
| SEO | ≥ 95 | sitemap + canonical + robots.txt |

## 13. 风险登记

| 风险 | 缓解 |
|---|---|
| Cloudflare Pages 直连 Git 比 Actions 更简单 | 当前保留 Actions；`deploy.yml` 注释中加切换提示 |
| 字体子集过小 | 文档化用 `glyphhanger` / `fonttools` 重新生成 |
| 中文字数对 RSS 体积影响 | `@astrojs/rss` 的 `<description>` 截前 200 字 |
| Mermaid SSR 图无法高亮 | 保留客户端 mermaid island 作为可选回退 |
| 草稿在搜索结果泄露 | `getCollection` 先过滤 `draft` 再构建 → Pagefind 索引里无草稿 |

## 14. 实施阶段（粗粒度）

1. **脚手架**：fork Astro Paper、调整 `consts.ts` 与 `astro.config.mjs`、补 `.gitignore`
2. **依赖与配置**：装 pnpm、ESLint、Prettier、Pagefind、KaTeX、Mermaid；写 `tsconfig.json`、`astro.config.mjs`、`wrangler.toml`
3. **Content Collections**：`src/content.config.ts` schema、`src/content/blog/` 放第一篇示例文章
4. **核心页面与组件**：Header / Footer（含 ICP）/ ThemeToggle / PostCard / TagList / Prose；首页、归档、tags、categories、404
5. **特性挂载**：Pagefind UI、KaTeX CSS、Mermaid SSR
6. **CI**：`ci.yml` + `deploy.yml`；本地 `pnpm build` 全绿
7. **Cloudflare 端**：创建 Pages 项目、绑定自定义域、启 CDN、配置 Web Analytics token
8. **GitHub Secrets**：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
9. **冒烟**：从 push main 到博客可见 ≤ 5 分钟
10. **可选**：L2 组件测试、L3 e2e、字体子集脚本化、Lychee 周报

## 15. 验收标准（MVP）

- `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build` 全部通过
- 推 `main` 后 ≤ 5 分钟博客可访问
- `https://blog.zhangzichuan.cn/` 首页展示 5 篇文章 + 简介
- 页脚固定位置显示 `苏ICP备18064390号-8` 跳转至工信部
- 暗色模式可切换并持久化
- `/search` 全文检索可用
- `/rss.xml` 输出有效 RSS 2.0
- Lighthouse 四个维度 ≥ 95
- 草稿（`draft: true`）生产构建不可见，且不进入搜索索引
