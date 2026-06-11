type HasPubDatetime = { data: { pubDatetime: Date } };

export function sortByPubDatetime<T extends HasPubDatetime>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => {
    const diff = b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime();
    return diff !== 0 ? diff : 0;
  });
}
