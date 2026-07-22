import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseDotenv,
  stripQuotes,
  loadEnvFile,
  assertSafeBearerToken,
  gatewayUrl,
  interpretTokenHealth,
  probeGatewayAdmin,
  DEFAULT_GATEWAY_ID,
  CF_API,
} from "./verify-cloudflare-gateway.mjs";

describe("stripQuotes / parseDotenv", () => {
  it("strips matching quotes", () => {
    expect(stripQuotes('"abc"')).toBe("abc");
    expect(stripQuotes("'abc'")).toBe("abc");
    expect(stripQuotes("abc")).toBe("abc");
  });

  it("parses dotenv without expanding", () => {
    const map = parseDotenv(
      [
        "# comment",
        "CLOUDFLARE_ACCOUNT_ID=4984b9bad07bc1da9f097dc8c1da24e0",
        'CLOUDFLARE_API_TOKEN="tok_value"',
        "",
        "OTHER=1",
      ].join("\n"),
    );
    expect(map.CLOUDFLARE_ACCOUNT_ID).toBe("4984b9bad07bc1da9f097dc8c1da24e0");
    expect(map.CLOUDFLARE_API_TOKEN).toBe("tok_value");
    expect(map.OTHER).toBe("1");
  });

  it("trims keys when spaces surround =", () => {
    const map = parseDotenv("KEY = VALUE\n  PADDED = x ");
    expect(map.KEY).toBe("VALUE");
    expect(map.PADDED).toBe("x");
    expect(map["KEY "]).toBeUndefined();
  });
});

describe("loadEnvFile", () => {
  it("does not overwrite an intentionally empty string", () => {
    const dir = mkdtempSync(join(tmpdir(), "cf-gw-env-"));
    const path = join(dir, ".env.local");
    try {
      writeFileSync(path, "EMPTY=\nFROM_FILE=yes\n", "utf8");
      const env = { EMPTY: "" };
      loadEnvFile(path, env);
      expect(env.EMPTY).toBe("");
      expect(env.FROM_FILE).toBe("yes");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("assertSafeBearerToken", () => {
  it("accepts a single-line token", () => {
    expect(assertSafeBearerToken("  abc.def-ghi  ")).toBe("abc.def-ghi");
  });

  it("rejects empty", () => {
    expect(() => assertSafeBearerToken("")).toThrow(/missing/);
    expect(() => assertSafeBearerToken(undefined)).toThrow(/missing/);
  });

  it("rejects newlines (curl 43 class)", () => {
    expect(() =>
      assertSafeBearerToken("⛅ banner\neyJhbGciOiFAKE"),
    ).toThrow(/newline/);
  });
});

describe("gatewayUrl", () => {
  it("builds the official accounts/.../ai-gateway/gateways/{id} path", () => {
    const url = gatewayUrl("acct123", "ipix-prod");
    expect(url).toBe(
      `${CF_API}/accounts/acct123/ai-gateway/gateways/ipix-prod`,
    );
  });

  it("defaults gateway id", () => {
    expect(gatewayUrl("acct123")).toContain(`/gateways/${DEFAULT_GATEWAY_ID}`);
  });

  it("rejects empty account id (prevents 7003 mangled path)", () => {
    expect(() => gatewayUrl("", "ipix-prod")).toThrow(/ACCOUNT_ID/);
  });
});

describe("interpretTokenHealth", () => {
  it("treats gateway success + verify 401 as Account-token OK", () => {
    const h = interpretTokenHealth({ verifyStatus: 401, gatewayOk: true });
    expect(h.ok).toBe(true);
    expect(h.kind).toBe("account_token_likely");
  });

  it("treats gateway success + verify 200 as user token OK", () => {
    const h = interpretTokenHealth({ verifyStatus: 200, gatewayOk: true });
    expect(h.ok).toBe(true);
    expect(h.kind).toBe("user_token_ok");
  });

  it("fails when gateway admin fails", () => {
    const h = interpretTokenHealth({ verifyStatus: 200, gatewayOk: false });
    expect(h.ok).toBe(false);
  });
});

describe("probeGatewayAdmin", () => {
  it("returns success metadata from Cloudflare envelope", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 200,
      json: async () => ({
        success: true,
        result: { id: "ipix-prod", authentication: true },
        errors: [],
      }),
    }));
    const out = await probeGatewayAdmin({
      accountId: "acct",
      apiToken: "tok",
      fetchImpl,
    });
    expect(out).toEqual({
      status: 200,
      success: true,
      gatewayId: "ipix-prod",
      authentication: true,
      errors: [],
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("/accounts/acct/ai-gateway/gateways/ipix-prod");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("surfaces non-success", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 403,
      json: async () => ({
        success: false,
        errors: [{ code: 10000, message: "Authentication error" }],
      }),
    }));
    const out = await probeGatewayAdmin({
      accountId: "acct",
      apiToken: "tok",
      fetchImpl,
    });
    expect(out.success).toBe(false);
    expect(out.status).toBe(403);
  });
});
