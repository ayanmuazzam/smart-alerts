type QueryResultLike = {
  items: any[];
  totalCount?: number | null;
};

/** Walk all pages via skip/limit until a short page. */
export async function queryAllPages(
  buildPage: (limit: number, skip: number) => Promise<QueryResultLike>,
  pageSize = 100,
  maxPages = 200,
): Promise<any[]> {
  const all: any[] = [];
  let skip = 0;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await buildPage(pageSize, skip);
    const batch = result.items || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}
