# Astro 个人博客计划审计报告

- **审计者**：subagent (general-purpose / claude)
- **审计日期**：2026-06-12
- **审计对象**：
  - spec：`docs/superpowers/specs/2026-06-11-astro-blog-design.md`
  - plans：`docs/superpowers/plans/2026-06-11-astro-blog/{README,00..08}.md`
- **总结**：**需重大调整** — 至少 6 处会让 plan 在按顺序执行时直接构建失败或部署失败，必须先修。其他重要问题集中在 Astro 5 API 适配、Container 测试 API 误用、Markdown layout props 不一致、以及 CI workflow 缺步骤等。

## 摘要

按当前计划顺序执行，会在 **05 features**（Mermaid 因缺浏览器构建失败）、**05.5 字体**（CDN URL 大概率 404）、**01 toolchain**（ESLint 9 + 旧 `.eslintrc.cjs` 不兼容）三处先后中断；**04 about 页**（markdown layout props 与 BaseLayout 不匹配）首次构建会报 missing title；**06 deploy**（`cloudflare/pages-action@v1` 已 archived）即使配置正确也会拿到 deprecation 警告，且未来某个时点失效；**08 lychee workflow** 缺 Node/pnpm setup，直接失败。其余问题多为 Astro 5 API 表达不准、测试断言会取不到值、备案合规与 XSS 注入等次要风险。强项是任务粒度细、TDD 节奏清晰、单一可信源思路明确，建议保留这套结构，只把致命点逐项替换。

---

## 致命问题（Blocker — 必须修复才能开始实施）

### B1 · `rehype-mermaid` 在 `strategy: 'img'` 下需要 headless 浏览器，CI 与本地都没装
- **严重度**：Blocker
- **位置**：`docs/superpowers/plans/2026-06-11-astro-blog/05-features.md:34`（`pnpm add ... rehype-mermaid`）、`05-features.md:108-111`（`[rehypeMermaid, { strategy: 'img' }]`）；spec `2026-06-11-astro-blog-design.md:227`、`:44`
- **现象**：`rehype-mermaid` 的 `img`/`img-svg`/`img-png`/`inline-svg` 策略全部依赖 **`playwright` + Chromium**（内部以 `@mermaid-js/mermaid` 在无头浏览器中渲染）。计划只装了 `rehype-mermaid`，未装 `playwright` 也未 `playwright install chromium`。`pnpm build` 第一次跑到 Task 5.2 Step 2（`grep -l 'katex' dist/...`）之前必会抛 `Cannot find module 'playwright'` 或 `Failed to launch chromium`；GitHub Actions runner 默认也没装 Chromium。
- **推荐修复**：
  1. 在 Task 5.1 加 `pnpm add -D playwright` 并在本地与 CI 中 `pnpm exec playwright install --with-deps chromium`（CI runner 镜像已带依赖，只需 `playwright install chromium`）。
  2. 在 `.github/workflows/ci.yml` 与 `deploy.yml` 的 Install 步骤后添加 `- name: Install Chromium for rehype-mermaid\n  run: pnpm exec playwright install chromium`。
  3. 或者改 `strategy: 'pre-mermaid'`（保留 mermaid 代码块，运行时由客户端 mermaid 渲染）— 这与 `PostLayout` 已有的客户端 fallback 一致，但要把 spec §2 "图表 = rehype-mermaid（SSR 为 `<img>`）" 与 §13 风险表同步改掉。
  4. 建议先尝试方案 1（保留 SSR 出图的初衷）。

