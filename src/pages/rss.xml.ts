import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@consts';
import { filterDraft } from '@utils/filterDraft';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = sortByPubDatetime(filterDraft(await getCollection('blog')));
  const siteUrl = context.site ?? new URL(SITE.url);
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteUrl,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDatetime,
      // 必须是绝对 URL：相对路径会导致大部分 RSS 阅读器无法跳转
      // trailingSlash: 'always' => 必须带尾斜杠保持与站内一致
      link: new URL(`/posts/${p.id}/`, siteUrl).toString(),
      categories: p.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
