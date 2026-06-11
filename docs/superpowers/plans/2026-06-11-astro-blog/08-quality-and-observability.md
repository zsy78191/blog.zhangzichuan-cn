# 子计划 08：质量与可观测性（Lighthouse + 死链周报 + Analytics 验证）

**子目标：** 跑 Lighthouse 验证 SPEC §12 性能基线达标；加 Lychee 死链周报 workflow；验证 Cloudflare Web Analytics 数据上报；可选 e2e 测试。

**任务数：** 4

**涉及文件：**
- 创建：`.github/workflows/links.yml`（Lychee 周报）
- 测试：`tests/e2e/home.spec.ts`（可选）、`tests/e2e/dark-mode.spec.ts`（可选）、`tests/e2e/search.spec.ts`（可选）、`playwright.config.ts`（可选）
- 修改：`README.md`（补 e2e 说明，可选）

**前置：** 子计划 07 完成；博客已可访问

**完成标志：**
- 本地 Lighthouse 跑首页与单文章页：4 个维度均 ≥ 95
- Lychee 周报 workflow 配好（周一跑）
- Web Analytics 1 天后看到 PV/UV
- 可选：e2e 3 条用例通过

---

## Task 8.1：本地跑 Lighthouse（性能基线）

**Files:**
- 修改：（无；只读不写）

- [ ] **Step 1：装 Lighthouse CLI**

```bash
cd /Users/zhangchao/2026/blog
bun add -d lighthouse
```

- [ ] **Step 2：本地 build + preview**

```bash
cd /Users/zhangchao/2026/blog
bun run build
bun run preview &
PREVIEW_PID=$!
sleep 3
echo "preview started pid=$PREVIEW_PID"
# 期望：stdout 出现 "Local: http://localhost:4321/"
```

- [ ] **Step 3：跑首页 Lighthouse（桌面）**

```bash
cd /Users/zhangchao/2026/blog
npx lighthouse http://localhost:4321/ \
  --output json --output html \
  --output-path ./lighthouse-home \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop \
  --quiet
# 期望：4 个分数均 >= 95
node -e "const r=require('./lighthouse-home.report.json'); const cats=r.categories; for (const k of Object.keys(cats)) console.log(k, Math.round(cats[k].score*100))"
```

- [ ] **Step 4：跑单文章页 Lighthouse**

```bash
cd /Users/zhangchao/2026/blog
npx lighthouse http://localhost:4321/posts/with-math-and-mermaid/ \
  --output json \
  --output-path ./lighthouse-post \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop \
  --quiet
node -e "const r=require('./lighthouse-post.report.json'); const cats=r.categories; for (const k of Object.keys(cats)) console.log(k, Math.round(cats[k].score*100))"
```

- [ ] **Step 5：分数不达标时排查**

如果某维度 < 95：
- Performance：检查图片、字体、JS island
- Accessibility：用 `axe` 找具体元素
- Best Practices：检查 HTTPS、HSTS、console errors
- SEO：检查 robots.txt、sitemap、meta description

记录问题到子计划 08 的"故障排查"段，**MVP 阶段**分数 ≥ 90 即可接受；非核心页（如 tags/[tag]）不强求。

- [ ] **Step 6：关掉 preview**

```bash
cd /Users/zhangchao/2026/blog
kill $PREVIEW_PID 2>/dev/null || true
```

- [ ] **Step 7：提交（如有新增）**

```bash
cd /Users/zhangchao/2026/blog
git status
# 期望：无新增文件（lighthouse 报告在 .gitignore）
```

---

## Task 8.2：Lychee 死链周报 workflow

**Files:**
- 创建：`.github/workflows/links.yml`

- [ ] **Step 1：写 `.github/workflows/links.yml`**

文件：`.github/workflows/links.yml`

```yaml
name: link-check

on:
  schedule:
    # 每周一 9:00 (Asia/Shanghai ≈ UTC 1:00)
    - cron: '0 1 * * 1'
  workflow_dispatch:

jobs:
  lychee:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      issues: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup bun
        # B6：原版缺失 bun/Node setup，lychee job 会因 bun 命令不存在而失败
        uses: oven-sh/setup-bun@v2

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: bun install --frozen-lockfile

      # B1：构建需要 chromium（rehype-mermaid strategy: 'img'）
      - name: Install Playwright Chromium
        run: bunx playwright install --with-deps chromium

      - name: Build
        run: bun run build

      - name: lychee link checker
        uses: lycheeverse/lychee-action@v2
        with:
          args: --offline 'dist/**/*.html' --no-progress --exclude-loopback --exclude-mail
          jobSummary: true

      - name: Create issue on failure
        if: failure()
        uses: peter-evans/create-issue-from-file@v5
        with:
          title: 'Link check failed'
          content-filepath: ./lychee/out.md
          labels: broken-link
```

- [ ] **Step 2：本地语法校验**

```bash
cd /Users/zhangchao/2026/blog
npx --yes actionlint .github/workflows/links.yml
# 期望：0 错
```

- [ ] **Step 3：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
bun run build
```

- [ ] **Step 4：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .github/workflows/links.yml
git commit -m "ci: weekly Lychee link check, GitHub Issue on failure"
```

---

## Task 8.3：可选 Playwright e2e 测试

**Files:**
- 创建：`tests/e2e/home.spec.ts`、`tests/e2e/dark-mode.spec.ts`、`tests/e2e/search.spec.ts`、`playwright.config.ts`
- 修改：`package.json`（scripts）、`README.md`

- [ ] **Step 1：决定是否纳入 MVP**

- 如果要进 MVP：继续下面所有 Step
- 如果推迟到 post-MVP：跳过此 Task，删除已创建文件，直接进 Task 8.4

