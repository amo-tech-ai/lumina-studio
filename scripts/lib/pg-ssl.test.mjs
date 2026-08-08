import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PG_CA_PATH,
  resolvePgSsl,
  sanitizePgConnectionString,
} from "./pg-ssl.mjs";

test("sanitizePgConnectionString drops SSL params, keeps the rest", () => {
  const out = sanitizePgConnectionString(
    "postgres://u:p@h:5432/db?sslmode=require&sslrootcert=/x.crt&application_name=verify",
  );
  assert.ok(!out.includes("sslmode"));
  assert.ok(!out.includes("sslrootcert"));
  assert.ok(out.includes("application_name=verify"));
  assert.ok(out.startsWith("postgres://u:p@h:5432/db"));
});

test("sanitizePgConnectionString passes through unparseable input", () => {
  assert.equal(sanitizePgConnectionString("not a url"), "not a url");
});

test("resolvePgSsl uses the bundled CA by default", () => {
  const ssl = resolvePgSsl({ env: {} });
  assert.equal(ssl.rejectUnauthorized, true);
  assert.ok(ssl.ca, `expected bundled CA at ${DEFAULT_PG_CA_PATH}`);
});

test("resolvePgSsl honours the insecure opt-outs", () => {
  assert.deepEqual(resolvePgSsl({ env: { VERIFY_RLS_PG_INSECURE_SSL: "1" } }), {
    rejectUnauthorized: false,
  });
  assert.deepEqual(resolvePgSsl({ env: { NODE_TLS_REJECT_UNAUTHORIZED: "0" } }), {
    rejectUnauthorized: false,
  });
});

test("resolvePgSsl falls back to system roots when a CA override is missing", () => {
  const ssl = resolvePgSsl({ env: { PGSSLROOTCERT: "/nope/missing.crt" } });
  assert.deepEqual(ssl, { rejectUnauthorized: true });
});

test("resolvePgSsl with requireCa refuses a missing CA override", () => {
  assert.throws(
    () => resolvePgSsl({ requireCa: true, env: { PGSSLROOTCERT: "/nope/missing.crt" } }),
    /PG SSL CA not found at \/nope\/missing.crt/,
  );
});
