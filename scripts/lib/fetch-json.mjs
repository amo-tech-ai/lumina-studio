/**
 * Shared JSON fetch helper for edge-function smoke scripts.
 *
 * Returns the raw text alongside the parsed body: a non-JSON body (HTML error
 * page, empty 204) is a legitimate result these scripts assert on, so a parse
 * failure yields `json: null` rather than throwing.
 */

/** @returns {Promise<{ res: Response, json: unknown, text: string }>} */
export async function fetchJson(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

/** `fetchJson` bound to a base URL — callers pass only the path. */
export function createJsonFetcher(base) {
  return (path, init = {}) => fetchJson(`${base}${path}`, init);
}
