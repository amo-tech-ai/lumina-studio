/**
 * IPI-734 — focused unit tests for verify:copilot (no Playwright).
 * Run: node --test tasks/copilotkit/verify/verify-copilot.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseArgs,
  assertReadonlyGuard,
  headersToObject,
  versionMatches,
  redactForEvidence,
  hostnameOf,
  SUMMARY_SCHEMA_VERSION,
  main,
} from "./verify-copilot.mjs";

describe("parseArgs", () => {
  it("parses repeated --header and flags", () => {
    const o = parseArgs([
      "--base-url=https://Preview.Example/",
      "--readonly",
      "--header=A: 1",
      "--header",
      "B: 2",
      "--expect-version=abc",
      "--browser=chromium",
      "--out=/tmp/ev",
      "--skip-browser",
    ]);
    assert.equal(o.baseUrl, "https://Preview.Example/");
    assert.equal(o.readonly, true);
    assert.deepEqual(o.headers, ["A: 1", "B: 2"]);
    assert.equal(o.expectVersion, "abc");
    assert.equal(o.skipBrowser, true);
  });

  it("rejects unknown args", () => {
    assert.throws(() => parseArgs(["--nope"]), /Unknown argument/);
  });
});

describe("readonly guard / hostname", () => {
  it("blocks apex and www without --readonly", () => {
    assert.equal(assertReadonlyGuard({ baseUrl: "https://ipix.co", readonly: false }).ok, false);
    assert.equal(
      assertReadonlyGuard({ baseUrl: "https://WWW.IPIX.CO/app", readonly: false }).ok,
      false,
    );
    assert.equal(
      assertReadonlyGuard({ baseUrl: "https://ipix.co/", readonly: true }).ok,
      true,
    );
  });

  it("allows preview without readonly", () => {
    assert.equal(
      assertReadonlyGuard({
        baseUrl: "https://ipix-operator-preview.sk-498.workers.dev",
        readonly: false,
      }).ok,
      true,
    );
  });

  it("normalizes hostname case", () => {
    assert.equal(hostnameOf("https://WWW.IPIX.CO/"), "www.ipix.co");
  });
});

describe("headersToObject", () => {
  it("builds one object for preflight + browser", () => {
    assert.deepEqual(headersToObject(["Foo: bar", "Baz: qux"]), {
      Foo: "bar",
      Baz: "qux",
    });
  });

  it("fails malformed before network", () => {
    assert.throws(() => headersToObject(["nocolon"]), /Invalid --header/);
    assert.throws(() => headersToObject([": value"]), /Invalid --header name/);
    assert.throws(() => headersToObject(["Name:"]), /Invalid --header value/);
    assert.throws(() => headersToObject([""]), /empty/);
  });
});

describe("versionMatches", () => {
  it("fails on missing and mismatch; passes on equal", () => {
    assert.equal(versionMatches(null, "v1"), false);
    assert.equal(versionMatches("", "v1"), false);
    assert.equal(versionMatches("v2", "v1"), false);
    assert.equal(versionMatches("v1", "v1"), true);
    assert.equal(versionMatches(null, null), true);
  });
});

describe("redactForEvidence", () => {
  it("redacts auth-like keys and bearer strings", () => {
    const r = redactForEvidence({
      authorization: "Bearer secret",
      cookie: "a=b",
      nested: { api_key: "x", ok: "y" },
      tokenish: "Bearer abc",
    });
    assert.equal(r.authorization, "[redacted]");
    assert.equal(r.cookie, "[redacted]");
    assert.equal(r.nested.api_key, "[redacted]");
    assert.equal(r.nested.ok, "y");
    assert.equal(r.tokenish, "[redacted]");
  });
});

describe("main() guards", () => {
  it("exits 1 on prod URL without --readonly before fetch", async () => {
    let fetched = false;
    const code = await main(["--base-url=https://ipix.co", "--skip-browser"], {
      fetchImpl: async () => {
        fetched = true;
        return new Response("{}", { status: 401 });
      },
    });
    assert.equal(code, 1);
    assert.equal(fetched, false);
  });

  it("exits 1 on malformed --header before fetch", async () => {
    let fetched = false;
    const code = await main(
      ["--base-url=https://example.workers.dev", "--header=bad", "--skip-browser"],
      {
        fetchImpl: async () => {
          fetched = true;
          return new Response("{}", { status: 401 });
        },
      },
    );
    assert.equal(code, 1);
    assert.equal(fetched, false);
  });

  it("exits 1 when --expect-version set and header missing", async () => {
    const code = await main(
      [
        "--base-url=https://example.workers.dev",
        "--expect-version=ver-1",
        "--skip-browser",
      ],
      {
        fetchImpl: async () =>
          new Response("{}", {
            status: 401,
            headers: { "content-type": "application/json" },
          }),
      },
    );
    assert.equal(code, 1);
  });

  it("passes preflight-only on anon 401", async () => {
    const code = await main(
      ["--base-url=https://example.workers.dev", "--skip-browser", "--out=/tmp/verify-copilot-ut"],
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ agents: {} }), {
            status: 401,
            headers: { "content-type": "application/json" },
          }),
      },
    );
    assert.equal(code, 0);
    assert.equal(typeof SUMMARY_SCHEMA_VERSION, "number");
  });
});
