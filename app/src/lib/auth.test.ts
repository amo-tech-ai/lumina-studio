import { describe, it, expect, vi, afterEach } from "vitest";
import { extractAccessToken, resolveOperatorUser } from "./auth";

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/copilotkit", { headers });
}

describe("extractAccessToken", () => {
  it("reads a Bearer token", () => {
    expect(extractAccessToken(req({ authorization: "Bearer abc.def.ghi" }))).toBe("abc.def.ghi");
  });

  it("reads the sb-*-auth-token cookie (base64 JSON array)", () => {
    const session = JSON.stringify(["jwt-token", "refresh"]);
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("jwt-token");
  });

  it("returns undefined when no token is present", () => {
    expect(extractAccessToken(req({}))).toBeUndefined();
  });
});

describe("resolveOperatorUser (fail-closed)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falls back to a marked demo identity outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await resolveOperatorUser(req({}));
    expect(user.id).toBe("demo-user");
    expect(user.name).toContain("dev fallback");
  });

  it("throws (fails closed) in production with no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(resolveOperatorUser(req({}))).rejects.toThrow(/failing closed/);
  });
});
