/** Strip PostgREST `.or()` metacharacters and escape ILIKE wildcards. */
export function sanitizeCrmSearchTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[%_\\]/g, (char) => `\\${char}`)
    .replace(/[,()]/g, "");
}
