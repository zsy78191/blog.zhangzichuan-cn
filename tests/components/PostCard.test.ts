import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import PostCard from '@components/PostCard.astro';

describe('PostCard', () => {
  test('渲染标题、日期、tags', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostCard, {
      request: new Request('https://blog.zhangzichuan.cn/'),
      props: {
        post: {
          id: 'hello-world',
          data: {
            title: '你好，世界',
            description: 'desc',
            pubDatetime: new Date('2026-06-01'),
            tags: ['随笔', 'Meta'],
            category: '随笔',
            draft: false,
            math: false,
            mermaid: false,
          },
        },
      },
    });
    expect(html).toContain('你好，世界');
    expect(html).toContain('2026-06-01');
    expect(html).toContain('随笔');
    expect(html).toContain('Meta');
    expect(html).toContain('/posts/hello-world');
  });
});
