type HasDraft = { data: { draft: boolean } };

export function filterDraft<T extends HasDraft>(posts: readonly T[]): T[] {
  return posts.filter((p) => !p.data.draft);
}
