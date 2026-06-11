# 子计划 02：Content Collections

**子目标：** 建立 Content Collections——`src/content.config.ts` schema、3 篇示例文章（含 1 篇草稿、1 篇含 math/mermaid）、`utils/formatDate` 与 `utils/filterDraft` 工具；构建时坏 frontmatter 必报错，草稿在生产构建中过滤。

**任务数：** 5

**涉及文件：**
- 创建：`src/content.config.ts`、`src/content/blog/hello-world.md`、`src/content/blog/with-math-and-mermaid.md`、`src/content/blog/draft-post.md`、`src/utils/formatDate.ts`、`src/utils/filterDraft.ts`、`src/utils/sortByPubDatetime.ts`、`src/utils/getAllTags.ts`、`src/utils/getAllCategories.ts`
- 测试：`tests/utils/formatDate.test.ts`、`tests/utils/filterDraft.test.ts`、`tests/utils/sortByPubDatetime.test.ts`
- 修改：`astro.config.mjs`（加 mdx 集成）

**前置：** 子计划 01 完成

**完成标志：**
- `pnpm typecheck` 通过
- `pnpm test` 通过（vitest）
- `pnpm build` 中 `getCollection` 调用零错；草稿不出现在 `dist/blog/` 下

---

## Task 2.1：装 mdx + vitest

**Files:**
- 修改：`package.json`（自动）

- [ ] **Step 1：装集成与测试框架**

```bash
cd /Users/zhangchao/2026/blog
pnpm add @astrojs/mdx
pnpm add -D vitest @vitest/ui happy-dom
```

- [ ] **Step 2：写入 `vitest.config.ts`**

文件：`vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@components': new URL('./src/components', import.meta.url).pathname,
      '@layouts': new URL('./src/layouts', import.meta.url).pathname,
      '@utils': new URL('./src/utils', import.meta.url).pathname,
      '@consts': new URL('./src/consts.ts', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 3：补 `package.json` scripts**

修改 `package.json` 的 `scripts` 段（新增 test 与 test:ui）：

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "typecheck": "astro check",
    "lint": "eslint . --ext .ts,.astro,.cjs",
    "lint:fix": "eslint . --ext .ts,.astro,.cjs --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore(test): add vitest + happy-dom + mdx integration"
```

---

## Task 2.2：写 utils + 测试（TDD）

**Files:**
- 创建：`src/utils/formatDate.ts`、`tests/utils/formatDate.test.ts`、`src/utils/filterDraft.ts`、`tests/utils/filterDraft.test.ts`、`src/utils/sortByPubDatetime.ts`、`tests/utils/sortByPubDatetime.test.ts`

- [ ] **Step 1：先写 `formatDate` 失败测试**

文件：`tests/utils/formatDate.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { formatDate } from '@utils/formatDate';

describe('formatDate', () => {
  test('将 ISO 日期格式化为中文 yyyy-mm-dd', () => {
    const d = new Date('2026-01-15T08:30:00Z');
    expect(formatDate(d)).toBe('2026-01-15');
  });

  test('补零月份与日期', () => {
    const d = new Date('2026-03-05T00:00:00Z');
    expect(formatDate(d)).toBe('2026-03-05');
  });
});
```

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL "Cannot find module '@utils/formatDate'"
```

- [ ] **Step 3：写最小实现 `formatDate`**

文件：`src/utils/formatDate.ts`

```ts
export function formatDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：2 passed
```

- [ ] **Step 5：先写 `filterDraft` 失败测试**

文件：`tests/utils/filterDraft.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { filterDraft } from '@utils/filterDraft';

describe('filterDraft', () => {
  test('过滤掉 draft: true 的文章', () => {
    const posts = [
      { slug: 'a', data: { draft: false } },
      { slug: 'b', data: { draft: true } },
    ] as const;
    const result = filterDraft(posts);
    expect(result.map((p) => p.slug)).toEqual(['a']);
  });

  test('空数组返回空数组', () => {
    expect(filterDraft([])).toEqual([]);
  });
});
```

- [ ] **Step 6：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL "Cannot find module '@utils/filterDraft'"
```

- [ ] **Step 7：写最小实现 `filterDraft`**

文件：`src/utils/filterDraft.ts`

