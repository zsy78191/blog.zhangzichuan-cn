# 子计划 07：Cloudflare Pages 端 + Secrets + 首次部署冒烟

**子目标：** 在 Cloudflare 控制台创建 Pages 项目、绑定自定义域、配置 Web Analytics；在 GitHub 仓库设置 3 个 secrets；push main 触发 CI/CD，验证博客可访问。

**任务数：** 5

**涉及文件：**
- 修改：`src/layouts/BaseLayout.astro`（嵌入 Web Analytics 脚本 token）
- 创建：`.env.example`（不提交到 git）

**前置：** 子计划 06 完成；用户已有 Cloudflare 账号；GitHub 仓库已创建并 push

**完成标志：**
- `https://blog.zhangzichuan.cn/` 可访问
- 页脚显示 `苏ICP备18064390号-8` 与 `https://beian.miit.gov.cn/` 链接
- 暗色模式按钮可切换
- `/search` 全文搜索可用
- `/rss.xml` 输出有效 RSS
- Cloudflare 控制台 Analytics 标签页开始有数据

---

## Task 7.1：准备 GitHub 仓库并 push

**Files:**
- 创建：远程 `origin` 指向 `git@github.com:zhangchao/blog.zhangzichuan.cn.git`

- [ ] **Step 1：在 GitHub 创建仓库**

在浏览器打开 https://github.com/new ，参数：
- Owner: `zhangchao`
- Repository name: `blog.zhangzichuan-cn`
- Visibility: **Public**
- 不要勾选 "Add a README"（本地已有）

创建后复制 git URL。

- [ ] **Step 2：本地加 remote 并 push**

```bash
cd /Users/zhangchao/2026/blog
git remote add origin git@github.com:zhangchao/blog.zhangzichuan-cn.git
git push -u origin main
# 期望：推送所有 commit 与所有 tag
git push origin --tags
```

- [ ] **Step 3：确认 GitHub 上能看到所有 commit 与 tag**

浏览器查看 `https://github.com/zhangchao/blog.zhangzichuan-cn/tags` 期望看到 `phase-00-scaffold` 到 `phase-06-cicd`。

---

## Task 7.2：创建 Cloudflare API Token

**Files:**
- 修改：（无；只配置在 Cloudflare 控制台）

- [ ] **Step 1：登录 Cloudflare 控制台**

浏览器打开 https://dash.cloudflare.com/ 并登录。

- [ ] **Step 2：进入 My Profile → API Tokens → Create Token**

URL：https://dash.cloudflare.com/profile/api-tokens

模板选 **"Edit Cloudflare Pages"**，或点 **"Create Custom Token"** 自行配：
- Permissions:
  - Account → Cloudflare Pages → Edit
  - Account → Account Settings → Read（用于读取 account ID）
- Account Resources:
  - Include → Specific account → 选你的账户
- TTL: 留默认

点 **Continue to summary** → **Create Token**。

- [ ] **Step 3：复制 token（一行串，仅显示一次）**

格式形如 `aBcDeF12345...`。**立即复制**到密码管理器。

- [ ] **Step 4：记录 Account ID**

Cloudflare 控制台右下角 "Account ID" 区域可见。形如 `01234567890abcdef01234567890abcdef`。**记录下来**。

---

## Task 7.3：在 GitHub 设置 Secrets

**Files:**
- 修改：（无；只配置在 GitHub 仓库 Settings）

- [ ] **Step 1：进入仓库 Settings → Secrets and variables → Actions**

URL：https://github.com/zhangchao/blog.zhangzichuan-cn/settings/secrets/actions

- [ ] **Step 2：新增 Repository secret（3 个）**

点 **New repository secret**，逐个添加：

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 7.2 第 3 步复制的 token |
| `CLOUDFLARE_ACCOUNT_ID` | 7.2 第 4 步记录的 Account ID |
| `CLOUDFLARE_ANALYTICS_TOKEN` | 占位：先填 `placeholder`（7.5 拿到后回填） |

- [ ] **Step 3：写 `.env.example`（提交，文档化 secrets 期望）**

文件：`.env.example`

```bash
# Cloudflare Pages 部署
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
# Cloudflare Web Analytics（站点 token，BaseLayout 通过 PUBLIC_ 前缀注入）
PUBLIC_CF_ANALYTICS_TOKEN=
```

- [ ] **Step 4：提交 `.env.example`**

```bash
cd /Users/zhangchao/2026/blog
git add .env.example
git commit -m "docs: .env.example for required secrets"
git push origin main
```

---

## Task 7.4：在 Cloudflare Pages 创建项目 + 绑定自定义域

**Files:**
- 修改：（无；只配置在 Cloudflare 控制台）

- [ ] **Step 1：进入 Workers & Pages → Create application → Pages → Direct Upload**

URL：https://dash.cloudflare.com/?to=/:account/pages

- [ ] **Step 2：先建空项目，等 CI 部署**

为了一次性让 CI 接管，建空项目：
- Project name: `blog-zhangzichuan-cn`
- 点 **Create project**
- 此时**不要**上传任何东西（让 CI 来上传）

- [ ] **Step 3：绑定自定义域**

进入项目 → **Custom domains** → **Set up a custom domain**：
- 输入 `blog.zhangzichuan.cn`
- 点 **Continue**
- Cloudflare 自动添加 CNAME 记录（如域名已在 Cloudflare 托管则一键完成）
- 等待 SSL 证书签发（通常 1-5 分钟）

- [ ] **Step 4：等首次部署冒烟**

此时 Pages 项目已建但还**没有**部署版本。push main 触发 deploy workflow 后会成功部署。

---

## Task 7.5：触发首次部署 + 验证

**Files:**
- 修改：`src/layouts/BaseLayout.astro`（嵌入 Web Analytics 脚本）

