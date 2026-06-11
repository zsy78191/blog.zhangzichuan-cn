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
bun install
bun run dev      # http://localhost:4321
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
draft: false # 草稿设 true，本地可见、生产排除
math: false # 含数学公式时设为 true
mermaid: false # 含 mermaid 图时设为 true
---
```

## 部署

push `main` → CI 全绿 → 部署到 Cloudflare Pages。

## 部署所需 GitHub Secrets

| Secret                       | 用途                                    |
| ---------------------------- | --------------------------------------- |
| `CLOUDFLARE_API_TOKEN`       | Cloudflare API 令牌（Pages: Edit 权限） |
| `CLOUDFLARE_ACCOUNT_ID`      | Cloudflare 账户 ID                      |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics 站点 token     |

获取步骤见 [子计划 07](docs/superpowers/plans/2026-06-11-astro-blog/07-cloudflare-and-secrets.md)。

## 脚本

```bash
bun run dev         # 本地开发
bun run typecheck   # TypeScript + frontmatter schema
bun run lint        # ESLint
bun run format      # Prettier 写入
bun run format:check
bun run test        # vitest
bun run build       # astro check + astro build + pagefind
```

## 备案

苏ICP备18064390号-8（见页脚）。

## 许可

源码以 MIT 协议开源；文章内容版权归作者所有。
