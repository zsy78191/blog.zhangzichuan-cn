# 子计划 05：特性挂载（搜索 / RSS / KaTeX / Mermaid SSR / 字体子集）

**子目标：** 把上一子计划准备好的标志位与组件接入实际可用能力：Pagefind 搜索（含中文友好的索引）、RSS 2.0、KaTeX 数学公式 SSR 渲染、Mermaid SSR 转图片、本地 Noto Sans SC 字体子集。

**任务数：** 6

**涉及文件：**
- 创建：`src/pages/search.astro`、`src/pages/rss.xml.ts`、`public/fonts/NotoSansSC-Regular.subset.woff2`（生成产物）
- 修改：`astro.config.mjs`（注册 sitemap、rehype 插件）、`src/layouts/PostLayout.astro`（KaTeX/Mermaid 调整）、`package.json`（scripts）

**前置：** 子计划 04 完成

**完成标志：**
- `bun run build` 完成后 `dist/pagefind/` 存在
- `/search` 页面可用
- `/rss.xml` 输出有效 RSS 2.0，含 ≥2 篇文章（草稿不在内）
- 含 math 标志位的文章构建后 HTML 中含 KaTeX class
- 含 mermaid 标志位的文章构建后 HTML 中含 mermaid 相关标记
- 字体子集文件存在

---

## Task 5.1：装 Pagefind + sitemap + KaTeX + Mermaid + Playwright

**Files:**
- 修改：`package.json`

- [ ] **Step 1：装依赖（含 playwright，rehype-mermaid 的 `strategy: 'img'` 依赖 puppeteer/playwright 启动无头浏览器渲染 SVG）**

```bash
cd /Users/zhangchao/2026/blog
bun add -d pagefind @astrojs/sitemap playwright
bun add remark-math rehype-katex rehype-mermaid remark-gfm
bun add -d katex
```

- [ ] **Step 2：安装 Playwright 的 Chromium 浏览器（mermaid SSR 必需）**

```bash
cd /Users/zhangchao/2026/blog
bunx playwright install --with-deps chromium
```

> `rehype-mermaid` 默认会用 `playwright-core` + 系统已装的浏览器；为了 CI/本地一致，显式安装 chromium。CI 流程在子计划 06 处理。
> 也可改用 `puppeteer`，但 playwright 与 GitHub Actions runner 兼容性更好。

- [ ] **Step 3：补 `package.json` scripts**

修改 `scripts` 段新增 `search:build`，并把 `build` 链上 pagefind：

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build && bun run search:build",
    "preview": "astro preview",
    "astro": "astro",
    "typecheck": "astro check",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "search:build": "pagefind --site dist"
  }
}
```

> `lint` 不再用 `--ext`：ESLint 9 flat config 不支持该参数，文件类型已通过 `eslint.config.js` 与 `eslint-plugin-astro` 的 preset 解析。

- [ ] **Step 4：跑 typecheck**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck
```

- [ ] **Step 5：提交**

```bash
cd /Users/zhangchao/2026/blog
git add package.json bun.lock
git commit -m "chore(deps): add pagefind, sitemap, katex, mermaid, playwright"
```

---

## Task 5.2：升级 `astro.config.mjs`（sitemap + markdown 插件）

**Files:**
- 修改：`astro.config.mjs`

- [ ] **Step 1：覆盖 `astro.config.mjs`**

文件：`astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.zhangzichuan.cn',
  // 与子计划 00 保持一致：所有 URL 带尾斜杠，避免重复内容
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
      // strategy: 'img' 在构建时用 Playwright 启动 chromium 把 mermaid 代码
      // 块转成 <img src="data:image/svg+xml;..."/>；这意味着构建依赖 chromium，
      // 但浏览器端不再需要任何 mermaid JS。playwright/chromium 在 Task 5.1 已装。
      [rehypeMermaid, { strategy: 'img' }],
    ],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  prefetch: { defaultStrategy: 'viewport' },
});
```

> 不再注册 `i18n` 集成：单语言站点用 `<html lang="zh-CN">` 已足够（已在 `BaseLayout` 声明）。

