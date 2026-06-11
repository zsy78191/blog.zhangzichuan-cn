# 子计划 05：特性挂载（搜索 / RSS / KaTeX / Mermaid SSR / 字体子集）

**子目标：** 把上一子计划准备好的标志位与组件接入实际可用能力：Pagefind 搜索（含中文友好的索引）、RSS 2.0、KaTeX 数学公式 SSR 渲染、Mermaid SSR 转图片、本地 Noto Sans SC 字体子集。

**任务数：** 6

**涉及文件：**
- 创建：`src/pages/search.astro`、`src/pages/rss.xml.ts`、`public/fonts/NotoSansSC-Regular.subset.woff2`（生成产物）
- 修改：`astro.config.mjs`（注册 sitemap、rehype 插件）、`src/layouts/PostLayout.astro`（KaTeX/Mermaid 调整）、`package.json`（scripts）

**前置：** 子计划 04 完成

**完成标志：**
- `pnpm build` 完成后 `dist/pagefind/` 存在
- `/search` 页面可用
- `/rss.xml` 输出有效 RSS 2.0，含 ≥2 篇文章（草稿不在内）
- 含 math 标志位的文章构建后 HTML 中含 KaTeX class
- 含 mermaid 标志位的文章构建后 HTML 中含 mermaid 相关标记
- 字体子集文件存在

---

## Task 5.1：装 Pagefind + sitemap + KaTeX + Mermaid

**Files:**
- 修改：`package.json`

- [ ] **Step 1：装依赖**

```bash
cd /Users/zhangchao/2026/blog
pnpm add -D pagefind @astrojs/sitemap
pnpm add remark-math rehype-katex rehype-mermaid remark-gfm
pnpm add -D katex
```

- [ ] **Step 2：补 `package.json` scripts**

修改 `scripts` 段新增：

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build && pnpm run search:build",
    "preview": "astro preview",
    "astro": "astro",
    "typecheck": "astro check",
    "lint": "eslint . --ext .ts,.astro,.cjs",
    "lint:fix": "eslint . --ext .ts,.astro,.cjs --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "search:build": "pagefind --site dist"
  }
}
```

- [ ] **Step 3：跑 typecheck**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add pagefind, sitemap, katex, mermaid, math plugins"
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
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
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

- [ ] **Step 2：跑 build 验证（KaTeX 渲染 + Mermaid 转图）**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：with-math-and-mermaid 文章的 dist HTML 含 katex class 与 mermaid 相关标记
grep -l 'katex' dist/posts/with-math-and-mermaid/index.html
# 期望有匹配
```

- [ ] **Step 3：跑 typecheck + lint + format + test**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format && pnpm test
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
pnpm build
# 期望：dist/pagefind/ 目录存在
ls dist/pagefind/ | head
# 期望：index/, pagefind.js, pagefind-ui.js, pagefind-ui.css 等
```

- [ ] **Step 3：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
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
pnpm add @astrojs/rss
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
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDatetime,
      link: `/posts/${p.id}`,
      categories: p.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
```

- [ ] **Step 3：跑 build 验证 rss.xml**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：dist/rss.xml 存在且包含 RSS 2.0 标记
head -20 dist/rss.xml
# 期望：包含 <rss version="2.0">
grep -c '<item>' dist/rss.xml
# 期望：2（hello-world + with-math-and-mermaid；draft 不在内）
```

- [ ] **Step 4：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
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
- 创建：`public/fonts/NotoSansSC-Regular.subset.woff2`（下载）
- 创建：`src/styles/fonts.css`

- [ ] **Step 1：创建字体目录**

```bash
cd /Users/zhangchao/2026/blog
mkdir -p public/fonts
```

- [ ] **Step 2：下载 Noto Sans SC 子集 woff2**

```bash
cd /Users/zhangchao/2026/blog
curl -L -o public/fonts/NotoSansSC-Regular.subset.woff2 \
  'https://cdn.jsdelivr.net/npm/noto-sans-sc@1.0.0/fonts/Subset/NotoSansSC-Regular.woff2'
ls -lh public/fonts/
# 期望：~3MB（CDN 官方子集；未来如要再子集化，使用 fonttools / glyphhanger）
```

> 注意：此 woff2 是"按字符集合的官方子集"，不是"按文章字符动态子集"。SPEC §13 提到的"未来用 fonttools 重新生成"指的是后者；MVP 阶段直接用官方子集可接受。

- [ ] **Step 3：写 `src/styles/fonts.css`**

文件：`src/styles/fonts.css`

```css
@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSansSC-Regular.subset.woff2') format('woff2');
}
```

- [ ] **Step 4：在 `BaseLayout.astro` 中 import 字体**

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

- [ ] **Step 5：跑 build 验证字体被打包到 dist**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
ls dist/fonts/
# 期望：NotoSansSC-Regular.subset.woff2
```

- [ ] **Step 6：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 7：提交**

```bash
cd /Users/zhangchao/2026/blog
git add public/fonts/NotoSansSC-Regular.subset.woff2 src/styles/fonts.css src/layouts/BaseLayout.astro
git commit -m "feat(fonts): local Noto Sans SC subset, no network fetch"
```

---

## Task 5.6：门禁全绿 + 打 tag

**Files:**
- 修改：（无）

- [ ] **Step 1：跑完整门禁套件**

```bash
cd /Users/zhangchao/2026/blog
pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
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
# Mermaid
grep -q 'mermaid' dist/posts/with-math-and-mermaid/index.html && echo "MERMAID OK"
# 字体
test -f dist/fonts/NotoSansSC-Regular.subset.woff2 && echo "FONTS OK"
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

- [ ] `pnpm build` 成功
- [ ] `dist/pagefind/`、`dist/rss.xml`、`dist/fonts/NotoSansSC-Regular.subset.woff2` 全部存在
- [ ] KaTeX/Mermaid 在带标志位的文章中渲染
- [ ] 草稿不出现在任何 dist 路径
- [ ] `git tag phase-05-features` 已存在
- [ ] RSS 至少 2 个 item
