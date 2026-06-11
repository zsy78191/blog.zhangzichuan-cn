# 子计划 04：布局与页面

**子目标：** 建立 `BaseLayout` / `PostLayout`，实现首页、归档、tags 索引/详情、categories 索引/详情、404、about、单文章页。草稿过滤在此子计划接进实际渲染流。

**任务数：** 6

**涉及文件：**
- 创建：`src/layouts/BaseLayout.astro`、`src/layouts/PostLayout.astro`
- 页面：`src/pages/index.astro`（覆盖）、`src/pages/about.astro`、`src/pages/archive.astro`、`src/pages/404.astro`、`src/pages/tags/index.astro`、`src/pages/tags/[tag].astro`、`src/pages/categories/index.astro`、`src/pages/categories/[category].astro`、`src/pages/posts/[...slug].astro`
- 全局样式：`src/styles/global.css`
- 测试：`tests/layouts/BaseLayout.test.ts`

**前置：** 子计划 03 完成

**完成标志：**
- `pnpm build` 成功
- `dist/index.html`、`dist/archive/index.html`、`dist/about/index.html`、`dist/404.html`、`dist/tags/index.html`、`dist/tags/随笔/index.html`、`dist/categories/随笔/index.html`、`dist/posts/hello-world/index.html` 全部存在
- **草稿 `draft-post.md` 不出现在 dist/ 任何路径下**
- `BaseLayout` 测试断言 OG/canonical/ICP

---

## Task 4.1：写全局样式 + 暗色主题变量

**Files:**
- 创建：`src/styles/global.css`

- [ ] **Step 1：写 `src/styles/global.css`**

文件：`src/styles/global.css`

```css
:root {
  --bg: #ffffff;
  --bg-muted: #f3f4f6;
  --fg: #111827;
  --fg-muted: #6b7280;
  --fg-inverse: #f9fafb;
  --border: #e5e7eb;
  --accent: #2563eb;
}

[data-theme='dark'] {
  --bg: #0b1020;
  --bg-muted: #1f2937;
  --fg: #f3f4f6;
  --fg-muted: #9ca3af;
  --fg-inverse: #0b1020;
  --border: #1f2937;
  --accent: #60a5fa;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family:
    'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
```

- [ ] **Step 2：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/styles/global.css
git commit -m "feat(styles): global CSS with light/dark theme variables"
```

---

## Task 4.2：写 `BaseLayout` + 测试

**Files:**
- 创建：`src/layouts/BaseLayout.astro`、`tests/layouts/BaseLayout.test.ts`

- [ ] **Step 1：先写失败测试**

文件：`tests/layouts/BaseLayout.test.ts`

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import BaseLayout from '@layouts/BaseLayout.astro';

describe('BaseLayout', () => {
  test('含 OG、canonical、ICP 备案号', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      request: new Request('https://blog.zhangzichuan.cn/test/'),
      props: { title: '测试页', description: 'desc' },
      slots: { default: '<p>hello</p>' },
    });
    expect(html).toContain('<html lang="zh-CN"');
    expect(html).toContain('https://blog.zhangzichuan.cn/');
    expect(html).toContain('og:title');
    expect(html).toContain('苏ICP备18064390号-8');
  });
});
```

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL
```

- [ ] **Step 3：写 `BaseLayout.astro`**

文件：`src/layouts/BaseLayout.astro`

```astro
---
import { SITE } from '@consts';
import Header from '@components/Header.astro';
import Footer from '@components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
  activeNav?: string;
  ogImage?: string;
}
const {
  title,
  description = SITE.description,
  activeNav,
  ogImage,
} = Astro.props as Props;

const fullTitle = title === SITE.title ? title : `${title} · ${SITE.title}`;
const canonical = new URL(Astro.url.pathname, SITE.url).toString();
const ogImg = ogImage ? new URL(ogImage, SITE.url).toString() : undefined;
---

