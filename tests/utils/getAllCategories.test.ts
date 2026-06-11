import { describe, expect, test } from 'vitest';
import { getAllCategories } from '@utils/getAllCategories';

describe('getAllCategories', () => {
  test('按 category 字段聚合', () => {
    const posts = [
      { slug: 'a', data: { category: '技术' } },
      { slug: 'b', data: { category: '技术' } },
      { slug: 'c', data: { category: '随笔' } },
    ] as const;
    expect(getAllCategories(posts)).toEqual([
      { category: '技术', count: 2 },
      { category: '随笔', count: 1 },
    ]);
  });

  test('未指定 category 的文章不计入', () => {
    const posts = [{ slug: 'a', data: {} }] as const;
    expect(getAllCategories(posts)).toEqual([]);
  });
});
