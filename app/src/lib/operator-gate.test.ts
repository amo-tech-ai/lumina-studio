import { afterEach, describe, expect, it, vi } from "vitest";
import { OperatorAuthError, withOperatorAuth } from "./operator-gate";

vi.mock("./auth", () => ({
  resolveOperatorUser: vi.fn(),
}));

import { resolveOperatorUser } from "./auth";

const resolveOperatorUserMock = vi.mocked(resolveOperatorUser);

describe("withOperatorAuth — CopilotKit HTTP boundary (IPI2-127)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns dev identity without auth when OPERATOR_AUTH_ENABLED is not true", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");

    const user = await withOperatorAuth(
      new Request("http://localhost/api/copilotkit"),
    );

    expect(user.id).toBe("dev-unauthenticated");
    expect(user.name).toContain("Dev (auth disabled)");
    expect(resolveOperatorUserMock).not.toHaveBeenCalled();
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
});

describe("OperatorAuthError", () => {
  it("has the correct name and message", () => {
    const err = new OperatorAuthError("Unauthorized");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("OperatorAuthError");
    expect(err.message).toBe("Unauthorized");
  });
});
