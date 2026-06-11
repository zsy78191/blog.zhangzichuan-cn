import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import TagList from '@components/TagList.astro';

describe('TagList', () => {
  test('渲染传入的 tags 列表与正确 URL', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TagList, {
      request: new Request('https://blog.zhangzichuan.cn/'),
      props: { tags: ['随笔', 'Meta'] },
    });
    expect(html).toContain('/tags/%E9%9A%8F%E7%AC%94');
    expect(html).toContain('/tags/Meta');
    expect(html).toContain('#随笔');
  });
});