### B2 · ESLint 9 默认不支持 `.eslintrc.cjs`，依赖未锁定版本
- **严重度**：Blocker
- **位置**：`01-toolchain.md:115-117`（`pnpm add -D eslint ...`，无版本号）、`01-toolchain.md:121-164`（写入 `.eslintrc.cjs`）
- **现象**：`pnpm add -D eslint` 在 2026-06 时点会装到 ESLint 9.x。ESLint 9 默认采用 flat config (`eslint.config.js`)，对旧 `.eslintrc.cjs` 需要设置 `ESLINT_USE_FLAT_CONFIG=false` 环境变量，否则启动即报错（`Could not find config file. ESLint v9.x requires eslint.config.js`）。`eslint-plugin-astro` 1.x、`@typescript-eslint` 8.x 在 ESLint 9 下都已切换到 flat config 的官方推荐写法。Task 1.4 Step 1 的 `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build` 会卡在 `pnpm lint`。
- **推荐修复**：二选一：
  - **(A)** 直接迁移到 flat config：把 `.eslintrc.cjs` 换成 `eslint.config.js`，按 `eslint-plugin-astro` 官方文档（`flat/recommended` + `@typescript-eslint` flat preset）重写；删除 `.eslintignore`（用 `ignores` 字段）。
  - **(B)** 锁版本到 ESLint 8：`pnpm add -D eslint@^8 @typescript-eslint/parser@^7 @typescript-eslint/eslint-plugin@^7 eslint-plugin-astro@^1 eslint-plugin-jsx-a11y@^6`。但这会绑死在 EOL 主版本，不建议。
  - 推荐 (A)。同时把 `lint` 脚本去掉 `--ext`（flat config 不支持，改用 `eslint .` 或在 config 中用 `files` 字段）。

### B3 · `about.md` 使用 markdown layout，但 `BaseLayout` 不接 `frontmatter` 包装
- **严重度**：Blocker
- **位置**：`04-layouts-and-pages.md:246-251`（`layout: ../layouts/BaseLayout.astro` + 顶部 frontmatter）；`04-layouts-and-pages.md:134-145`（BaseLayout 解构 `title, description, activeNav, ogImage` 而非 `frontmatter`）
- **现象**：Astro 5 中 markdown 文件用 `layout:` 字段时，被 layout 收到的 props 形态是 `{ frontmatter: {...}, headings: [...], content?, ... }`，而**不是**直接 spread frontmatter。`BaseLayout` 期望 `Astro.props.title` 是字符串，实际拿到 `undefined`，结果 `<title>${undefined} · 子川的博客</title>` 渲染异常，且 strict 下 `title === SITE.title` 比较 `undefined === '子川的博客'`，`canonical = new URL(Astro.url.pathname, SITE.url)` 仍能跑（pathname 可拿），但页面是坏的，可能 `astro check` 还会 TS 报错（`Property 'title' is missing in type ...`）。
- **推荐修复**：把 about 改成 `.astro` 页面：
  ```astro
  ---
  import BaseLayout from '@layouts/BaseLayout.astro';
  ---
  <BaseLayout title="关于" description="关于本站与作者" activeNav="/about">
    <h1>关于</h1>
    <p>你好，我是 <strong>zhangchao</strong>。</p>
    ...
  </BaseLayout>
  ```
  并把内容主体写在 `<slot>` 里。如果坚持用 markdown，则需在 `BaseLayout` 里同时接 `Props.frontmatter` 与扁平字段，或新建一个 `MarkdownPageLayout.astro` 适配 `frontmatter` → `<BaseLayout>` 转写。

### B4 · `cloudflare/pages-action@v1` 已 archived（officially deprecated）
- **严重度**：Blocker（短期可用，长期必坏；且新规则要求 OIDC，老 action 不支持）
- **位置**：`06-ci-cd.md:215`（`uses: cloudflare/pages-action@v1`）；spec `2026-06-11-astro-blog-design.md:36, 257`
- **现象**：Cloudflare 在 2024 年把 `cloudflare/pages-action` 仓库 archived，README 顶部明确指向 `cloudflare/wrangler-action@v3` + `wrangler pages deploy`。当前可能仍可运行，但官方不再修 bug；近期反馈在 wrangler 4.x 下偶有 token 解析问题；后续 Pages → Workers 迁移期可能彻底拒绝。
- **推荐修复**：把 `deploy.yml` 的部署步骤替换为：
  ```yaml
  - name: Deploy to Cloudflare Pages
    uses: cloudflare/wrangler-action@v3
    with:
      apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      command: pages deploy dist --project-name=blog-zhangzichuan-cn
      gitHubToken: ${{ secrets.GITHUB_TOKEN }}
  ```
  spec §7 与 README "技术决策" 行同步改。

