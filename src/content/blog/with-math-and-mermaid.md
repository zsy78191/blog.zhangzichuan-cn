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
