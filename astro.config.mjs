import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.zhangzichuan.cn',
  // 静态站点统一带尾斜杠（与 build.format: 'directory' 一致），
  // 避免 Google/Bing 把 /posts/foo 与 /posts/foo/ 视为重复内容。
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: 'img-svg' }]],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
      transformers: [
        {
          name: 'skip-mermaid',
          pre(hast) {
            // rehype-mermaid 需要 <pre class="mermaid"><code class="language-mermaid">，
            // 但 Shiki 会把所有代码块转成 <pre class="astro-code">。
            // 这个 transformer 将 mermaid 代码块还原为原始格式，让 rehype-mermaid 接管。
            if (this.options.lang === 'mermaid') {
              const code = (this.source || '').replace(/\n$/, '');
              hast.tagName = 'pre';
              hast.properties = { class: 'mermaid' };
              hast.children = [
                {
                  type: 'element',
                  tagName: 'code',
                  properties: { className: ['language-mermaid'] },
                  children: [{ type: 'text', value: code }],
                },
              ];
            }
          },
        },
      ],
    },
  },
  prefetch: { defaultStrategy: 'viewport' },
});
