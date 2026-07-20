/**
 * IPI-724 — evidence secret scan (shared by run-e2e.mjs + self-check).
 * Prefer structured credential shapes over bare words so benign API copy
 * (e.g. "You do not have authorization") does not crash evidence writes.
 */

const SECRET_PATTERNS = [
  { name: "Cookie header", re: /"name"\s*:\s*"cookie"/i },
  { name: "Set-Cookie", re: /set-cookie/i },
  {
    name: "Authorization header",
    re: /["']?authorization["']?\s*[:=]\s*["']?(?:bearer|basic)\s+\S+/i,
  },
  { name: "Bearer token", re: /\bbearer\s+[a-z0-9._\-]{12,}/i },
  { name: "access_token value", re: /"access_token"\s*:\s*"[^"]+"/i },
  { name: "refresh_token value", re: /"refresh_token"\s*:\s*"[^"]+"/i },
  { name: "password field", re: /"password"\s*:\s*"[^"]+"/i },
  { name: "JWT-like", re: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\./ },
];

/** Fail closed if evidence text looks like it retained session/auth secrets. */
export function assertNoSecrets(label, text) {
  const hits = SECRET_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
  if (hits.length) {
    throw new Error(
      `Secret scan failed for ${label}: found ${hits.join(", ")}. ` +
        "Do not commit this artifact — sanitize or delete and rotate QA session.",
    );
  }
}