### B5 · Noto Sans SC 字体 CDN URL 大概率 404
- **严重度**：Blocker
- **位置**：`05-features.md:312-313`（`curl ... https://cdn.jsdelivr.net/npm/noto-sans-sc@1.0.0/fonts/Subset/NotoSansSC-Regular.woff2`）
- **现象**：npm 上没有名为 `noto-sans-sc` 的官方包；常用的是 `@fontsource/noto-sans-sc` 或 `@fontsource-variable/noto-sans-sc`。这个 URL 几乎肯定返回 404 或空 HTML，`curl -o` 会写一个 0 字节或 HTML 文件，导致 `@font-face` 加载失败、Lighthouse Performance/CLS 下降，且 Task 5.5 Step 5 `ls dist/fonts/` 会"看似成功"实则文件无效。
- **推荐修复**：
  - 使用 `@fontsource/noto-sans-sc`（pnpm install），然后在 `fonts.css` 中 `@import '@fontsource/noto-sans-sc/400.css';`，构建期自动复制到 `_astro/`。
  - 或：从 Google Fonts CSS 拿到真实 woff2 URL（形如 `https://fonts.gstatic.com/s/notosanssc/v36/...`），下载后存到 `public/fonts/`。
  - 加一行校验：`test $(stat -f%z public/fonts/NotoSansSC-Regular.subset.woff2) -gt 100000 && echo "FONT SIZE OK"`。

### B6 · `links.yml` (Lychee 周报) 缺少 pnpm/Node setup，必失败
- **严重度**：Blocker
- **位置**：`08-quality-and-observability.md:128-140`
- **现象**：workflow 步骤序列是 `checkout → run pnpm install → run pnpm build → lychee`。runner 默认无 pnpm、且 `actions/setup-node` 也未配置。第一次跑就报 `pnpm: command not found`。
- **推荐修复**：在 `Build` 步骤前补上：
  ```yaml
  - uses: pnpm/action-setup@v4
    with: { version: 9 }
  - uses: actions/setup-node@v4
    with: { node-version: 22, cache: pnpm }
  ```
  另：`lycheeverse/lychee-action@v2` 的 `args` 字段用 `--offline` 检查本地 HTML 站内链接是可以的，但 `peter-evans/create-issue-from-file@v5` 的 `content-filepath: ./lychee/out.md` 路径与 lychee-action 默认输出位置不一致（v2 默认输出 `lychee/out.md` 是对的，但要确认 v2 是否启用 markdown reporter，需加 `format: markdown`）。

---

## 重要问题（Major — 建议修复）

### M1 · Astro Container API 多处误用
- **位置**：`03-core-components.md:58`、`:376`、`:531`；`04-layouts-and-pages.md:96`
- **现象**：
  - `BaseLayout` 中调用 `new URL(Astro.url.pathname, SITE.url)`，但 `experimental_AstroContainer.renderToString(BaseLayout, { props, slots })` 没有传 `request`，`Astro.url` 在 container 中可能为空（不同 minor 版本行为不同），断言 `expect(html).toContain('https://blog.zhangzichuan.cn/')` 取不到 canonical。
  - `BaseLayout` 内部又渲染了 `<Header>` → `<ThemeToggle>`，ThemeToggle 含 `<script is:inline>` —— Container 通常会把 `<script is:inline>` 原样吐出来，没问题，但 `<Header>` 引用 `@components/...` 经过 vitest alias，若 alias 路径末尾带 `/*` 与 `pathname` 拼接不对（详见 M3），import 解析就失败。
  - Container 的 `renderToString` 第二个参数中 `slots: { default: '<p>hello</p>' }` 传字符串可以，但要保证测试覆盖率不只看 raw text。
