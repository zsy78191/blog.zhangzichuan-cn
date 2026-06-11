# 子计划 00：脚手架（Scaffolding）

**子目标：** 从零建立项目骨架——初始化 git、装 Astro 5.x、建立 `src/consts.ts` 单一配置源、补 `.gitignore`，让 `pnpm dev` 能起来且只输出空首页。

**任务数：** 5

**涉及文件：**
- 创建：`package.json`、`.gitignore`、`astro.config.mjs`、`tsconfig.json`、`src/consts.ts`、`src/pages/index.astro`、`src/env.d.ts`
- 修改：（无，新建仓库）

**前置：** 无

**完成标志：** `pnpm dev` 启动后访问 `http://localhost:4321/` 看到"子川的博客"占位文案；`pnpm build` 输出 `dist/index.html`。

---

## Task 0.1：初始化仓库与提交人

**Files:**
- 创建：`.git/`

- [ ] **Step 1：确认空目录**

```bash
cd /Users/zhangchao/2026/blog
ls -la
# 期望：除了 . 和 .. 之外什么都没有（或只有之前 spec 的 docs 目录）
```

- [ ] **Step 2：配置 git 提交人（README 共享约定）**

```bash
cd /Users/zhangchao/2026/blog
git config user.name "zhangchao"
git config user.email "zhangchao@users.noreply.github.com"
```

- [ ] **Step 3：提交一个空的初始 commit 占位**

```bash
cd /Users/zhangchao/2026/blog
git commit --allow-empty -m "chore: initialize empty repository"
```

- [ ] **Step 4：打 tag `phase-00-start`**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-00-start
```

---

## Task 0.2：创建 `.gitignore`

**Files:**
- 创建：`.gitignore`

- [ ] **Step 1：写入 `.gitignore`**

文件：`.gitignore`

```gitignore
# dependencies
node_modules/
.pnpm-store/

# build output
dist/
.output/
.astro/

# generated
pagefind/
*.log
.DS_Store
.env
.env.local
.env.*.local

# editor
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/

# misc
*.tsbuildinfo
.cache/
```

- [ ] **Step 2：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .gitignore
git commit -m "chore: add .gitignore for Astro + Node"
```

---

## Task 0.3：创建 `package.json` 与基础 Astro 配置

**Files:**
- 创建：`package.json`、`astro.config.mjs`、`tsconfig.json`、`src/env.d.ts`

- [ ] **Step 1：写入 `package.json`**

文件：`package.json`

```json
{
  "name": "blog-zhangzichuan-cn",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "description": "Personal blog at blog.zhangzichuan.cn",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2：写入 `tsconfig.json`（宽松版，Task 1.1 会升级到 strict）**

文件：`tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/base",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3：写入 `src/env.d.ts`**

文件：`src/env.d.ts`

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 4：写入 `astro.config.mjs`（最简，后续 task 增量加 integrations）**

文件：`astro.config.mjs`

```js
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.zhangzichuan.cn',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
    routing: { prefixDefaultLocale: false },
  },
});
```

- [ ] **Step 5：提交（先不装依赖，等 Task 1.1 一起装）**

```bash
cd /Users/zhangchao/2026/blog
git add package.json astro.config.mjs tsconfig.json src/env.d.ts
git commit -m "chore(scaffold): add package.json, astro.config, tsconfig, env types"
```

---

## Task 0.4：创建 `src/consts.ts`（站点单一可信源）

**Files:**
- 创建：`src/consts.ts`

- [ ] **Step 1：写入 `src/consts.ts`**

文件：`src/consts.ts`

```ts
export const SITE = {
  title: '子川的博客',
  description: '技术笔记、工程实践与偶尔的杂谈',
  author: 'zhangchao',
  url: 'https://blog.zhangzichuan.cn',
  locale: 'zh-CN',
} as const;

export const NAV: ReadonlyArray<{ title: string; href: string }> = [
  { title: '首页', href: '/' },
  { title: '归档', href: '/archive' },
  { title: '标签', href: '/tags' },
  { title: '分类', href: '/categories' },
  { title: '关于', href: '/about' },
  { title: '搜索', href: '/search' },
];

export const ICP = {
  text: '苏ICP备18064390号-8',
  link: 'https://beian.miit.gov.cn/',
} as const;

export const SOCIAL: ReadonlyArray<{ name: string; href: string }> = [
  { name: 'GitHub', href: 'https://github.com/zhangchao' },
  { name: 'RSS', href: '/rss.xml' },
];
```

- [ ] **Step 2：提交**

```bash
cd /Users/zhangchao/2026/blog
git add src/consts.ts
git commit -m "feat(scaffold): add consts.ts as single source of truth for site config"
```

---

## Task 0.5：创建占位首页并验证 dev/build

**Files:**
- 创建：`src/pages/index.astro`

- [ ] **Step 1：写入占位首页**

文件：`src/pages/index.astro`

```astro
---
import { SITE } from '../consts';
---

<!doctype html>
<html lang={SITE.locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{SITE.title}</title>
    <meta name="description" content={SITE.description} />
  </head>
  <body>
    <main>
      <h1>{SITE.title}</h1>
      <p>{SITE.description}</p>
    </main>
  </body>
</html>
```

- [ ] **Step 2：装 Astro 与最小依赖（这是本子计划唯一一次 `pnpm install`）**

```bash
cd /Users/zhangchao/2026/blog
pnpm add astro@^5
```

- [ ] **Step 3：跑 dev 验证（前台运行 3 秒后 Ctrl+C）**

```bash
cd /Users/zhangchao/2026/blog
timeout 5 pnpm dev || true
# 期望：stdout 出现 "Local: http://localhost:4321/"
```

- [ ] **Step 4：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：stdout 出现 "Complete!" 且 dist/index.html 存在
ls dist/
# 期望看到 index.html
```

- [ ] **Step 5：提交并打 phase-00 tag**

```bash
cd /Users/zhangchao/2026/blog
git add src/pages/index.astro package.json pnpm-lock.yaml
git commit -m "feat(scaffold): placeholder homepage consuming SITE consts"
git tag phase-00-scaffold
git log --oneline
```

**完成验证：**

```bash
cd /Users/zhangchao/2026/blog
git tag --list 'phase-00*'
# 期望：phase-00-start、phase-00-scaffold
```

---

## 子计划 00 完成

进入 `01-toolchain.md` 前确认：

- [ ] `pnpm build` 退出码 0
- [ ] `dist/index.html` 存在
- [ ] `git tag phase-00-scaffold` 已存在
- [ ] `src/consts.ts` 是所有页面/组件 import 配置的唯一来源
