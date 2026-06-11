# Astro 个人博客实现计划（总索引）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 从零搭建并上线一个 Astro 5 + Cloudflare Pages 的个人博客，写作走本地 Markdown，部署零运维，备案号在页脚固定展示。

**Architecture：** Astro 5.x fork 自 Astro Paper 模板，纯静态 SSG 输出 `dist/`，由 GitHub Actions 在 push `main` 时构建并调用 Cloudflare Pages API 部署；本地 Markdown 通过 Content Collections 强类型 schema 校验。

**Tech Stack：** Astro 5.x · TypeScript strict · pnpm · Content Collections (zod) · Pagefind · KaTeX · Mermaid · Cloudflare Pages · GitHub Actions · Cloudflare Web Analytics · Noto Sans SC（本地子集）

**Spec：** `docs/superpowers/specs/2026-06-11-astro-blog-design.md`

---

## 文件结构与依赖

本计划按"主题"切分，每个子计划是一个可独立完成、可独立提交的阶段。子计划之间存在依赖，必须按顺序执行。

| # | 子计划 | 内容 | 前置 |
|---|---|---|---|
| 00 | `00-scaffolding.md` | fork Astro Paper、调整 `consts.ts`、`.gitignore`、基础 Astro 配置 | — |
| 01 | `01-toolchain.md` | pnpm、TypeScript strict、ESLint、Prettier、`tsconfig.json`、package.json scripts | 00 |
| 02 | `02-content-collections.md` | `src/content.config.ts` schema + 示例文章 + 草稿过滤工具 | 01 |
| 03 | `03-core-components.md` | Header / Footer（含 ICP）/ ThemeToggle / PostCard / TagList / Prose | 02 |
| 04 | `04-layouts-and-pages.md` | BaseLayout / PostLayout + 5 个核心页面（index/about/archive/tags/categories/404） | 02, 03 |
| 05 | `05-features.md` | Pagefind 搜索、RSS、暗色模式集成、KaTeX、Mermaid 客户端回退 | 04 |
| 06 | `06-ci-cd.md` | `.github/workflows/ci.yml` + `deploy.yml` + wrangler.toml | 01 |
| 07 | `07-cloudflare-and-secrets.md` | Cloudflare Pages 项目创建、域名绑定、Analytics、GitHub Secrets 配置、首次部署冒烟 | 05, 06 |
| 08 | `08-quality-and-observability.md` | Lighthouse 跑分、Lychee 死链周报、Web Analytics 验证 | 07 |

## 增量交付原则

- 每完成一个子计划（00–08），博客就应该**可用 + 可发布**一次
- 子计划之间用 git 标签切分（如 `phase-00-scaffold`、`phase-01-toolchain`）
- 单个 task 失败 → 不进入下一子计划，先修复

## 单文件内约定

每个子计划文件 `NN-xxx.md` 都遵循：
- 顶部说明「子目标 + 任务数 + 涉及文件」
- 任务编号 `Task N.M`（N=子计划序号，M=任务序号）
- 每个 task 5 步：写失败测试 → 跑测试看失败 → 写最小实现 → 跑测试看通过 → 提交
- 完成后**该子计划根目录** git 提交 + 打 tag

## 当前进度

- [ ] 00 脚手架
- [ ] 01 工具链
- [ ] 02 Content Collections
- [ ] 03 核心组件
- [ ] 04 布局与页面
- [ ] 05 特性挂载
- [ ] 06 CI/CD
- [ ] 07 Cloudflare 端
- [ ] 08 质量与可观测

---

## 共享约定（所有子计划引用）

### 1. 路径与命名

- **项目根**：`/Users/zhangchao/2026/blog/`
- **包管理器**：pnpm 9.x
- **Node 版本**：22.x LTS
- **包名**：`blog-zhangzichuan-cn`（package.json `name` 字段）
- **站点配置单一可信源**：`src/consts.ts`

### 2. `src/consts.ts` 终态

所有子计划都引用这份常量：

```ts
// src/consts.ts
export const SITE = {
  title: '子川的博客',
  description: '技术笔记、工程实践与偶尔的杂谈',
  author: 'zhangchao',
  url: 'https://blog.zhangzichuan.cn',
  locale: 'zh-CN',
} as const;

export const NAV: { title: string; href: string }[] = [
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

export const SOCIAL: { name: string; href: string }[] = [
  { name: 'GitHub', href: 'https://github.com/zhangchao' },
  { name: 'RSS', href: '/rss.xml' },
];
```

### 3. 提交信息格式

遵循 `~/.claude/rules/git-workflow.md`：

```
<type>: <description>

<optional body>
```

类型：`feat / fix / refactor / docs / test / chore / perf / ci`

### 4. 提交人配置（首次提交前必须执行）

```bash
git config user.name "zhangchao"
git config user.email "zhangchao@users.noreply.github.com"
```

### 5. 标签命名

```
phase-00-scaffold
phase-01-toolchain
phase-02-content
phase-03-components
phase-04-layouts
phase-05-features
phase-06-cicd
phase-07-cloudflare
phase-08-quality
```

### 6. 测试约定

- **L1 必做**：`astro check`（TS + frontmatter schema）、`eslint`、CI 中 `pnpm build` 跑通
- **L2 推荐**（子计划 03、04 内含）：`vitest` + `astro/container` 组件契约测试
- **L3 端到端**（子计划 08 末尾可选）：`@playwright/test` 3 条路径
