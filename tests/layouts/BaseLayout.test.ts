import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import BaseLayout from '@layouts/BaseLayout.astro';

describe('BaseLayout', () => {
  test('含 OG、canonical、ICP 备案号', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      request: new Request('https://blog.zhangzichuan.cn/test/'),
      props: { title: '测试页', description: 'desc' },
      slots: { default: '<p>hello</p>' },
    });
    expect(html).toContain('<html lang="zh-CN"');
    expect(html).toContain('https://blog.zhangzichuan.cn/');
    expect(html).toContain('og:title');
    expect(html).toContain('苏ICP备18064390号-8');
  });
});
