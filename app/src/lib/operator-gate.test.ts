import { afterEach, describe, expect, it, vi } from "vitest";
import { withOperatorAuth } from "./operator-gate";

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

  it("delegates without auth when OPERATOR_AUTH_ENABLED is not true", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await withOperatorAuth(new Request("http://localhost/api/copilotkit"), handler);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(resolveOperatorUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 when auth is enabled and resolveOperatorUser fails closed", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUserMock.mockRejectedValue(new Error("failing closed"));
    const handler = vi.fn();

    const res = await withOperatorAuth(new Request("http://localhost/api/copilotkit"), handler);

    expect(res.status).toBe(401);
    await expect(res.text()).resolves.toBe("Unauthorized");
    expect(handler).not.toHaveBeenCalled();
  });

  it("delegates when auth is enabled and the operator session validates", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUserMock.mockResolvedValue({ id: "user-abc", name: "Operator" });
    const handler = vi.fn().mockResolvedValue(new Response("stream", { status: 200 }));
    const request = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer valid.jwt" },
    });

    const res = await withOperatorAuth(request, handler);

    expect(res.status).toBe(200);
    expect(resolveOperatorUserMock).toHaveBeenCalledWith(request);
    expect(handler).toHaveBeenCalledWith(request);
  });
});