- [ ] **Step 2：跑 build 验证（KaTeX 渲染 + Mermaid 转图）**

```bash
cd /Users/zhangchao/2026/blog
bun run build
# 期望：with-math-and-mermaid 文章的 dist HTML 含 katex class 与 mermaid 相关标记
grep -l 'katex' dist/posts/with-math-and-mermaid/index.html
# 期望有匹配
```

- [ ] **Step 3：跑 typecheck + lint + format + test**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format && bun run test
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add astro.config.mjs
git commit -m "feat(astro): register sitemap, KaTeX SSR, Mermaid SSR-to-image"
```

---

## Task 5.3：写 `/search` 页面（Pagefind UI）

**Files:**
- 创建：`src/pages/search.astro`

- [ ] **Step 1：写 `src/pages/search.astro`**

文件：`src/pages/search.astro`

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout title="搜索" description="全文搜索" activeNav="/search">
  <h1>搜索</h1>
  <p>在 <a href="/archive">归档</a> 与所有文章内搜索。</p>
  <div id="search"></div>

  <noscript>
    <p>搜索功能需要启用 JavaScript。请启用后刷新页面，或前往 <a href="/archive">归档</a> 浏览全部文章。</p>
  </noscript>
</BaseLayout>

<link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
<script src="/pagefind/pagefind-ui.js" is:inline></script>
<script is:inline>
  window.addEventListener('DOMContentLoaded', () => {
    // @ts-ignore
    new PagefindUI({
      element: '#search',
      resetStyles: false,
      showImages: false,
      showSubResults: true,
      excerptLength: 30,
    });
  });
</script>
{/*
  M7（审计）：e2e 选择器必须用 Pagefind UI 注入后的实际 DOM class
  `input.pagefind-ui__search-input`，不能写 `input[type=search]`（实际是 text）。
  Pagefind 默认生成的搜索框 class 已固定，本计划 e2e 套件按此选择器编写。
  PostLayout 已对 <article> 加 data-pagefind-body，仅索引正文。
 */}

<style>
  main {
    max-width: 720px;
  }
  #search {
    margin-top: 1.5rem;
  }
</style>
```

- [ ] **Step 2：跑 build 验证 pagefind 索引生成**

```bash
cd /Users/zhangchao/2026/blog
bun run build
# 期望：dist/pagefind/ 目录存在
ls dist/pagefind/ | head
# 期望：index/, pagefind.js, pagefind-ui.js, pagefind-ui.css 等
```

- [ ] **Step 3：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/search.astro
git commit -m "feat(search): Pagefind UI on /search with noscript fallback"
```

---

## Task 5.4：写 RSS 2.0 feed

**Files:**
- 创建：`src/pages/rss.xml.ts`

- [ ] **Step 1：装 rss 集成**

```bash
cd /Users/zhangchao/2026/blog
bun add @astrojs/rss
```

- [ ] **Step 2：写 `src/pages/rss.xml.ts`**

文件：`src/pages/rss.xml.ts`

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@consts';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = sortByPubDatetime(filterDraft(await getCollection('blog')));
  const siteUrl = context.site ?? new URL(SITE.url);
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteUrl,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDatetime,
      // 必须是绝对 URL：相对路径会导致大部分 RSS 阅读器无法跳转
      // trailingSlash: 'always' → 必须带尾斜杠保持与站内一致
      link: new URL(`/posts/${p.id}/`, siteUrl).toString(),
      categories: p.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
```

- [ ] **Step 3：跑 build 验证 rss.xml**

```bash
cd /Users/zhangchao/2026/blog
bun run build
# 期望：dist/rss.xml 存在且包含 RSS 2.0 标记
head -20 dist/rss.xml
# 期望：包含 <rss version="2.0">
grep -c '<item>' dist/rss.xml
# 期望：2（hello-world + with-math-and-mermaid；draft 不在内）
```