```ts
type HasDraft = { data: { draft: boolean } };

export function filterDraft<T extends HasDraft>(posts: T[]): T[] {
  return posts.filter((p) => !p.data.draft);
}
```

- [ ] **Step 8：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：4 passed
```

- [ ] **Step 9：先写 `sortByPubDatetime` 失败测试**

文件：`tests/utils/sortByPubDatetime.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

describe('sortByPubDatetime', () => {
  test('按 pubDatetime 降序', () => {
    const posts = [
      { slug: 'old', data: { pubDatetime: new Date('2025-01-01') } },
      { slug: 'new', data: { pubDatetime: new Date('2026-06-01') } },
      { slug: 'mid', data: { pubDatetime: new Date('2025-12-01') } },
    ] as const;
    const result = sortByPubDatetime(posts);
    expect(result.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
  });

  test('同日期时稳定排序', () => {
    const posts = [
      { slug: 'a', data: { pubDatetime: new Date('2026-01-01') } },
      { slug: 'b', data: { pubDatetime: new Date('2026-01-01') } },
    ] as const;
    expect(sortByPubDatetime(posts).map((p) => p.slug)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 10：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL "Cannot find module"
```

- [ ] **Step 11：写最小实现 `sortByPubDatetime`**

文件：`src/utils/sortByPubDatetime.ts`

```ts
type HasPubDatetime = { data: { pubDatetime: Date } };

export function sortByPubDatetime<T extends HasPubDatetime>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const diff = b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime();
    return diff !== 0 ? diff : 0;
  });
}
```

- [ ] **Step 12：跑全部测试看通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：6 passed
```

- [ ] **Step 13：跑 typecheck + lint + format 必须全绿**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
```

- [ ] **Step 14：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/utils/ tests/ vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(content): add date, draft filter, sort utils with TDD"
```

---

## Task 2.3：写 Content Collections schema

**Files:**
- 创建：`src/content.config.ts`

- [ ] **Step 1：写入 `src/content.config.ts`**

文件：`src/content.config.ts`

```ts
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

- [ ] **Step 2：注册 mdx 集成到 `astro.config.mjs`**

文件：`astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.zhangzichuan.cn',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx()],
});
```

- [ ] **Step 3：跑 typecheck 看 schema 编译通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
# 期望：0 errors
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/content.config.ts astro.config.mjs
git commit -m "feat(content): add blog collection schema with zod"
```

---

## Task 2.4：写 3 篇示例文章

**Files:**
- 创建：`src/content/blog/hello-world.md`、`src/content/blog/with-math-and-mermaid.md`、`src/content/blog/draft-post.md`

- [ ] **Step 1：写 `hello-world.md`（普通文章）**

文件：`src/content/blog/hello-world.md`

```markdown
---
title: '你好，世界'
description: '博客的第一篇文章，介绍本站点的来由与方向。'
pubDatetime: 2026-06-01
tags: ['随笔', 'Meta']
category: '随笔'
---

## 开始

这是**子川的博客**的第一篇文章。

后续会写技术笔记、工程实践与偶尔的杂谈。

## 代码示例

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## 列表

- 长期内容
- 关注工程
- 偶尔杂谈
```

- [ ] **Step 2：写 `with-math-and-mermaid.md`（启用 math + mermaid 标志位）**

文件：`src/content/blog/with-math-and-mermaid.md`

```markdown
---
title: '带数学公式与流程图的文章'
description: '展示 KaTeX 与 Mermaid 集成的样例。'
pubDatetime: 2026-06-05
tags: ['示例', 'Markdown']
category: '技术'
math: true
mermaid: true
---

## 行内公式

爱因斯坦的质能方程：$E = mc^2$。

## 块级公式

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## Mermaid 流程图

```mermaid
graph LR
  A[写作] --> B[git push]
  B --> C[GitHub Actions]
  C --> D[Cloudflare Pages]
```
```

- [ ] **Step 3：写 `draft-post.md`（草稿）**

文件：`src/content/blog/draft-post.md`

```markdown
---
title: '草稿：尚未完成'
description: '这是草稿，生产构建中应被过滤。'
pubDatetime: 2026-06-10
tags: ['草稿']
draft: true
---

这篇是草稿。本地 `pnpm dev` 可见，`pnpm build` 中应被 `filterDraft` 排除。
```

- [ ] **Step 4：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
```

此时还没有任何页面渲染 `blog` 集合，所以 dist/ 中**不会**有 blog 路径。验证 schema 工作正常就够了。`getCollection` 的过滤行为会在子计划 04 接入首页时再验证。

- [ ] **Step 5：跑 typecheck + lint + format**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format
```

- [ ] **Step 6：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/content/blog/
git commit -m "feat(content): seed 3 sample posts (normal, math+mermaid, draft)"
```

---

## Task 2.5：写 `getAllTags` / `getAllCategories` 工具与测试

**Files:**
- 创建：`src/utils/getAllTags.ts`、`src/utils/getAllCategories.ts`、`tests/utils/getAllTags.test.ts`、`tests/utils/getAllCategories.test.ts`

- [ ] **Step 1：先写 `getAllTags` 失败测试**

文件：`tests/utils/getAllTags.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { getAllTags } from '@utils/getAllTags';

describe('getAllTags', () => {
  test('聚合多文章的 tags 并按字母排序', () => {
    const posts = [
      { slug: 'a', data: { tags: ['随笔', 'Meta'] } },
      { slug: 'b', data: { tags: ['示例', '随笔'] } },
    ] as const;
    const result = getAllTags(posts);
    expect(result).toEqual([
      { tag: 'Meta', count: 1 },
      { tag: '示例', count: 1 },
      { tag: '随笔', count: 2 },
    ]);
  });

  test('忽略空 tags 数组', () => {
    const posts = [{ slug: 'a', data: { tags: [] } }] as const;
    expect(getAllTags(posts)).toEqual([]);
  });
});
```

- [ ] **Step 2：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL "Cannot find module"
```

- [ ] **Step 3：写最小实现 `getAllTags`**

文件：`src/utils/getAllTags.ts`

```ts
type HasTags = { data: { tags: readonly string[] } };

export function getAllTags<T extends HasTags>(posts: T[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, 'zh-Hans-CN'));
}
```

- [ ] **Step 4：跑测试看通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：8 passed
```

- [ ] **Step 5：先写 `getAllCategories` 失败测试**

文件：`tests/utils/getAllCategories.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { getAllCategories } from '@utils/getAllCategories';

describe('getAllCategories', () => {
  test('按 category 字段聚合', () => {
    const posts = [
      { slug: 'a', data: { category: '技术' } },
      { slug: 'b', data: { category: '技术' } },
      { slug: 'c', data: { category: '随笔' } },
    ] as const;
    expect(getAllCategories(posts)).toEqual([
      { category: '技术', count: 2 },
      { category: '随笔', count: 1 },
    ]);
  });

  test('未指定 category 的文章不计入', () => {
    const posts = [{ slug: 'a', data: {} }] as const;
    expect(getAllCategories(posts)).toEqual([]);
  });
});
```

- [ ] **Step 6：跑测试看失败**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
# 期望：FAIL "Cannot find module"
```

- [ ] **Step 7：写最小实现 `getAllCategories`**

文件：`src/utils/getAllCategories.ts`

```ts
type HasCategory = { data: { category?: string | undefined } };

export function getAllCategories<T extends HasCategory>(
  posts: T[],
): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) {
    const c = p.data.category;
    if (c === undefined) continue;
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category, 'zh-Hans-CN'));
}
```

- [ ] **Step 8：跑全部测试 + typecheck + lint + format + build**

```bash
cd /Users/zhangchao/2026/blog
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm build
```

期望：全部退出码 0。

- [ ] **Step 9：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git add src/utils/ tests/
git commit -m "feat(content): add getAllTags, getAllCategories with TDD"
git tag phase-02-content
```

---

## 子计划 02 完成

进入 `03-core-components.md` 前确认：

- [ ] `pnpm test` 10 个测试全过
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build` 全绿
- [ ] `git tag phase-02-content` 已存在
- [ ] `src/content.config.ts` schema 字段：title/description/pubDatetime/updatedDatetime?/tags/category?/draft/math/mermaid
- [ ] utils 列表：`formatDate`、`filterDraft`、`sortByPubDatetime`、`getAllTags`、`getAllCategories`
