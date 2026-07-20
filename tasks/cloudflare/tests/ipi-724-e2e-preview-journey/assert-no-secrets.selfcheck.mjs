/**
 * Node self-check — benign vs secret strings (no vitest / no Playwright).
 *
 *   node tasks/cloudflare/tests/ipi-724-e2e-preview-journey/assert-no-secrets.selfcheck.mjs
 */
import { assertNoSecrets } from "./assert-no-secrets.mjs";

function expectPass(label, text) {
  assertNoSecrets(label, text);
}

function expectFail(label, text) {
  let threw = false;
  try {
    assertNoSecrets(label, text);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(`expected secret scan to fail for ${label}`);
  }
}

expectPass(
  "benign authorization copy",
  JSON.stringify({ message: "You do not have authorization" }),
);
expectPass(
  "authorization field without credential",
  JSON.stringify({ authorization: null, note: "no token" }),
);
expectPass("plain status", JSON.stringify({ status: 401, error: "Unauthorized" }));

expectFail(
  "Authorization Bearer header",
  JSON.stringify({ Authorization: "Bearer abcdefghijklmnop" }),
);
expectFail(
  "access_token value",
  JSON.stringify({ access_token: "secretvalue" }),
);
expectFail(
  "refresh_token value",
  JSON.stringify({ refresh_token: "refreshsecret" }),
);
expectFail(
  "password field",
  JSON.stringify({ password: "hunter2" }),
);
expectFail(
  "JWT-like",
  "token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig",
);

console.log("assert-no-secrets.selfcheck OK");
