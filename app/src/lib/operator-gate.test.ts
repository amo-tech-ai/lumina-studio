import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalDevAuthFallbackAllowed,
  isOperatorAuthEnforced,
  OperatorAuthError,
  withOperatorAuth,
} from "./operator-gate";

vi.mock("./auth", () => ({
  resolveOperatorUser: vi.fn(),
}));

import { resolveOperatorUser } from "./auth";

const resolveOperatorUserMock = vi.mocked(resolveOperatorUser);

describe("isOperatorAuthEnforced (IPI-468)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is true when OPERATOR_AUTH_ENABLED is true", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isOperatorAuthEnforced()).toBe(true);
  });

  it("is true on production even when OPERATOR_AUTH_ENABLED is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isOperatorAuthEnforced()).toBe(true);
  });

  it("is true on production when OPERATOR_AUTH_ENABLED is false", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    expect(isOperatorAuthEnforced()).toBe(true);
  });

  it("is false in local dev when auth flag is not strictly true", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    expect(isOperatorAuthEnforced()).toBe(false);
  });
});

describe("isLocalDevAuthFallbackAllowed (IPI-468)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows fallback in local dev with auth disabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    expect(isLocalDevAuthFallbackAllowed()).toBe(true);
  });

  it("denies fallback when auth is strictly enabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    expect(isLocalDevAuthFallbackAllowed()).toBe(false);
  });

  it("denies fallback on production runtime", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    expect(isLocalDevAuthFallbackAllowed()).toBe(false);
  });
});

describe("withOperatorAuth — CopilotKit HTTP boundary (IPI2-127, IPI-468)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns dev identity in local dev when OPERATOR_AUTH_ENABLED is not true", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");

    const user = await withOperatorAuth(
      new Request("http://localhost/api/copilotkit"),
    );

    expect(user.id).toBe("dev-unauthenticated");
    expect(user.name).toContain("Dev (auth disabled)");
    expect(resolveOperatorUserMock).not.toHaveBeenCalled();
  });

  it("throws 401 on production when OPERATOR_AUTH_ENABLED is missing and session invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    resolveOperatorUserMock.mockRejectedValue(new Error("no session"));

    await expect(
      withOperatorAuth(new Request("http://localhost/api/copilotkit")),
    ).rejects.toThrow(OperatorAuthError);
    expect(resolveOperatorUserMock).toHaveBeenCalled();
  });

  it("throws 401 on production when OPERATOR_AUTH_ENABLED is false and session invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    resolveOperatorUserMock.mockRejectedValue(new Error("no session"));

    await expect(
      withOperatorAuth(new Request("http://localhost/api/copilotkit")),
    ).rejects.toThrow(OperatorAuthError);
    expect(resolveOperatorUserMock).toHaveBeenCalled();
  });

  it("throws 401 on production when OPERATOR_AUTH_ENABLED is malformed and session invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "yes");
    resolveOperatorUserMock.mockRejectedValue(new Error("no session"));

    await expect(
      withOperatorAuth(new Request("http://localhost/api/copilotkit")),
    ).rejects.toThrow(OperatorAuthError);
    expect(resolveOperatorUserMock).toHaveBeenCalled();
  });

  it("returns operator user on production when OPERATOR_AUTH_ENABLED is missing but session validates", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const expectedUser = { id: "user-prod", name: "Operator" };
    resolveOperatorUserMock.mockResolvedValue(expectedUser);

    const user = await withOperatorAuth(
      new Request("http://localhost/api/copilotkit", {
        headers: { authorization: "Bearer valid.jwt" },
      }),
    );

    expect(user).toEqual(expectedUser);
    expect(resolveOperatorUserMock).toHaveBeenCalled();
  });

  it("throws OperatorAuthError when auth is enabled and resolveOperatorUser fails", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUserMock.mockRejectedValue(new Error("failing closed"));

    await expect(
      withOperatorAuth(new Request("http://localhost/api/copilotkit")),
    ).rejects.toThrow(OperatorAuthError);
  });

  it("returns the operator user when auth is enabled and session validates", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const expectedUser = { id: "user-abc", name: "Operator" };
    resolveOperatorUserMock.mockResolvedValue(expectedUser);
    const request = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer valid.jwt" },
    });

    const user = await withOperatorAuth(request);

    expect(user).toEqual(expectedUser);
    expect(resolveOperatorUserMock).toHaveBeenCalledWith(request);
  });

  it("never returns dev-unauthenticated on production with valid session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const expectedUser = { id: "user-real", name: "Operator" };
    resolveOperatorUserMock.mockResolvedValue(expectedUser);

    const user = await withOperatorAuth(
      new Request("http://localhost/api/copilotkit", {
        headers: { authorization: "Bearer valid.jwt" },
      }),
    );

    expect(user.id).not.toBe("dev-unauthenticated");
    expect(user).toEqual(expectedUser);
  });
});

describe("OperatorAuthError", () => {
  it("has the correct name and message", () => {
    const err = new OperatorAuthError("Unauthorized");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("OperatorAuthError");
    expect(err.message).toBe("Unauthorized");
  });
});
