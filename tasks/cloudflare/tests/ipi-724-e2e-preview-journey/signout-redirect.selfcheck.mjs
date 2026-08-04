/**
 * Focused check for isPreviewSignoutSuccessRedirect (13c / 13f).
 *   node tasks/cloudflare/tests/ipi-724-e2e-preview-journey/signout-redirect.selfcheck.mjs
 */
import { isPreviewSignoutSuccessRedirect } from "./signout-redirect.mjs";

const PREVIEW = "https://ipix-operator-preview.sk-498.workers.dev";

const cases = [
  [true, 303, "/login"],
  [true, 303, `${PREVIEW}/login`],
  [true, 303, `${PREVIEW}/login?next=/app`],
  [false, 302, "/login"],
  [false, 301, "/login"],
  [false, 200, "/login"],
  [false, 303, "/app?signoutError=1"],
  [false, 303, `${PREVIEW}/login?signoutError=1`],
  [false, 303, "https://evil.example/login"],
  [false, 303, null],
  [false, null, "/login"],
];

for (const [want, status, location] of cases) {
  const got = isPreviewSignoutSuccessRedirect(status, location, PREVIEW);
  if (got !== want) {
    throw new Error(
      `expected ${want} for status=${status} location=${location}; got ${got}`,
    );
  }
}

console.log("signout-redirect.selfcheck OK");
