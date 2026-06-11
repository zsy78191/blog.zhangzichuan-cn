import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Footer from '@components/Footer.astro';

describe('Footer', () => {
  test('显示 ICP 备案号并链接到工信部', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      request: new Request('https://blog.zhangzichuan.cn/'),
    });
    expect(html).toContain('苏ICP备18064390号-8');
    expect(html).toContain('https://beian.miit.gov.cn/');
  });

  test('包含 copyright 与 RSS 链接', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      request: new Request('https://blog.zhangzichuan.cn/'),
    });
    expect(html).toMatch(/&copy;\s*\d{4}/);
    expect(html).toContain('/rss.xml');
  });
});
