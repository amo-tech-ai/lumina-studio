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
  gatewayInferenceUrl,
  classifyGatewayAuthResponse,
  probeAnonymousGatewayRejection,
  probeAccountAuthWithoutGatewayAuth,
  probeAuthenticatedGatewayAccess,
  interpretAuthEnforcement,
  GATEWAY_HOST,
  DEFAULT_INFERENCE_MODEL,
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

describe("gatewayInferenceUrl", () => {
  it("builds the provider-native workers-ai inference path", () => {
    const url = gatewayInferenceUrl("acct123", "ipix-prod", "@cf/test/model");
    expect(url).toBe(
      `${GATEWAY_HOST}/acct123/ipix-prod/workers-ai/@cf/test/model`,
    );
  });

  it("defaults gateway id and model", () => {
    const url = gatewayInferenceUrl("acct123");
    expect(url).toContain(`/${DEFAULT_GATEWAY_ID}/workers-ai/`);
    expect(url).toContain(DEFAULT_INFERENCE_MODEL);
  });

  it("rejects empty account id (same 7003-class guard as gatewayUrl)", () => {
    expect(() => gatewayInferenceUrl("")).toThrow(/ACCOUNT_ID/);
  });
});

describe("classifyGatewayAuthResponse", () => {
  it("classifies a 2xx success without leaking the body", () => {
    const out = classifyGatewayAuthResponse({
      status: 200,
      body: { result: { response: "full model output should not leak" } },
    });
    expect(out).toEqual({
      status: 200,
      ok2xx: true,
      errorCode: null,
      errorMessageSnippet: null,
    });
  });

  it("extracts a truncated error snippet and code, never the raw body", () => {
    const longMessage = "x".repeat(500);
    const out = classifyGatewayAuthResponse({
      status: 401,
      body: { errors: [{ code: 10000, message: longMessage }] },
    });
    expect(out.status).toBe(401);
    expect(out.ok2xx).toBe(false);
    expect(out.errorCode).toBe(10000);
    expect(out.errorMessageSnippet).toHaveLength(120);
  });

  it("handles a missing/unparseable body", () => {
    const out = classifyGatewayAuthResponse({ status: 403, body: null });
    expect(out.ok2xx).toBe(false);
    expect(out.errorCode).toBeNull();
    expect(out.errorMessageSnippet).toBeNull();
  });
});

describe("probeAnonymousGatewayRejection", () => {
  it("sends no authorization header at all", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 401,
      json: async () => ({ errors: [{ code: 10000, message: "missing authorization" }] }),
    }));
    const out = await probeAnonymousGatewayRejection({
      accountId: "acct",
      fetchImpl,
    });
    expect(out.ok2xx).toBe(false);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("/workers-ai/");
    expect(init.headers["cf-aig-authorization"]).toBeUndefined();
    expect(init.headers.Authorization).toBeUndefined();
  });
});

describe("probeAccountAuthWithoutGatewayAuth", () => {
  it("sends only the standard Authorization header, no cf-aig-authorization", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 401,
      json: async () => ({ errors: [{ code: 10000, message: "Authentication error" }] }),
    }));
    const out = await probeAccountAuthWithoutGatewayAuth({
      accountId: "acct",
      apiToken: "  acct-token  ",
      fetchImpl,
    });
    expect(out.ok2xx).toBe(false);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer acct-token");
    expect(init.headers["cf-aig-authorization"]).toBeUndefined();
  });

  it("rejects an empty api token before sending a request", async () => {
    const fetchImpl = vi.fn();
    await expect(
      probeAccountAuthWithoutGatewayAuth({
        accountId: "acct",
        apiToken: "",
        fetchImpl,
      }),
    ).rejects.toThrow(/missing/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("probeAuthenticatedGatewayAccess", () => {
  it("sends BOTH Authorization and cf-aig-authorization, trimmed", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 200,
      json: async () => ({ result: { response: "ok" } }),
    }));
    const out = await probeAuthenticatedGatewayAccess({
      accountId: "acct",
      apiToken: "  acct-token  ",
      gatewayToken: "  gw-token  ",
      fetchImpl,
    });
    expect(out.ok2xx).toBe(true);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer acct-token");
    expect(init.headers["cf-aig-authorization"]).toBe("Bearer gw-token");
  });

  it("rejects an empty api token before sending a request", async () => {
    const fetchImpl = vi.fn();
    await expect(
      probeAuthenticatedGatewayAccess({
        accountId: "acct",
        apiToken: "",
        gatewayToken: "gw-token",
        fetchImpl,
      }),
    ).rejects.toThrow(/missing/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an empty gateway token before sending a request", async () => {
    const fetchImpl = vi.fn();
    await expect(
      probeAuthenticatedGatewayAccess({
        accountId: "acct",
        apiToken: "acct-token",
        gatewayToken: "",
        fetchImpl,
      }),
    ).rejects.toThrow(/missing/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a newline-contaminated gateway token (curl 43 class)", async () => {
    const fetchImpl = vi.fn();
    await expect(
      probeAuthenticatedGatewayAccess({
        accountId: "acct",
        apiToken: "acct-token",
        gatewayToken: "⛅ banner\ntoken-value",
        fetchImpl,
      }),
    ).rejects.toThrow(/newline/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("interpretAuthEnforcement", () => {
  it("passes when anonymous + account-auth-only are rejected and full auth succeeds", () => {
    const out = interpretAuthEnforcement({
      anonymous: { ok2xx: false },
      accountAuthOnly: { ok2xx: false },
      authenticated: { ok2xx: true },
    });
    expect(out.ok).toBe(true);
    expect(out.anonymousRejected).toBe(true);
    expect(out.accountAuthRejected).toBe(true);
    expect(out.authenticatedAccepted).toBe(true);
  });

  it("fails when anonymous is NOT rejected — does not assume 401 specifically", () => {
    const out = interpretAuthEnforcement({
      anonymous: { ok2xx: true },
      accountAuthOnly: { ok2xx: false },
      authenticated: { ok2xx: true },
    });
    expect(out.ok).toBe(false);
    expect(out.anonymousRejected).toBe(false);
    expect(out.note).toMatch(/NOT rejected/);
  });

  it("fails when account-auth-only succeeds — gateway toggle not actually enforcing", () => {
    const out = interpretAuthEnforcement({
      anonymous: { ok2xx: false },
      accountAuthOnly: { ok2xx: true },
      authenticated: { ok2xx: true },
    });
    expect(out.ok).toBe(false);
    expect(out.accountAuthRejected).toBe(false);
    expect(out.note).toMatch(/not actually enforcing/);
  });

  it("fails when anonymous + account-auth-only are rejected but full auth also fails", () => {
    const out = interpretAuthEnforcement({
      anonymous: { ok2xx: false },
      accountAuthOnly: { ok2xx: false },
      authenticated: { ok2xx: false },
    });
    expect(out.ok).toBe(false);
    expect(out.authenticatedAccepted).toBe(false);
    expect(out.note).toMatch(/authenticated request also failed/);
  });
});
