import { describe, expect, test } from 'vitest';
import { sortByPubDatetime } from '@utils/sortByPubDatetime';

describe('sortByPubDatetime', () => {
  test('按 pubDatetime 降序', () => {
    const posts = [
      { slug: 'old', data: { pubDatetime: new Date('2025-01-01') } },
      { slug: 'new', data: { pubDatetime: new Date('2026-06-01') } },
      { slug: 'mid', data: { pubDatetime: new Date('2025-12-01') } },
    ] as const;
    const result = sortByPubDatetime(posts);
    expect(result.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
  });

  test('同日期时稳定排序', () => {
    const posts = [
      { slug: 'a', data: { pubDatetime: new Date('2026-01-01') } },
      { slug: 'b', data: { pubDatetime: new Date('2026-01-01') } },
    ] as const;
    expect(sortByPubDatetime(posts).map((p) => p.slug)).toEqual(['a', 'b']);
  });
});