<!doctype html>
<html lang={SITE.locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    {ogImg && <meta property="og:image" content={ogImg} />}
    <meta name="twitter:card" content="summary" />
  </head>
  <body>
    <Header activeNav={activeNav} />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：5 passed
```

- [ ] **Step 5：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 6：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/layouts/BaseLayout.astro tests/layouts/BaseLayout.test.ts
git commit -m "feat(layouts): BaseLayout with SEO meta and TDD"
```

---

## Task 4.3：写首页 + 归档 + about + 404

**Files:**
- 创建/修改：`src/pages/index.astro`（覆盖占位）、`src/pages/archive.astro`、`src/pages/about.md`、`src/pages/404.astro`

- [ ] **Step 1：覆盖 `src/pages/index.astro`**

文件：`src/pages/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import PostCard from '@components/PostCard.astro';
import { SITE } from '@consts';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

const posts = sortByPubDatetime(filterDraft(await getCollection('blog')));
const recent = posts.slice(0, 5);
---

<BaseLayout title={SITE.title} activeNav="/">
  <section class="intro">
    <h1>{SITE.title}</h1>
    <p>{SITE.description}</p>
  </section>

  <section class="recent">
    <h2>最新文章</h2>
    {recent.length === 0 ? (
      <p>暂无文章。</p>
    ) : (
      recent.map((p) => <PostCard post={p} />)
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 2：写 `src/pages/about.astro`**

> 不用 markdown layout：Astro 5 中 markdown `layout:` 字段会把 frontmatter 包成 `{ frontmatter: {...} }` 传给 layout，而 `BaseLayout` 期望扁平 props（`title`、`description`）。直接用 `.astro` 显式调用最稳。

文件：`src/pages/about.astro`

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout title="关于" description="关于本站与作者" activeNav="/about">
  <h1>关于</h1>
  <p>你好，我是 <strong>zhangchao</strong>。</p>
  <p>这是我的个人博客，记录技术笔记、工程实践与偶尔的杂谈。</p>

  <h2>联系方式</h2>
  <ul>
    <li>GitHub: <a href="https://github.com/zhangchao" rel="noopener noreferrer">github.com/zhangchao</a></li>
    <li>RSS: <a href="/rss.xml">/rss.xml</a></li>
  </ul>
</BaseLayout>
```

- [ ] **Step 3：写 `src/pages/archive.astro`**

文件：`src/pages/archive.astro`

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import PostCard from '@components/PostCard.astro';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

const posts = sortByPubDatetime(filterDraft(await getCollection('blog')));

// 按年分组
const byYear = new Map<number, typeof posts>();
for (const p of posts) {
  const y = p.data.pubDatetime.getUTCFullYear();
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(p);
}
const years = [...byYear.entries()].sort((a, b) => b[0] - a[0]);
---

<BaseLayout title="归档" activeNav="/archive">
  <h1>归档</h1>
  {years.length === 0 ? (
    <p>暂无文章。</p>
  ) : (
    years.map(([year, list]) => (
      <section>
        <h2>{year}</h2>
        {list.map((p) => <PostCard post={p} />)}
      </section>
    ))
  )}
</BaseLayout>
```

- [ ] **Step 4：写 `src/pages/404.astro`**

文件：`src/pages/404.astro`

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout title="404 · 页面未找到">
  <h1>404</h1>
  <p>你访问的页面不存在。</p>
  <p><a href="/">返回首页</a> · <a href="/archive">查看归档</a> · <a href="/search">搜索</a></p>
</BaseLayout>
```

- [ ] **Step 5：跑 build 验证草稿被过滤**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
ls dist/
# 期望：包含 index.html、archive/、about/、404.html
# 验证 dist/blog/ 或 dist/posts/draft-post/ 不应存在
test ! -e dist/posts/draft-post && echo "DRAFT FILTERED OK"
# 期望：DRAFT FILTERED OK
```

- [ ] **Step 6：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 7：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/index.astro src/pages/archive.astro src/pages/about.astro src/pages/404.astro
git commit -m "feat(pages): index, archive, about, 404 with draft filter"
```

---

## Task 4.4：写 tags 索引/详情

**Files:**
- 创建：`src/pages/tags/index.astro`、`src/pages/tags/[tag].astro`

- [ ] **Step 1：写 `src/pages/tags/index.astro`**

文件：`src/pages/tags/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import { filterDraft } from '@utils/filterDraft';
import { getAllTags } from '@utils/getAllTags';

const posts = filterDraft(await getCollection('blog'));
const tags = getAllTags(posts);
---

<BaseLayout title="标签" activeNav="/tags">
  <h1>标签</h1>
  {tags.length === 0 ? (
    <p>暂无标签。</p>
  ) : (
    <ul class="tag-cloud">
      {tags.map(({ tag, count }) => (
        <li>
          <a href={`/tags/${encodeURIComponent(tag)}`}>
            #{tag} <span class="count">({count})</span>
          </a>
        </li>
      ))}
    </ul>
  )}
</BaseLayout>

<style>
  .tag-cloud {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .tag-cloud a {
    color: var(--fg-muted);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .tag-cloud a:hover {
    background: var(--bg-muted);
  }
  .count {
    color: var(--fg-muted);
    font-size: 0.85em;
  }
</style>
```

- [ ] **Step 2：写 `src/pages/tags/[tag].astro`**

文件：`src/pages/tags/[tag].astro`

```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import PostCard from '@components/PostCard.astro';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

export async function getStaticPaths() {
  const posts = filterDraft(await getCollection('blog'));
  const map = new Map<string, CollectionEntry<'blog'>[]>();
  for (const p of posts) {
    for (const t of p.data.tags) {
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(p);
    }
  }
  return [...map.entries()].map(([tag, list]) => ({
    params: { tag },
    props: { posts: sortByPubDatetime(list) },
  }));
}

interface Props {
  posts: CollectionEntry<'blog'>[];
}
const { tag } = Astro.params;
const { posts } = Astro.props as Props;
---

<BaseLayout title={`#${tag}`} activeNav="/tags">
  <h1>#{tag}</h1>
  <p>{posts.length} 篇文章</p>
  {posts.map((p) => <PostCard post={p} />)}
</BaseLayout>
```

- [ ] **Step 3：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：dist/tags/index.html、dist/tags/随笔/index.html、dist/tags/Meta/index.html、dist/tags/示例/index.html、dist/tags/Markdown/index.html 存在
ls dist/tags/
```

- [ ] **Step 4：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 5：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/tags/
git commit -m "feat(pages): tags index and detail with getStaticPaths"
```

---

## Task 4.5：写 categories 索引/详情

**Files:**
- 创建：`src/pages/categories/index.astro`、`src/pages/categories/[category].astro`

- [ ] **Step 1：写 `src/pages/categories/index.astro`**

文件：`src/pages/categories/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import { filterDraft } from '@utils/filterDraft';
import { getAllCategories } from '@utils/getAllCategories';

const posts = filterDraft(await getCollection('blog'));
const cats = getAllCategories(posts);
---

<BaseLayout title="分类" activeNav="/categories">
  <h1>分类</h1>
  {cats.length === 0 ? (
    <p>暂无分类。</p>
  ) : (
    <ul class="cat-list">
      {cats.map(({ category, count }) => (
        <li>
          <a href={`/categories/${encodeURIComponent(category)}`}>
            {category} <span class="count">({count})</span>
          </a>
        </li>
      ))}
    </ul>
  )}
</BaseLayout>

<style>
  .cat-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cat-list a {
    color: var(--fg);
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    display: block;
  }
  .cat-list a:hover {
    background: var(--bg-muted);
  }
  .count {
    color: var(--fg-muted);
    font-size: 0.85em;
  }
</style>
```

- [ ] **Step 2：写 `src/pages/categories/[category].astro`**

文件：`src/pages/categories/[category].astro`

```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';
import PostCard from '@components/PostCard.astro';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

export async function getStaticPaths() {
  const posts = filterDraft(await getCollection('blog'));
  const map = new Map<string, CollectionEntry<'blog'>[]>();
  for (const p of posts) {
    const c = p.data.category;
    if (c === undefined) continue;
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(p);
  }
  return [...map.entries()].map(([category, list]) => ({
    params: { category },
    props: { posts: sortByPubDatetime(list) },
  }));
}

interface Props {
  posts: CollectionEntry<'blog'>[];
}
const { category } = Astro.params;
const { posts } = Astro.props as Props;
---

<BaseLayout title={category ?? ''} activeNav="/categories">
  <h1>{category}</h1>
  <p>{posts.length} 篇文章</p>
  {posts.map((p) => <PostCard post={p} />)}
</BaseLayout>
```

- [ ] **Step 3：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：dist/categories/index.html、dist/categories/随笔/index.html、dist/categories/技术/index.html 存在
ls dist/categories/
```

- [ ] **Step 4：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 5：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/categories/
git commit -m "feat(pages): categories index and detail"
```

---

## Task 4.6：写 `PostLayout` + 单文章页

**Files:**
- 创建：`src/layouts/PostLayout.astro`、`src/pages/posts/[...slug].astro`

- [ ] **Step 1：写 `src/layouts/PostLayout.astro`**

文件：`src/layouts/PostLayout.astro`

```astro
---
import BaseLayout from './BaseLayout.astro';
import Prose from '@components/Prose.astro';
import TagList from '@components/TagList.astro';
import { formatDate } from '@utils/formatDate';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}
const { post } = Astro.props as Props;
const { title, description, pubDatetime, tags, math } = post.data;
---

