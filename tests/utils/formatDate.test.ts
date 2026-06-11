import { describe, expect, test } from 'vitest';
import { formatDate } from '@utils/formatDate';

describe('formatDate', () => {
  test('将 ISO 日期格式化为中文 yyyy-mm-dd', () => {
    const d = new Date('2026-01-15T08:30:00Z');
    expect(formatDate(d)).toBe('2026-01-15');
  });

  test('补零月份与日期', () => {
    const d = new Date('2026-03-05T00:00:00Z');
    expect(formatDate(d)).toBe('2026-03-05');
  });
});
