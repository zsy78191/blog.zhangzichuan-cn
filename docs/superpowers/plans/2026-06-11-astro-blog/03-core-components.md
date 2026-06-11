# 子计划 03：核心组件

**子目标：** 实现 6 个核心组件——`Header`、`Footer`（含 ICP 备案号）、`ThemeToggle`、`PostCard`、`TagList`、`Prose`，每个组件都有 TDD 验证。

**任务数：** 8

**涉及文件：**
- 创建：`src/components/Header.astro`、`src/components/Footer.astro`、`src/components/ThemeToggle.astro`、`src/components/PostCard.astro`、`src/components/TagList.astro`、`src/components/Prose.astro`
- 测试：`tests/components/Footer.test.ts`、`tests/components/PostCard.test.ts`、`tests/components/TagList.test.ts`

**前置：** 子计划 02 完成

**完成标志：**
- `bun run test` 全部测试通过
- `bun run build` 通过
- 验证 `<Footer>` 输出含 `苏ICP备18064390号-8` 与 `https://beian.miit.gov.cn/`
- 验证 `<PostCard>` 渲染 title/date/tags
- 验证 `<TagList>` 生成正确 URL

---

## Task 3.1：装 Astro Container 测试工具

**Files:**
- 修改：`package.json`（自动）

- [ ] **Step 1：装依赖（vitest 已在 02 装好；container 内置于 astro）**

```bash
cd /Users/zhangchao/2026/blog
bun add -d @types/node
```

- [ ] **Step 2：确认 `astro` 暴露 container API**

`@astrojs/check` 已装；Astro 5.x 自带 `astro/container`，无需额外依赖。

- [ ] **Step 3：提交（如 package.json 变了）**

```bash
cd /Users/zhangchao/2026/blog
git add package.json bun.lock
git diff --cached --quiet || git commit -m "chore(test): ensure @types/node for container tests"
```

---

## Task 3.2：写 `Footer` 组件 + 测试

**Files:**
- 创建：`src/components/Footer.astro`、`tests/components/Footer.test.ts`

- [ ] **Step 1：先写 Footer 失败测试**

文件：`tests/components/Footer.test.ts`

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Footer from '@components/Footer.astro';

describe('Footer', () => {
  test('显示 ICP 备案号并链接到工信部', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      request: new Request('https://blog.zhangzichuan.cn/'),
    });
    expect(html).toContain('苏ICP备18064390号-8');
    expect(html).toContain('https://beian.miit.gov.cn/');
  });

  test('包含 copyright 与 RSS 链接', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      request: new Request('https://blog.zhangzichuan.cn/'),
    });
    expect(html).toMatch(/©\s*\d{4}/);
    expect(html).toContain('/rss.xml');
  });
});
```

> 所有 `renderToString` 调用都显式传 `request`，让组件内的 `Astro.url` 能解析出确定的 pathname，避免不同 Astro minor 版本下 `Astro.url` 为空导致 canonical 失效。

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：FAIL "Cannot find module '@components/Footer.astro'"
```

- [ ] **Step 3：写 `Footer.astro` 最小实现**

文件：`src/components/Footer.astro`

```astro
---
import { ICP, SITE, SOCIAL } from '@consts';

const year = new Date().getFullYear();
---

<footer class="site-footer">
  <div class="footer-inner">
    <p class="copyright">© {year} {SITE.author}. All rights reserved.</p>
    <nav class="social" aria-label="社交与订阅">
      <ul>
        {SOCIAL.map((s) => (
          <li><a href={s.href} rel="noopener">{s.name}</a></li>
        ))}
      </ul>
    </nav>
    <p class="icp">
      <a href={ICP.link} target="_blank" rel="noopener noreferrer">{ICP.text}</a>
    </p>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--border, #e5e7eb);
    padding: 1.5rem 1rem;
    margin-top: 4rem;
    font-size: 0.9rem;
    color: var(--fg-muted, #6b7280);
  }
  .footer-inner {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  .icp a {
    color: inherit;
    text-decoration: none;
  }
  .icp a:hover {
    text-decoration: underline;
  }
  .social ul {
    display: flex;
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .social a {
    color: inherit;
    text-decoration: none;
  }
  .social a:hover {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：2 passed
```

- [ ] **Step 5：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 6：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/components/Footer.astro tests/components/Footer.test.ts
git commit -m "feat(components): Footer with ICP registration number and TDD"
```

---

## Task 3.3：写 `Header` 组件

**Files:**
- 创建：`src/components/Header.astro`

- [ ] **Step 1：写 `Header.astro`**

文件：`src/components/Header.astro`

```astro
---
import { NAV, SITE } from '@consts';
import ThemeToggle from './ThemeToggle.astro';

