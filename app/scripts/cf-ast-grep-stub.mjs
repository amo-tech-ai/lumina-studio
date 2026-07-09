/** Wrangler alias stub — @ast-grep/napi is build-time only; not available on Workers. */
export const Lang = {};
export function parse() {
  throw new Error("@ast-grep/napi is unavailable in the Cloudflare Workers runtime");
}
