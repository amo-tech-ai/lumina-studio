import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("createSupabaseBrowserClient (IPI2-127)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@supabase/ssr");
    vi.resetModules();
  });

  async function loadClient(env: Record<string, string | undefined>) {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        vi.stubEnv(key, value);
      }
    }
    return import("./client");
  }

  it("throws when Supabase env vars are missing (fail-fast before auth call)", async () => {
    const { createSupabaseBrowserClient } = await loadClient({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });

    expect(() => createSupabaseBrowserClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("throws when only the anon key is missing", async () => {
    const { createSupabaseBrowserClient } = await loadClient({
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });

    expect(() => createSupabaseBrowserClient()).toThrow(/not configured/);
  });

  it("throws when only the Supabase URL is missing", async () => {
    const { createSupabaseBrowserClient } = await loadClient({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });

    expect(() => createSupabaseBrowserClient()).toThrow(/not configured/);
  });

  it("creates a browser client with the public URL + anon key", async () => {
    const createBrowserClient = vi.fn().mockReturnValue({ auth: {} });
    vi.doMock("@supabase/ssr", () => ({ createBrowserClient }));

    const { createSupabaseBrowserClient } = await loadClient({
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });

    const client = createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "public-anon-key",
    );
    expect(client).toEqual({ auth: {} });
  });
});