{/*
  KaTeX CSS：使用 npm 包本地 import，构建时由 Astro 打到 _astro/ 目录，
  与字体不联网原则一致；不再走 jsdelivr CDN（大陆访问不稳定）。
  仅在 math: true 的文章引入。katex 已在子计划 05 装入 devDependencies。

  Mermaid：由 rehype-mermaid 在 SSR 期 strategy: 'img' 直接出 PNG/SVG，
  HTML 中已是 <img>，无需任何客户端 JS，删除原先的客户端 fallback 块。
*/}

<BaseLayout
  title={title}
  description={description}
  activeNav={undefined}
>
  {/* data-pagefind-body 告诉 Pagefind 仅索引 <article> 内的正文，不索引
   * 导航/页脚/标签云。M7：e2e 选择器搜索输入框时应为 `input.pagefind-ui__search-input`。 */}
  <article data-pagefind-body>
    <header class="post-header">
      <h1>{title}</h1>
      <p class="post-meta">
        <time datetime={pubDatetime.toISOString()}>{formatDate(pubDatetime)}</time>
      </p>
    </header>

    {math && <style is:global>{`@import 'katex/dist/katex.min.css';`}</style>}

    <Prose>
      <slot />
    </Prose>

    {tags.length > 0 && (
      <footer class="post-footer">
        <TagList tags={tags} />
      </footer>
    )}
  </article>