- **推荐修复**：
  - 在所有 Container 测试调用补 `request: new Request('https://blog.zhangzichuan.cn/test')`：
    ```ts
    const html = await container.renderToString(BaseLayout, {
      request: new Request('https://blog.zhangzichuan.cn/test'),
      props: { title: '测试页', description: 'desc' },
      slots: { default: '<p>hello</p>' },
    });
    ```
  - 在 Astro 5.x 较新版本中，`experimental_AstroContainer` 已升级为 `AstroContainer`（仍可用旧名）；保留 `experimental_` 前缀向前兼容，但要在 PR 时跟踪 release notes。

### M2 · `@astrojs/rss` 的 `items.link` 用了相对路径
- **位置**：`05-features.md:258`（`link: \`/posts/${p.id}\``）
- **现象**：RSS 2.0 标准要求 `<link>` 是绝对 URL；大多数 RSS reader（Feedly、NetNewsWire、Reeder）对相对 URL 解析行为不一致，部分会拼成 `https://feedly.com/posts/xxx`。`@astrojs/rss` 不自动拼 `site` 到 link，仅供你拼。
- **推荐修复**：
  ```ts
  link: new URL(`/posts/${p.id}/`, context.site ?? SITE.url).toString(),
  ```

### M3 · vitest `resolve.alias` 用 `pathname` + `tsconfig` 用 `paths` 末尾 `/*`，模式不对齐
- **位置**：`02-content-collections.md:46-55`；`01-toolchain.md:31-36`
- **现象**：tsconfig `paths` 用 `@components/*: ["src/components/*"]` 这种 prefix 模式；vitest alias 用 `'@components': new URL('./src/components', import.meta.url).pathname` 这种完整路径替换，**等价但有一个坑**：在 macOS / Linux 下 `pathname` 是绝对路径字符串，`import '@components/Footer.astro'` 会被替换成 `<abs>/src/components/Footer.astro` 正常工作；但 alias `@consts` 映射到 `./src/consts.ts` 是文件，而 tsconfig 写 `@consts: ["src/consts"]`（不带 `.ts`），TS 解析正常，**vitest 在 happy-dom 解析 `@consts` 时是否能识别 `.ts` 扩展取决于 vite resolver**。一般 vite 能自动加扩展，但少数情况下 `pathname` 携带 URL-decoded 字符，文件名含空格/中文路径会出错。本项目根 `/Users/zhangchao/2026/blog/` 无中文，可接受。
- **推荐修复**：alias 改用 `path.resolve(__dirname, 'src/...')` 或 `fileURLToPath(new URL(...))`，更稳：
  ```ts
  import { fileURLToPath } from 'node:url';
  resolve: {
    alias: {
      '@consts': fileURLToPath(new URL('./src/consts.ts', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      ...
    },
  },
  ```

### M4 · `PostLayout` 中 `<script type="module">` 没加 `is:inline`，会被 Vite 处理
- **位置**：`04-layouts-and-pages.md:652-657`
- **现象**：Astro 默认会把任何 `<script>` 都 hoist + vite 处理（除非加 `is:inline`）。`import('https://cdn.jsdelivr.net/npm/mermaid@10/...')` 是字符串字面量动态 import，vite 不会真去打包远程 URL，但会发警告，且某些版本会把整个 script 抽到独立 chunk 然后失去 page-specific 行为；最坏情况：vite 替换 `import.meta.url` 后导致脚本不执行。又：当前是 SSR-to-image（rehype-mermaid img 策略已经把 mermaid 转成 `<img>`），客户端 mermaid 是冗余 fallback。
- **推荐修复**：
  - 既然 rehype-mermaid 已 SSR 出图（假定 B1 修了），删掉 PostLayout 中的客户端 mermaid 块，统一靠 SSR。
  - 如要保留 fallback，加 `is:inline`：`<script is:inline type="module">...</script>`，并把 mermaid CDN URL 改为固定版本。

