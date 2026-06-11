import { describe, expect, test } from 'vitest';
import { filterDraft } from '@utils/filterDraft';

describe('filterDraft', () => {
  test('过滤掉 draft: true 的文章', () => {
    const posts = [
      { slug: 'a', data: { draft: false } },
      { slug: 'b', data: { draft: true } },
    ] as const;
    const result = filterDraft(posts);
    expect(result.map((p) => p.slug)).toEqual(['a']);
  });

  test('空数组返回空数组', () => {
    expect(filterDraft([])).toEqual([]);
  });
});