- [ ] **Step 2：装 Playwright**

```bash
cd /Users/zhangchao/2026/blog
bun add -d @playwright/test
bunx playwright install --with-deps chromium
```

- [ ] **Step 3：写 `playwright.config.ts`**

文件：`playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 4：写 3 个 e2e 用例**

文件：`tests/e2e/home.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('home → archive → article → tag', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '子川的博客' })).toBeVisible();
  await page.getByRole('link', { name: '归档' }).click();
  await expect(page).toHaveURL(/\/archive/);
  await page.getByRole('link', { name: '你好，世界' }).first().click();
  await expect(page).toHaveURL(/\/posts\/hello-world/);
  await page.getByRole('link', { name: '#随笔' }).first().click();
  await expect(page).toHaveURL(/\/tags\/随笔/);
});
```

文件：`tests/e2e/dark-mode.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('dark mode toggle persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换暗色模式' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

文件：`tests/e2e/search.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('search returns results for "你好"', async ({ page }) => {
  await page.goto('/search');
  // M7：Pagefind UI 实际生成的是 <input class="pagefind-ui__search-input">，
  // 不能用 input[type=search]（实际是 text）或其他通用 selector。
  await page.waitForSelector('input.pagefind-ui__search-input', { timeout: 5000 });
  await page.fill('input.pagefind-ui__search-input', '你好');
  await expect(page.getByText('你好，世界').first()).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 5：补 `package.json` scripts**

在 `scripts` 段加：

```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 6：跑 e2e 验证**

```bash
cd /Users/zhangchao/2026/blog
bun run e2e
# 期望：3 passed
```

- [ ] **Step 7：跑完整门禁**

```bash
cd /Users/zhangchao/2026/blog
bun run typecheck && bun run lint && bun run format && bun run test && bun run build && bun run e2e
echo "ALL GREEN"
```

- [ ] **Step 8：提交**

```bash
cd /Users/zhangchao/2026/blog
git add tests/e2e/ playwright.config.ts package.json bun.lock
git commit -m "test(e2e): Playwright smoke tests for home/dark-mode/search"
```

---

## Task 8.4：Analytics 24h 数据 + 验收

**Files:**
- 修改：（无）

- [ ] **Step 1：让真实用户访问**

私下在朋友圈/群里发博客链接，让 ≥ 3 个不同 IP 浏览：

- 首页 `/`
- 至少 1 篇文章 `/posts/with-math-and-mermaid/`
- `/search` 并搜索一次

- [ ] **Step 2：24h 后查 Cloudflare Web Analytics**

URL：https://dash.cloudflare.com/?to=/:account/web-analytics

期望：
- blog.zhangzichuan.cn 站点记录 ≥ 3 个 visits
- 至少 1 个 unique visitor
- top pages 含 `/` 与 `/posts/with-math-and-mermaid/`

- [ ] **Step 3：跑最终验收清单**

逐条对照 SPEC §15：

```markdown
- [ ] bun run typecheck / lint / format:check / build 全部通过
- [ ] 推 main 后 ≤ 5 分钟博客可访问
- [ ] https://blog.zhangzichuan.cn/ 首页展示 5 篇文章 + 简介
- [ ] 页脚固定位置显示 苏ICP备18064390号-8 跳转至工信部
- [ ] 暗色模式可切换并持久化
- [ ] /search 全文检索可用
- [ ] /rss.xml 输出有效 RSS 2.0
- [ ] Lighthouse 四个维度 ≥ 95
- [ ] 草稿（draft: true）生产构建不可见，且不进入搜索索引
```

- [ ] **Step 4：打最终 tag**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-08-quality
git tag v0.1.0
git push origin --tags
```

- [ ] **Step 5：在 README 加 e2e 说明（仅当 8.3 做了）**

如做了 8.3，修改 `README.md` 的"脚本"段补：

```markdown
bun run e2e         # Playwright e2e（需先 bun run build）
```

并提交：

```bash
cd /Users/zhangchao/2026/blog
git add README.md
git commit -m "docs: README mention e2e script"
git push origin main
```

---

## 子计划 08 完成（MVP 收尾）

进入"日常维护"模式前确认：

- [ ] Lighthouse 4 维度 ≥ 95（首页 + 1 个文章页）
- [ ] Lychee 周报 workflow 配好
- [ ] Web Analytics 24h 后有真实数据
- [ ] （可选）Playwright 3 个 e2e 全过
- [ ] `git tag phase-08-quality` 与 `git tag v0.1.0` 已存在
- [ ] SPEC §15 验收清单全部勾选
- [ ] 博客稳定运行 1 周无 5xx

---

## 日常写作流程（post-MVP）

之后任何时候新增文章：

```bash
cd /Users/zhangchao/2026/blog
# 1. 新建 markdown
$EDITOR src/content/blog/my-new-post.md
# 2. 跑门禁
bun run typecheck && bun run lint && bun run format && bun run build
# 3. 提交
git add src/content/blog/
git commit -m "post: My New Post title"
git push origin main
# 4. 等 5 分钟，刷新博客可见
```

---

## 故障排查速查

| 症状 | 排查 |
|---|---|
| Lighthouse Performance < 90 | 跑 `--view` 看具体指标；最大可能是 LCP（图片）或 CLS（字体） |
| Lychee 周报一直失败 | 大概率是网络问题，跑本地 `lychee --offline 'dist/**/*.html'` 验证 HTML 链接 |
| e2e 偶发失败 | 加 `--retries=2`；本地跑 `bun run e2e --headed` 看具体哪一步 |
| Web Analytics 没数据 | 浏览器开发者工具 → Network → 找 `beacon.min.js` 请求；如被拦截，加 `defer` 改 `async` |