### M5 · KaTeX CSS 走 CDN 与 "字体不联网拉取" 原则冲突
- **位置**：`04-layouts-and-pages.md:645`（`<link rel="stylesheet" href="https://cdn.jsdelivr.net/...katex.min.css">`）；spec `2026-06-11-astro-blog-design.md:41`（字体本地）
- **现象**：Spec 强调字体本地是为了离线与中国大陆访问质量；但 KaTeX CSS 与其字体（`KaTeX_Main-Regular.woff2` 等）走 jsdelivr CDN，在大陆 jsdelivr 时常被墙。这违背一致性，且首次访问含公式文章的人会卡顿。
- **推荐修复**：
  - `pnpm add katex`（plan 已装），在 `PostLayout` 头部直接 `import 'katex/dist/katex.min.css'`（Astro 会把 CSS 与字体打到 `_astro/`，自动通过 Pages CDN 分发），不再走外部 CDN。
  - 或：把 katex CSS 复制到 `public/vendor/katex/` 并自托管。

### M6 · `[...slug].astro` 的 catch-all 与 `slug = post.id` 的边界
- **位置**：`04-layouts-and-pages.md:698-704`
- **现象**：Astro 5 glob loader 生成的 `post.id` 默认是相对 base 的路径**不含扩展名**，例如 `with-math-and-mermaid`、子目录里则是 `2024/xxx`。`[...slug]` 接受多段路径，OK。但 `params: { slug: post.id }` 当 `post.id` 含 `/`（子目录文章）时，Astro 期望 `slug` 是 `string[]` 还是 `string`？Astro 5 中 `[...slug]` 的 `Astro.params.slug` 是 `string | undefined`（包含 `/`），传入 `getStaticPaths` 时 `params.slug` 可以直接是字符串，Astro 会自动拆。**但** `getStaticPaths` 必须返回该字符串形态。当前 `params: { slug: post.id }` 当 `post.id = 'a/b'` 时生成 `/posts/a/b`，OK。当含中文（暂无）时 URL 上是 raw 中文。后者在 sitemap 与 RSS 中需 encode。
- **推荐修复**：
  - 短期可不动。如未来加子目录或中文文件名，需 `encodeURIComponent(post.id.split('/').map(encodeURIComponent).join('/'))` 用于 RSS/sitemap，并在 link 处 `encodeURI(\`/posts/${post.id}\`)`。
  - 加一条 TDD 测试：`getCollection('blog')` 返回的 entry 的 `id` 不带 `.md`。

### M7 · Pagefind 搜索：UI 选择器、中文分词、index 触发位置
- **位置**：`05-features.md:153-185`；`08-quality-and-observability.md:266-270`
- **现象**：
  - PagefindUI 渲染的 input 元素是 `input.pagefind-ui__search-input`，`type` 属性多版本下为 `"text"` 而非 `"search"`。`tests/e2e/search.spec.ts` 用 `page.waitForSelector('input[type="search"]')` 取不到，会超时失败。
  - Pagefind 默认中文索引需要 HTML 上有 `lang="zh-CN"`（已具备）且 mode 切换到 CJK；Pagefind 0.12+ 自动检测，可接受。但写作时如不加 `data-pagefind-body`，整页都被索引（含 header/footer 噪声）。可在文章 `<article>` 加 `data-pagefind-body` 提升结果质量。
  - `pagefind --site dist` 写入 `dist/pagefind/`。如 `pnpm build` 失败（rehype-mermaid 故障），pagefind 步骤也不跑，但 `search.astro` 写死引用 `/pagefind/pagefind-ui.js`，开发期间访问 `/search` 会 404，应在 noscript 之外再加一条 dev-time 提示。
- **推荐修复**：
  - e2e 选择器改 `input.pagefind-ui__search-input` 或 `[aria-label="搜索"]`（PagefindUI 可配 `translations`）。
  - 在 `<article>` 上加 `data-pagefind-body` 与 `data-pagefind-meta="title"` 等。

