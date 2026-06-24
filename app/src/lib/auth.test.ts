import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractAccessToken } from "./auth";

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/copilotkit", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  mockGetUser.mockReset();
});

describe("extractAccessToken", () => {
  it("reads a Bearer token", () => {
    expect(extractAccessToken(req({ authorization: "Bearer abc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("prefers Authorization over session cookies", () => {
    const session = JSON.stringify(["cookie-jwt", "refresh"]);
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(
      extractAccessToken(
        req({ authorization: "Bearer header-jwt", cookie }),
      ),
    ).toBe("header-jwt");
  });

  it("reads the sb-*-auth-token cookie (base64 JSON array)", () => {
    const session = JSON.stringify(["jwt-token", "refresh"]);
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("jwt-token");
  });

  it("reads chunked sb-*-auth-token.0 cookies", () => {
    const session = JSON.stringify(["chunked-jwt", "refresh"]);
    const cookie = `sb-proj-auth-token.0=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("chunked-jwt");
  });

  it("reads object-shaped session cookies with access_token", () => {
    const session = JSON.stringify({ access_token: "object-jwt" });
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("object-jwt");
  });

  it("returns undefined for Bearer with no token value", () => {
    expect(extractAccessToken(req({ authorization: "Bearer   " }))).toBeUndefined();
  });

  it("returns undefined for malformed session cookies", () => {
    expect(
      extractAccessToken(req({ cookie: "sb-proj-auth-token=not-valid-json" })),
    ).toBeUndefined();
  });

  it("returns undefined when no token is present", () => {
    expect(extractAccessToken(req({}))).toBeUndefined();
  });
});

describe("resolveOperatorUser (fail-closed)", () => {
  it("falls back to a marked demo identity outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { resolveOperatorUser } = await import("./auth");
    const user = await resolveOperatorUser(req({}));
    expect(user.id).toBe("demo-user");
    expect(user.name).toContain("dev fallback");
  });

  it("throws (fails closed) in production with no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { resolveOperatorUser } = await import("./auth");
    await expect(resolveOperatorUser(req({}))).rejects.toThrow(/failing closed/);
  });
});

describe("resolveOperatorUser (Supabase validation)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns the Supabase user when the access token is valid", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "op@example.com",
          user_metadata: { name: "Operator" },
        },
      },
      error: null,
    });

    const { resolveOperatorUser } = await import("./auth");
    const user = await resolveOperatorUser(
      req({ authorization: "Bearer valid-jwt" }),
    );

    expect(user).toEqual({
      id: "user-123",
      email: "op@example.com",
      name: "Operator",
    });
    expect(mockGetUser).toHaveBeenCalledWith("valid-jwt");
  });

  it("falls back to email then id for display name", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-456",
          email: "op@example.com",
          user_metadata: {},
        },
      },
      error: null,
    });

    const { resolveOperatorUser } = await import("./auth");
    const user = await resolveOperatorUser(
      req({ authorization: "Bearer valid-jwt" }),
    );

    expect(user.name).toBe("op@example.com");
  });

  it("fails closed in production when Supabase rejects the token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid jwt" },
    });

    const { resolveOperatorUser } = await import("./auth");
    await expect(
      resolveOperatorUser(req({ authorization: "Bearer expired-jwt" })),
    ).rejects.toThrow(/failing closed/);
  });
});
