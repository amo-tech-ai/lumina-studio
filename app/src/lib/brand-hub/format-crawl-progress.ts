/** Human-readable crawl progress when pages_found may be null or zero. */
export function formatCrawlProgressLabel(
  crawled: number,
  found: number | null | undefined,
): string {
  if (found != null && found > 0) {
    return `${crawled} of ${found} pages crawled`;
  }
  return `${crawled} pages crawled`;
}

/** Compact form for inline status banners: "(5 / 20 pages)" or "(5 pages)". */
export function formatCrawlProgressShort(
  crawled: number,
  found: number | null | undefined,
): string {
  if (found != null && found > 0) {
    return `${crawled} / ${found} pages`;
  }
  return `${crawled} pages`;
}