### M8 · Cloudflare Web Analytics 注入存在 XSS 拼接
- **位置**：`07-cloudflare-and-secrets.md:211-217`
- **现象**：`data-cf-beacon={\`{"token": "${import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN}"}\`}` 用模板字符串拼 JSON。Cloudflare token 是 hex 串，安全；但 token 由 GitHub secret 提供，若误填含 `"` 或 `</script>`，会破坏 HTML，理论上引入注入面。Astro 的 `{...}` 表达式自动 HTML-escape 是对的，但 `}` 内字符串在双引号上下文里仍可能产生坏 JSON。
- **推荐修复**：用 `JSON.stringify` 生成属性值，且只在构建期消费：
  ```astro
  ---
  const cfToken = import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN;
  const cfBeacon = cfToken ? JSON.stringify({ token: cfToken }) : null;
  ---
  {cfBeacon && (
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={cfBeacon}></script>
  )}
  ```

### M9 · Mermaid SSR 出图 + 客户端回退 = 双倍重量、双倍闪烁
- **位置**：spec `2026-06-11-astro-blog-design.md:44, 200`；`04-layouts-and-pages.md:651-658`
- **现象**：rehype-mermaid `strategy: 'img'` 输出 `<img>` 已含完整图。前端再加 mermaid 客户端脚本（~700KB ESM）"以防失败"，是 backup 但增加首屏体积。文档中两边都说要做，未明确"二选一"。
- **推荐修复**：明确策略——MVP 用 SSR `img`，删掉客户端回退；若 SSR 不稳定，再回到 `pre-mermaid` + 客户端方案，二选一不重叠。

### M10 · `i18n` 配置对单语言站点是不必要噪声
- **位置**：`00-scaffolding.md:161-167`；`02-content-collections.md:321-327`
- **现象**：Astro 5 的 i18n 集成会注入 `Astro.currentLocale`、root middleware 与可选的路由重写，对单语言站点纯属负担。`prefixDefaultLocale: false` 时虽不加路径前缀，但仍在 `dist/zh-CN/` 与 `dist/` 中可能生成重复或干扰 sitemap。也会让 `lang` 检测与 Pagefind 的 CJK 模式判断变复杂。
- **推荐修复**：彻底删除 `i18n` 段。`<html lang={SITE.locale}>` 已在 `BaseLayout` 显式声明 `zh-CN`，无需 i18n 集成。

### M11 · `trailingSlash: 'ignore'` + Cloudflare 静态托管可能造成 canonical 漂移
- **位置**：`00-scaffolding.md:161`；`04-layouts-and-pages.md:148`
- **现象**：Astro 默认 `build.format: 'directory'`，输出 `dist/posts/foo/index.html`。Cloudflare Pages 同时响应 `/posts/foo` 与 `/posts/foo/`。canonical 用 `Astro.url.pathname` 取到的是构建期 path（带斜杠），所有访问都会被一个 canonical 指向同一 URL；但 Google/Bing 仍可能索引两个 URL 视为重复内容。
- **推荐修复**：
  - 改 `trailingSlash: 'always'`（与 `build.format: 'directory'` 一致），让 Astro 静态生成时的内部链接全部带斜杠。
  - 或 `trailingSlash: 'never'` + `build.format: 'file'`，输出 `dist/posts/foo.html`。
  - 任一明确即可，"ignore" 仅在 dev 时有用，生产无意义。

### M12 · CI 与 Deploy 重复 build，未复用 artifact
- **位置**：`06-ci-cd.md:128-138`（CI 上传 `dist`）；`06-ci-cd.md:211-212`（Deploy 重新 build）
- **现象**：CI 已 build + 上传 artifact，但 Deploy job 在另一个 workflow 又跑了一次。一致性上没问题，但浪费 ~1 分钟构建时间，且 rehype-mermaid + chromium 安装在两个 workflow 都要做。
- **推荐修复**：可选合并为单一 workflow，使用 job dependency：
  ```yaml
  jobs:
    build:  # 同 CI
    deploy:
      needs: build
      if: github.ref == 'refs/heads/main'
      steps:
        - uses: actions/download-artifact@v4
        - uses: cloudflare/wrangler-action@v3
          with: { command: pages deploy dist --project-name=... }
  ```

