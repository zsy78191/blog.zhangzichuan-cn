type HasCategory = { data: { category?: string | undefined } };

export function getAllCategories<T extends HasCategory>(
  posts: readonly T[],
): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) {
    const c = p.data.category;
    if (c === undefined) continue;
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category, 'en'));
}