interface Props {
  activeNav?: string;
}
const { activeNav } = Astro.props as Props;
---

<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">
      <span class="brand-title">{SITE.title}</span>
    </a>
    <nav aria-label="主导航">
      <ul>
        {NAV.map((item) => (
          <li>
            <a
              href={item.href}
              aria-current={activeNav === item.href ? 'page' : undefined}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
    <ThemeToggle />
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--border, #e5e7eb);
    background: var(--bg, #fff);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header-inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .brand {
    text-decoration: none;
    color: var(--fg, #111);
    font-weight: 600;
  }
  nav {
    flex: 1;
  }
  nav ul {
    display: flex;
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  nav a {
    color: var(--fg-muted, #6b7280);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  nav a:hover {
    color: var(--fg, #111);
  }
  nav a[aria-current='page'] {
    color: var(--fg, #111);
    background: var(--bg-muted, #f3f4f6);
  }
</style>
```

- [ ] **Step 2：跑 typecheck**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck
# 期望：因 ThemeToggle 不存在而失败
```

---

## Task 3.4：写 `ThemeToggle` 组件（client island）

**Files:**
- 创建：`src/components/ThemeToggle.astro`

- [ ] **Step 1：写 `ThemeToggle.astro`**

文件：`src/components/ThemeToggle.astro`

```astro
---
---

<button id="theme-toggle" type="button" aria-label="切换暗色模式" title="切换暗色模式">
  <span class="icon-light" aria-hidden="true">☀</span>
  <span class="icon-dark" aria-hidden="true">☾</span>
</button>

<script is:inline>
  (() => {
    const KEY = 'theme';
    const root = document.documentElement;
    const apply = (t) => root.setAttribute('data-theme', t);
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') {
      apply(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      apply('dark');
    } else {
      apply('light');
    }
    const btn = document.getElementById('theme-toggle');
    btn?.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      localStorage.setItem(KEY, next);
    });
  })();
</script>

<style>
  #theme-toggle {
    background: transparent;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    color: var(--fg, #111);
  }
  #theme-toggle .icon-dark {
    display: none;
  }
  :global([data-theme='dark']) #theme-toggle .icon-light {
    display: none;
  }
  :global([data-theme='dark']) #theme-toggle .icon-dark {
    display: inline;
  }
</style>
```

- [ ] **Step 2：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 3：跑 build 验证（应成功）**

```bash
cd /Users/zhangchao/2026/blog
bun run build
# 期望：成功
```

- [ ] **Step 4：提交 Header + ThemeToggle**

```bash
cd /Users/zhangchao/2026/blog
git add src/components/Header.astro src/components/ThemeToggle.astro
git commit -m "feat(components): Header with nav and ThemeToggle island"
```

---

## Task 3.5：写 `PostCard` 组件 + 测试

**Files:**
- 创建：`src/components/PostCard.astro`、`tests/components/PostCard.test.ts`

- [ ] **Step 1：先写 PostCard 失败测试**

文件：`tests/components/PostCard.test.ts`

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import PostCard from '@components/PostCard.astro';

describe('PostCard', () => {
  test('渲染标题、日期、tags', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostCard, {
      request: new Request('https://blog.zhangzichuan.cn/'),
      props: {
        post: {
          slug: 'hello-world',
          data: {
            title: '你好，世界',
            description: 'desc',
            pubDatetime: new Date('2026-06-01'),
            tags: ['随笔', 'Meta'],
            category: '随笔',
            draft: false,
            math: false,
            mermaid: false,
          },
        },
      },
    });
    expect(html).toContain('你好，世界');
    expect(html).toContain('2026-06-01');
    expect(html).toContain('随笔');
    expect(html).toContain('Meta');
    expect(html).toContain('/posts/hello-world');
  });
});
```

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：FAIL "Cannot find module"
```

- [ ] **Step 3：写 `PostCard.astro`**

文件：`src/components/PostCard.astro`

```astro
---
import { formatDate } from '@utils/formatDate';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}
const { post } = Astro.props as Props;
const href = `/posts/${post.id}`;
---

<article class="post-card">
  <a href={href} class="post-link">
    <h2 class="post-title">{post.data.title}</h2>
  </a>
  <p class="post-meta">
    <time datetime={post.data.pubDatetime.toISOString()}>
      {formatDate(post.data.pubDatetime)}
    </time>
    {post.data.category && <span class="category"> · {post.data.category}</span>}
  </p>
  <p class="post-desc">{post.data.description}</p>
  {post.data.tags.length > 0 && (
    <ul class="post-tags">
      {post.data.tags.map((t) => (
        <li><a href={`/tags/${encodeURIComponent(t)}`}>#{t}</a></li>
      ))}
    </ul>
  )}
</article>

<style>
  .post-card {
    padding: 1rem 0;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }
  .post-link {
    color: inherit;
    text-decoration: none;
  }
  .post-link:hover .post-title {
    text-decoration: underline;
  }
  .post-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
  }
  .post-meta {
    margin: 0 0 0.5rem 0;
    color: var(--fg-muted, #6b7280);
    font-size: 0.85rem;
  }
  .post-desc {
    margin: 0 0 0.5rem 0;
  }
  .post-tags {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .post-tags a {
    color: var(--fg-muted, #6b7280);
    text-decoration: none;
    font-size: 0.85rem;
  }
  .post-tags a:hover {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：3 passed
```

- [ ] **Step 5：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 6：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/components/PostCard.astro tests/components/PostCard.test.ts
git commit -m "feat(components): PostCard with TDD"
```

---

## Task 3.6：写 `TagList` 组件 + 测试

**Files:**
- 创建：`src/components/TagList.astro`、`tests/components/TagList.test.ts`

- [ ] **Step 1：先写失败测试**

文件：`tests/components/TagList.test.ts`

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import TagList from '@components/TagList.astro';

describe('TagList', () => {
  test('渲染传入的 tags 列表与正确 URL', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TagList, {
      request: new Request('https://blog.zhangzichuan.cn/'),
      props: { tags: ['随笔', 'Meta'] },
    });
    expect(html).toContain('/tags/随笔');
    expect(html).toContain('/tags/Meta');
    expect(html).toContain('#随笔');
  });
});
```

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：FAIL
```

- [ ] **Step 3：写 `TagList.astro`**

文件：`src/components/TagList.astro`

```astro
---
interface Props {
  tags: readonly string[];
}
const { tags } = Astro.props as Props;
---

{tags.length > 0 && (
  <ul class="tag-list">
    {tags.map((t) => (
      <li>
        <a href={`/tags/${encodeURIComponent(t)}`}>#{t}</a>
      </li>
    ))}
  </ul>
)}

<style>
  .tag-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tag-list a {
    color: var(--fg-muted, #6b7280);
    text-decoration: none;
    font-size: 0.85rem;
  }
  .tag-list a:hover {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
bun run test
# 期望：4 passed
```

- [ ] **Step 5：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/components/TagList.astro tests/components/TagList.test.ts
git commit -m "feat(components): TagList with TDD"
```

---

## Task 3.7：写 `Prose` 组件

**Files:**
- 创建：`src/components/Prose.astro`

- [ ] **Step 1：写 `Prose.astro`**

文件：`src/components/Prose.astro`

```astro
<div class="prose">
  <slot />
</div>

<style is:global>
  .prose {
    line-height: 1.7;
    color: var(--fg, #111);
  }
  .prose h1, .prose h2, .prose h3, .prose h4 {
    line-height: 1.3;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  .prose p {
    margin: 0.75em 0;
  }
  .prose a {
    color: var(--accent, #2563eb);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .prose code {
    background: var(--bg-muted, #f3f4f6);
    padding: 0.125em 0.25em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .prose pre {
    background: var(--bg-muted, #1f2937);
    color: var(--fg-inverse, #f9fafb);
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
  .prose pre code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
  .prose blockquote {
    border-left: 3px solid var(--border, #e5e7eb);
    padding-left: 1rem;
    margin: 1em 0;
    color: var(--fg-muted, #6b7280);
  }
  .prose ul, .prose ol {
    padding-left: 1.5rem;
  }
  .prose img {
    max-width: 100%;
    height: auto;
  }
  .prose table {
    border-collapse: collapse;
    width: 100%;
  }
  .prose th, .prose td {
    border: 1px solid var(--border, #e5e7eb);
    padding: 0.5rem;
  }
</style>
```

- [ ] **Step 2：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format
```

- [ ] **Step 3：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/components/Prose.astro
git commit -m "feat(components): Prose wrapper for article typography"
```

---

## Task 3.8：门禁全绿 + 打 tag

**Files:**
- 修改：（无）

- [ ] **Step 1：跑完整门禁套件**

```bash
cd /Users/zhangchao/2026/blog
bun run test && bun run typecheck && bun run lint && bun run format:check && bun run build
echo "ALL GREEN"
```

- [ ] **Step 2：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-03-components
git tag --list 'phase-03*'
# 期望：phase-03-components
```

---

## 子计划 03 完成

进入 `04-layouts-and-pages.md` 前确认：

- [ ] `bun run test` 4 个组件测试全过
- [ ] `bun run typecheck && bun run lint && bun run format:check && bun run build` 全绿
- [ ] `git tag phase-03-components` 已存在
- [ ] 组件清单：Header / Footer / ThemeToggle / PostCard / TagList / Prose
- [ ] `PostCard` 链接形如 `/posts/<id>`（子计划 04 会建立对应动态路由）