### M13 · `astro check` 是否真能在 01-toolchain 阶段通过
- **位置**：`01-toolchain.md:88-94`（strict 启用后立刻 typecheck）
- **现象**：01 阶段除 `index.astro` 与 `consts.ts` 外几乎无文件；index 只用了 `SITE.locale, SITE.title, SITE.description`，strictest 下应通过。但 `tsconfig.json` 的 `include: ["**/*"]` 会把根目录的 `astro.config.mjs`（.mjs 不在 TS 编译范围，OK 被自动跳过）与未来的 `tests/` 全部纳入。先期通过没问题。
- **推荐修复**：现状可接受。建议把 `astro.config.*` 排除：`"exclude": ["dist", "node_modules", "astro.config.mjs"]`。

### M14 · Container 测试断言 CSS 变量值会拿不到
- **位置**：`03-core-components.md:64-77`、`:381-407`
- **现象**：测试只断言文本与链接（`expect(html).toContain('苏ICP备18064390号-8')`），不依赖 `var(--fg)` 实际解析，因此 happy-dom 不会有 CSS 解析问题。**可接受**，但若未来扩展到检查样式（如计算后的 color），需切换 jsdom + 模拟 stylesheet。

---

## 次要建议（Minor — 可选优化）

### m1 · `tags/[tag].astro` 与 `categories/[category].astro` 高度重复
- **位置**：`04-layouts-and-pages.md:415-450, 545-580`
- **建议**：保留当前 YAGNI 合理；若日后再加 archive-by-year 之类的第三个 facet，再抽 `TaxonomyPage.astro` 共享组件。

### m2 · `Math.astro` / `Mermaid.astro` 在 spec §5 提到但未实现
- **位置**：spec `2026-06-11-astro-blog-design.md:148-149`
- **建议**：从 spec §5 删除这两行，因为 plan 04 中直接在 `PostLayout` 内联 `<link>` 与 `<script>`，未抽组件——这是合理的简化，但应保持 spec 与 plan 一致。

### m3 · `aria-current={... ? 'page' : undefined}` 在 Astro 模板中的行为
- **位置**：`03-core-components.md:210`
- **建议**：Astro 把 `undefined` 属性整个省略（即不渲染 `aria-current=""`），这是预期且符合 a11y 最佳实践。无需改。

### m4 · `pnpm format` 后接 `pnpm format:check` 的非确定性顾虑
- **位置**：`02-content-collections.md:262-267`、多处
- **建议**：Prettier 是幂等的，format 后 format:check 永远过。无非确定性。

### m5 · ICP 备案号位置合规
- **位置**：`03-core-components.md:108-110`（Footer 中 `<a target="_blank" rel="noopener noreferrer">`）
- **建议**：工信部规则要求"网站底部居中位置、可点击至 beian.miit.gov.cn"。当前 `Footer` 使用 `align-items: center` flex 列布局，居中要求满足。`target="_blank"` 合规允许。`rel="noopener noreferrer"` 没问题。建议在 Footer 增加 `aria-label="ICP 备案信息"`。

### m6 · `Math.astro` 的"按页注入"思路被舍弃后 `math: true` flag 价值还在
- **位置**：spec `2026-06-11-astro-blog-design.md:188`；`04-layouts-and-pages.md:645`
- **建议**：`math` flag 现在只控制是否注入 KaTeX CSS。结合 M5 改为本地 katex CSS 后，仍按 flag 条件注入可降低无公式页的 CSS 体积，保留即可。

### m7 · `pnpm dev` 期间 frontmatter schema 错误何时暴露
- **位置**：`02-content-collections.md` 整体
- **建议**：`pnpm dev` 在请求页面时会触发 Content Collection 加载，schema 错误会即时报到终端与浏览器 overlay。无需额外步骤，但 README 写作流程应说明 "保存 .md 后看终端确认 schema 无错"。

