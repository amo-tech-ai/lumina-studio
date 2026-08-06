import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "55555555-5555-4555-8555-555555555555";

const mockExtractAccessToken = vi.fn();
const mockCreateUserScopedClient = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  extractAccessToken: (...args: unknown[]) => mockExtractAccessToken(...args),
}));

vi.mock("@/lib/supabase/user-client", () => ({
  createUserScopedClient: (...args: unknown[]) => mockCreateUserScopedClient(...args),
}));

import { resolveJwtActor } from "./jwt-actor";

const req = () => new Request("http://localhost/whatever", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  mockExtractAccessToken.mockReturnValue("valid.jwt.token");
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  mockCreateUserScopedClient.mockReturnValue({ auth: { getUser: mockGetUser } });
});

describe("resolveJwtActor", () => {
  it("returns the verified subject, the token, and a caller-scoped client", async () => {
    const actor = await resolveJwtActor(req());

    expect(actor.ok).toBe(true);
    if (!actor.ok) return;
    expect(actor.userId).toBe(USER_ID);
    expect(actor.accessToken).toBe("valid.jwt.token");
    // The client is built from the caller's token, so auth.uid() is populated
    // and RLS / is_org_* helpers apply to anything the route queries with it.
    expect(mockCreateUserScopedClient).toHaveBeenCalledWith("valid.jwt.token");
    expect(actor.client).toBe(mockCreateUserScopedClient.mock.results[0].value);
  });

  it("401s when the request carries no access token", async () => {
    mockExtractAccessToken.mockReturnValue(undefined);
    expect(await resolveJwtActor(req())).toEqual({
      ok: false,
      status: 401,
      error: "Access token required",
    });
    expect(mockCreateUserScopedClient).not.toHaveBeenCalled();
  });

  it("401s when the JWT is invalid or expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } });
    expect(await resolveJwtActor(req())).toEqual({
      ok: false,
      status: 401,
      error: "Invalid or expired session",
    });
  });

  // The whole point of IPI-812: a non-uuid subject can never match a uuid column,
  // so it is rejected on shape rather than compared and silently 403'd downstream.
  it("401s on a non-uuid subject, whatever the sentinel happens to be", async () => {
    for (const id of ["dev-unauthenticated", "demo-user", ""]) {
      mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
      expect(await resolveJwtActor(req())).toEqual({
        ok: false,
        status: 401,
        error: "Unauthorized",
      });
    }
  });

  // createUserScopedClient throws synchronously when the Supabase env vars are
  // missing. This used to escape the route handler uncaught, so a misconfigured
  // deploy answered with Next's generic HTML 500 instead of a JSON envelope.
  it("500s instead of throwing when the Supabase client cannot be built", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateUserScopedClient.mockImplementation(() => {
      throw new Error("Supabase user client not configured");
    });

    expect(await resolveJwtActor(req())).toEqual({
      ok: false,
      status: 500,
      error: "Internal error",
    });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("500s instead of throwing when getUser() rejects", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValue(new Error("fetch failed"));

    expect(await resolveJwtActor(req())).toEqual({
      ok: false,
      status: 500,
      error: "Internal error",
    });
    err.mockRestore();
  });
});
