import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.zhangzichuan.cn',
  // 静态站点统一带尾斜杠（与 build.format: 'directory' 一致），
  // 避免 Google/Bing 把 /posts/foo 与 /posts/foo/ 视为重复内容。
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx()],
});