### m8 · `concurrency: deploy-pages` 与并发 push 的边界
- **位置**：`06-ci-cd.md:182-183`
- **建议**：当前 `cancel-in-progress: true` 会在第二次 push 时取消第一次部署。对静态站可接受。

### m9 · `lighthouse` 装到 devDependencies 但报告路径未加 `.gitignore`
- **位置**：`08-quality-and-observability.md:50-72`
- **建议**：`./lighthouse-home.report.json` 与 `.report.html` 落在仓库根，未在 `.gitignore`。Task 8.1 Step 7 仅说 "期望无新增"，但实际会有。加 `lighthouse-*.report.{json,html}` 到 `.gitignore`。

### m10 · `.env.example` 把 secrets 占位提交是惯例，无敏感泄漏
- **位置**：`07-cloudflare-and-secrets.md:110-116`
- **建议**：合规。

### m11 · `pnpm/action-setup@v4` 中 `version: 9` 字符串建议改 `'9.x'`
- **位置**：`06-ci-cd.md:103, 199`
- **建议**：v4 接受 number 或 string，`9` 会被解析为 9.0.0。pin 到精确补丁号或写 `'9'` 更稳。

### m12 · `getStaticPaths` 中 dynamic params 含中文
- **位置**：`04-layouts-and-pages.md:432-436`（`tag` 直接作为 param）
- **建议**：Astro 5 会自动对 params 做 URL encode，dist 里目录确实是中文（不是 punycode）。Cloudflare Pages 静态分发对中文路径 OK，但 sitemap 中 URL 是否 encode 取决于 `@astrojs/sitemap` 版本（一般 encode 为 `%E9%9A%8F%E7%AC%94`）。`PostCard` 与 `TagList` 已用 `encodeURIComponent`，一致性 OK。

### m13 · `cron: '0 1 * * 1'` 与 "9:00 Asia/Shanghai" 等价
- **位置**：`08-quality-and-observability.md:117`
- **建议**：UTC 01:00 = CST 09:00，正确。

### m14 · 写作流程：`pnpm format && pnpm build` 顺序合理
- **位置**：`08-quality-and-observability.md:397-401`
- **建议**：合规，"push 即发布" 等价。

---

## 已验证良好的部分

1. **`src/consts.ts` 作为单一可信源** 的设计（README + 00 + 03 + 04 + 07 一致引用），明显降低后续配置漂移风险。
2. **TDD 节奏 + 增量 tag** 的做法（每个子计划末打 `phase-NN-xxx` tag，破坏后能回滚），契合 spec §15 验收的可追踪性。
3. **草稿过滤工具集中在 `filterDraft`** 并在所有列表页（index/archive/tags/categories/posts/rss）都显式调用，且有 TDD 覆盖；这是 spec §13 "草稿在搜索结果泄露" 的有效缓解。
4. **Content Collections schema 用 zod 强约束 + `astro check`** 把坏 frontmatter 阻在构建期，写作流程错误反馈快。
5. **CI 的 concurrency + cancel-in-progress + timeout-minutes** 配置合理，避免长尾构建堆积。
6. **`PostCard`、`TagList`、`Footer` 的 Container TDD 测试** 覆盖关键断言（ICP 文案、链接、URL 编码），断言点选择得当。

---

## 立即行动建议（按优先级）

1. **B1 + B5：先动一根脏依赖链 + 一根脏 URL**。新增 `playwright` + `playwright install chromium` 到 Task 5.1 与 CI；同时换 Noto Sans SC 来源（强烈建议 `@fontsource/noto-sans-sc`）。这两个修了，05 子计划才有可能跑通。
2. **B2：把 `.eslintrc.cjs` 迁到 flat `eslint.config.js`**（或锁 eslint@8）。这是 01 子计划的门，否则后面所有 `pnpm lint` 都过不去。
3. **B3 + B4：修 `about.md` → `about.astro`，并把 `pages-action@v1` 换 `wrangler-action@v3`**。这是首次部署后第一个真实用户感知的页面与第一个 CI/CD 失败点。