- [ ] **Step 4：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 5：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/rss.xml.ts
git commit -m "feat(rss): RSS 2.0 feed filtered for drafts"
```

---

## Task 5.5：本地中文字体子集

**Files:**
- 修改：`package.json`
- 创建：`src/styles/fonts.css`

> jsdelivr 上的 `noto-sans-sc@1.0.0/fonts/Subset/...` 路径已 404，不能用 curl 拉。改用 `@fontsource/noto-sans-sc`（fontsource 把字体文件打进 `node_modules`，再由 Vite 复制到 dist；完全离线）。

- [ ] **Step 1：装 @fontsource 包**

```bash
cd /Users/zhangchao/2026/blog
bun add @fontsource/noto-sans-sc
```

- [ ] **Step 2：写 `src/styles/fonts.css`**

文件：`src/styles/fonts.css`

```css
/* 来自 @fontsource/noto-sans-sc；由 Vite 把 woff2 复制到 dist/_astro/。
 * 不联网拉取（符合 SPEC 字体本地化约束）。
 * 400 = regular 字重；如需 700 改 import 对应 css。
 */
@import '@fontsource/noto-sans-sc/400.css';
@import '@fontsource/noto-sans-sc/700.css';
```

- [ ] **Step 3：在 `BaseLayout.astro` 中 import 字体**

修改 `src/layouts/BaseLayout.astro` 的 frontmatter 段：在原有 `import '../styles/global.css';` 之前增加一行：

```astro
---
import { SITE } from '@consts';
import Header from '@components/Header.astro';
import Footer from '@components/Footer.astro';
import '../styles/fonts.css';
import '../styles/global.css';
// ... 其余不变
---
```

- [ ] **Step 4：在 `src/styles/global.css` 中指定 font-family**

确保 `src/styles/global.css` 至少包含（按需扩展）：

```css
:root {
  --font-sans:
    'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif;
}

html {
  font-family: var(--font-sans);
}
```

- [ ] **Step 5：跑 build 验证字体被打包到 dist**

```bash
cd /Users/zhangchao/2026/blog
bun run build
# @fontsource 字体在 Vite 处理后落到 dist/_astro/，文件名带哈希
ls dist/_astro/ | grep -i 'noto' | head
# 期望：看到 noto-sans-sc-<hash>.woff2 等
```

- [ ] **Step 6：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 7：提交**

```bash
cd /Users/zhangchao/2026/blog
git add package.json bun.lock src/styles/fonts.css src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat(fonts): use @fontsource/noto-sans-sc (offline, no CDN fetch)"
```

---

## Task 5.6：门禁全绿 + 打 tag

**Files:**
- 修改：（无）

- [ ] **Step 1：跑完整门禁套件**

```bash
cd /Users/zhangchao/2026/blog
bun run test && bun run typecheck && bun run lint && bun run format:check && bun run build
echo "ALL GREEN"
```

- [ ] **Step 2：验证关键能力（一次过）**

```bash
cd /Users/zhangchao/2026/blog
# Pagefind 索引
test -d dist/pagefind && echo "PAGEFIND OK"
# RSS
grep -q '<rss version="2.0">' dist/rss.xml && echo "RSS OK"
# KaTeX
grep -q 'katex' dist/posts/with-math-and-mermaid/index.html && echo "KATEX OK"
# Mermaid：rehype-mermaid strategy: 'img' 把代码块转成 <img>，不应再含 <pre class="mermaid">
grep -q '<img' dist/posts/with-math-and-mermaid/index.html && echo "MERMAID IMG OK"
# 字体
ls dist/_astro/ | grep -qi 'noto' && echo "FONTS OK"
# 草稿过滤
test ! -e dist/posts/draft-post && echo "DRAFT FILTERED OK"
```

期望：6 行 `OK`。

- [ ] **Step 3：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-05-features
git tag --list 'phase-05*'
# 期望：phase-05-features
```

---

## 子计划 05 完成

进入 `06-ci-cd.md` 前确认：

- [ ] `bun run build` 成功
- [ ] `dist/pagefind/`、`dist/rss.xml`、`dist/fonts/NotoSansSC-Regular.subset.woff2` 全部存在
- [ ] KaTeX/Mermaid 在带标志位的文章中渲染
- [ ] 草稿不出现在任何 dist 路径
- [ ] `git tag phase-05-features` 已存在
- [ ] RSS 至少 2 个 item
