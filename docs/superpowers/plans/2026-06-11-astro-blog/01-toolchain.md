# 子计划 01：工具链（TypeScript strict + ESLint + Prettier）

**子目标：** 把项目升级到生产级工具链——TypeScript strict、ESLint（含 Astro 规则）、Prettier、`astro check` 跑通，并补全 `package.json` 的 scripts。

**任务数：** 4

**涉及文件：**
- 修改：`tsconfig.json`、`package.json`
- 创建：`.eslintrc.cjs`、`.eslintignore`、`.prettierrc`、`.prettierignore`、`.vscode/extensions.json`、`.vscode/settings.json`

**前置：** 子计划 00 完成

**完成标志：** `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build` 全部退出码 0；`src/consts.ts` 在 strict 下零错误。

---

## Task 1.1：升级 `tsconfig.json` 到 strict

**Files:**
- 修改：`tsconfig.json`

- [ ] **Step 1：覆盖写入 `tsconfig.json`**

文件：`tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@utils/*": ["src/utils/*"],
      "@consts": ["src/consts"]
    },
    "jsx": "preserve",
    "verbatimModuleSyntax": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 2：装 typecheck 依赖**

```bash
cd /Users/zhangchao/2026/blog
pnpm add -D @astrojs/check typescript
```

- [ ] **Step 3：跑 typecheck（首次可能因 consts 未在 index.astro 解构失败）**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
```

- [ ] **Step 4：修正 `src/pages/index.astro` 让解构符合 strict**

覆盖 `src/pages/index.astro`：

```astro
---
import { SITE } from '../consts';

const { title, description, locale } = SITE;
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  </body>
</html>
```

- [ ] **Step 5：重新跑 typecheck 必须通过**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
# 期望：0 errors 0 warnings
```

- [ ] **Step 6：提交**

```bash
cd /Users/zhangchao/2026/blog
git add tsconfig.json package.json pnpm-lock.yaml src/pages/index.astro
git commit -m "chore(toolchain): enable TypeScript strictest with path aliases"
```

---

## Task 1.2：ESLint + Prettier 配置

**Files:**
- 创建：`.eslintrc.cjs`、`.eslintignore`、`.prettierrc`、`.prettierignore`
- 修改：`package.json`（加 scripts）

- [ ] **Step 1：装依赖**

```bash
cd /Users/zhangchao/2026/blog
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-astro eslint-plugin-jsx-a11y \
  prettier prettier-plugin-astro
```

- [ ] **Step 2：写入 `.eslintrc.cjs`**

文件：`.eslintrc.cjs`

```js
/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.astro'],
  },
  env: { browser: true, node: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    {
      files: ['*.cjs'],
      env: { node: true },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', '.astro', 'pagefind'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
```

- [ ] **Step 3：写入 `.eslintignore`**

文件：`.eslintignore`

```
dist
node_modules
.astro
pagefind
public
pnpm-lock.yaml
```

- [ ] **Step 4：写入 `.prettierrc`**

文件：`.prettierrc`

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": { "parser": "astro" }
    }
  ]
}
```

- [ ] **Step 5：写入 `.prettierignore`**

文件：`.prettierignore`

```
dist
node_modules
.astro
pagefind
pnpm-lock.yaml
public/pagefind
```

- [ ] **Step 6：补 `package.json` scripts**

修改 `package.json` 的 `scripts` 段（保留 dev/build/preview/astro，新增下面四项）：

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
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 7：跑三个门**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck
pnpm lint
pnpm format:check
# 三条命令都期望退出码 0
```

如 `pnpm format:check` 失败，跑 `pnpm format` 自动格式化后重试。

- [ ] **Step 8：跑 build 验证**

```bash
cd /Users/zhangchao/2026/blog
pnpm build
# 期望：astro check 阶段无错；astro build 输出 dist/
```

- [ ] **Step 9：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .eslintrc.cjs .eslintignore .prettierrc .prettierignore package.json pnpm-lock.yaml
git commit -m "chore(toolchain): add ESLint, Prettier, typecheck/lint/format scripts"
```

---

## Task 1.3：VS Code 推荐扩展

**Files:**
- 创建：`.vscode/extensions.json`、`.vscode/settings.json`

- [ ] **Step 1：写入 `.vscode/extensions.json`**

文件：`.vscode/extensions.json`

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "editorconfig.editorconfig"
  ]
}
```

- [ ] **Step 2：写入 `.vscode/settings.json`**

文件：`.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "[astro]": { "editor.defaultFormatter": "astro-build.astro-vscode" },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

- [ ] **Step 3：提交**

```bash
cd /Users/zhangchao/2026/blog
git add .vscode/
git commit -m "chore(toolchain): add VS Code recommended extensions and settings"
```

---

## Task 1.4：门禁全绿 + 打 tag

**Files:**
- 修改：（无）

- [ ] **Step 1：跑完整门禁套件**

```bash
cd /Users/zhangchao/2026/blog
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
echo "ALL GREEN"
```

期望：输出 `ALL GREEN`。

- [ ] **Step 2：打 tag**

```bash
cd /Users/zhangchao/2026/blog
git tag phase-01-toolchain
git tag --list 'phase-01*'
# 期望：phase-01-toolchain
```

---

## 子计划 01 完成

进入 `02-content-collections.md` 前确认：

- [ ] `pnpm typecheck` 0 错 0 警
- [ ] `pnpm lint` 0 错
- [ ] `pnpm format:check` 全文件通过
- [ ] `pnpm build` 成功
- [ ] `git tag phase-01-toolchain` 已存在
- [ ] `tsconfig.json` 中路径别名 `@components/*`、`@layouts/*`、`@utils/*`、`@consts` 全部可用