- [ ] **Step 1：push main 触发 deploy workflow**

```bash
cd /Users/zhangchao/2026/blog
git push origin main
# 期望：触发 .github/workflows/deploy.yml
```

- [ ] **Step 2：在 GitHub Actions 页面观察**

URL：https://github.com/zhangchao/blog.zhangzichuan-cn/actions

期望：看到 `deploy` workflow 运行，最终步骤 `Deploy to Cloudflare Pages` 成功。

- [ ] **Step 3：访问 `https://blog.zhangzichuan.cn/` 验证**

期望：
- 首页加载，"子川的博客" 标题
- 看到 "你好，世界" 与 "带数学公式与流程图的文章" 卡片
- **不**应看到 "草稿：尚未完成"
- 页脚显示 `苏ICP备18064390号-8` 链接到工信部

- [ ] **Step 4：检查 `/rss.xml`**

浏览器访问 `https://blog.zhangzichuan.cn/rss.xml` 期望看到 RSS 2.0 头与 2 个 item。

- [ ] **Step 5：检查 `/search`**

浏览器访问 `https://blog.zhangzichuan.cn/search` 期望看到搜索框。试着输入 "你好" 期望至少返回 1 条结果。

- [ ] **Step 6：检查暗色模式**

点击页面右上角 ☀/☾ 按钮，期望整体变深色。

- [ ] **Step 7：检查数学公式与 mermaid**

访问 `https://blog.zhangzichuan.cn/posts/with-math-and-mermaid/`，期望：
- 公式 `$E = mc^2$` 渲染为 KaTeX 样式（不是 raw 美元符号）
- 流程图渲染为 SVG 或图片

- [ ] **Step 8：嵌入 Cloudflare Web Analytics**

获取 token：Cloudflare 控制台 → 账户首页 → **Web Analytics** → **Set up** → 输入站点名 `blog.zhangzichuan.cn` → **Create** → 复制 beacon token。

修改 `src/layouts/BaseLayout.astro` 的 `<head>` 段（在 `<meta name="twitter:card">` 之后）添加：

```astro
{import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN && (
  <script
    defer
    src="https://static.cloudflareinsights.com/beacon.min.js"
    /* M8：用 JSON.stringify 序列化 JSON payload，防止 token 来自
     * import.meta.env（理论上可信，但生产 env 来自 .env/.env.* 文本拼接），
     * 一旦含 `</script>` 等会提前闭合本标签造成 XSS。 */
    data-cf-beacon={JSON.stringify({ token: import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN })}
  />
)}
```

> 补充：token 形如 `abc123def456`，结构上不会含 `</script>`；但 SECURITY 原则是"把 XSS 防御写在边界"，用 `JSON.stringify` 是免费且无副作用的做法。

- [ ] **Step 9：本地确认 Web Analytics 变量被正确读取**

```bash
cd /Users/zhangchao/2026/blog
PUBLIC_CF_ANALYTICS_TOKEN=test_token bun run build
grep -r 'beacon.min.js' dist/
# 期望：在每个 HTML 中找到 beacon.min.js 引用，且 data-cf-beacon 包含 test_token
```

- [ ] **Step 10：回填 GitHub Secret 中的真 token**

回到 https://github.com/zhangchao/blog.zhangzichuan-cn/settings/secrets/actions，**Update** `CLOUDFLARE_ANALYTICS_TOKEN` 为第 8 步复制的真 token。

- [ ] **Step 11：push 触发二次部署**

```bash
cd /Users/zhangchao/2026/blog
git add src/layouts/BaseLayout.astro
git commit -m "feat(analytics): embed Cloudflare Web Analytics beacon"
git push origin main
```

- [ ] **Step 12：验证 Analytics 跑通**

等部署完成后浏览几页，10 分钟后到 Cloudflare 控制台 → Web Analytics → blog.zhangzichuan.cn 期望看到 1+ 次访问。

- [ ] **Step 13：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-07-cloudflare
```

---

## 子计划 07 完成

进入 `08-quality-and-observability.md` 前确认：

- [ ] `https://blog.zhangzichuan.cn/` 可访问
- [ ] 首页显示 2 篇文章（不含草稿）
- [ ] 页脚 ICP 备案号与跳转链接可见
- [ ] 暗色模式可切换
- [ ] `/search` 搜索可用
- [ ] `/rss.xml` 输出有效 RSS
- [ ] 数学公式与 mermaid 渲染正确
- [ ] Cloudflare Web Analytics 收到至少 1 次访问
- [ ] 3 个 GitHub Secrets 配置正确
- [ ] `git tag phase-07-cloudflare` 已存在

---

## 故障排查速查

| 症状 | 原因 | 修复 |
|---|---|---|
| `https://blog.zhangzichuan.cn/` 404 | Pages 还没收到首次部署 | 等待 GitHub Actions 跑完 |
| 部署失败 `Authentication error [code: 10000]` | API Token 错或权限不够 | 重新创建 token，确认有 Pages: Edit 权限 |
| 部署失败 `Project not found` | Pages 项目名与 wrangler 不一致 | 确认 `wrangler.toml` 中 `name` 与控制台一致 |
| 自定义域 SSL 一直 pending | Cloudflare 还没完成证书签发 | 通常 5 分钟内，超过 30 分钟检查 NS 记录 |
| `/search` 空白 | Pagefind 索引没生成 | 确认 `bun run build` 跑完，`dist/pagefind/` 存在 |
| 数学公式显示为 `$E=mc^2$` raw 文本 | `math: true` 标志位没设 | 在 frontmatter 加 `math: true` |
| Cloudflare Web Analytics 没数据 | 浏览器拦截 beacon 脚本 | 检查广告拦截器；用 `view-source:` 确认 beacon 标签存在 |