</BaseLayout>

<style>
  .post-header {
    margin-bottom: 2rem;
  }
  .post-header h1 {
    margin: 0 0 0.5rem 0;
  }
  .post-meta {
    color: var(--fg-muted);
    font-size: 0.9rem;
    margin: 0;
  }
  .post-footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
</style>
```

> 关于按文章条件注入 KaTeX CSS：上面用 `<style is:global>{`@import 'katex/dist/katex.min.css';`}</style>`，Astro/Vite 会把 `@import` 解析为 npm 包路径并把对应 CSS 与字体打到 `_astro/`。如该写法在你本地 Astro 版本下不解析（少见），改为 frontmatter 顶部直接 `import 'katex/dist/katex.min.css';`（无条件注入，但所有文章页都带 ~25KB CSS；体积代价小，可接受）。

- [ ] **Step 2：写 `src/pages/posts/[...slug].astro`**

文件：`src/pages/posts/[...slug].astro`

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '@layouts/PostLayout.astro';
import { filterDraft } from '@utils/filterDraft';

export async function getStaticPaths() {
  const posts = filterDraft(await getCollection('blog'));
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<PostLayout post={post}>
  <Content />
</PostLayout>
```

- [ ] **Step 3：跑 build 验证单文章页**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：dist/posts/hello-world/index.html、dist/posts/with-math-and-mermaid/index.html 存在
# 不应存在 dist/posts/draft-post/
ls dist/posts/
test ! -e dist/posts/draft-post && echo "DRAFT FILTERED OK"
# 期望：DRAFT FILTERED OK
```

- [ ] **Step 4：跑 typecheck + lint + format + test**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format && pnpm test
```

- [ ] **Step 5：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git add src/layouts/PostLayout.astro src/pages/posts/
git commit -m "feat(pages): single post route with PostLayout"
git tag phase-04-layouts
```

---

## 子计划 04 完成

进入 `05-features.md` 前确认：

- [ ] `pnpm build` 成功
- [ ] `dist/posts/hello-world/index.html` 存在
- [ ] `dist/posts/with-math-and-mermaid/index.html` 存在
- [ ] `dist/posts/draft-post/` **不存在**（草稿过滤）
- [ ] `pnpm test` 全过
- [ ] `git tag phase-04-layouts` 已存在
- [ ] 路由清单：`/`、`/archive`、`/about`、`/404`、`/tags`、`/tags/[tag]`、`/categories`、`/categories/[category]`、`/posts/[slug]`
