import { describe, expect, test } from 'vitest';
import { getAllTags } from '@utils/getAllTags';

describe('getAllTags', () => {
  test('聚合多文章的 tags 并按字母排序', () => {
    const posts = [
      { slug: 'a', data: { tags: ['随笔', 'Meta'] } },
      { slug: 'b', data: { tags: ['示例', '随笔'] } },
    ] as const;
    const result = getAllTags(posts);
    expect(result).toEqual([
      { tag: 'Meta', count: 1 },
      { tag: '示例', count: 1 },
      { tag: '随笔', count: 2 },
    ]);
  });

  test('忽略空 tags 数组', () => {
    const posts = [{ slug: 'a', data: { tags: [] } }] as const;
    expect(getAllTags(posts)).toEqual([]);
  });
});
