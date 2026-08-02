// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useOnboardingSession } from "./use-onboarding-session";
import { ANALYSIS_SCREEN } from "./navigation";
import { ONBOARDING_BRAND_NAME_REQUIRED } from "./onboarding-errors";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";
const KEY = "idem-test-key";

const sessionRow = {
  id: SESSION_ID,
  user_id: USER_ID,
  idempotency_key: KEY,
  status: "draft" as const,
  current_screen: 4,
  draft_answers: {
    brandName: "Maison",
    websiteUrl: "https://maison.test",
    build: null,
    listed: {},
    grow: null,
  },
  organization_id: null,
  brand_id: null,
};

function makeClient(overrides?: {
  rpcData?: { organization_id: string; brand_id: string };
  rpcError?: { message: string } | null;
  update?: ReturnType<typeof vi.fn>;
  getUserError?: Error | null;
}) {
  const update = overrides?.update ?? vi.fn().mockReturnValue({
    eq: () => Promise.resolve({ data: null, error: null }),
  });
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: () => Promise.resolve({ data: sessionRow, error: null }),
    single: () => Promise.resolve({ data: sessionRow, error: null }),
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        overrides?.getUserError
          ? { data: { user: null }, error: { message: overrides.getUserError.message } }
          : { data: { user: { id: USER_ID } }, error: null },
      ),
    },
    from: (table: string) => {
      if (table === "brands") {
        return {
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      return {
        select: () => selectChain,
        insert: () => ({ select: () => selectChain }),
        update,
      };
    },
    rpc: vi.fn().mockResolvedValue({
      data: overrides?.rpcError
        ? null
        : (overrides?.rpcData ?? {
            organization_id: "33333333-3333-4333-8333-333333333333",
            brand_id: "44444444-4444-4444-8444-444444444444",
          }),
      error: overrides?.rpcError ?? null,
    }),
  } as unknown as SupabaseClient;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOnboardingSession", () => {
  it("hydrates screen + answers from the draft session", async () => {
    const client = makeClient();
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient: () => client,
        getIdempotencyKey: () => KEY,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    if (result.current.status !== "ready") throw new Error("expected ready");
    expect(result.current.currentScreen).toBe(4);
    expect(result.current.answers.brandName).toBe("Maison");
    expect(result.current.sessionId).toBe(SESSION_ID);
  });

  it("debounced saveDraft updates current_screen + draft_answers", async () => {
    const update = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const client = makeClient({ update });
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient: () => client,
        getIdempotencyKey: () => KEY,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    vi.useFakeTimers();
    act(() => {
      result.current.saveDraft(5, {
        build: null,
        brandName: "Maison",
        websiteUrl: "https://maison.test",
        listed: { shopify: true },
        grow: null,
      });
    });
    expect(update).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(update).toHaveBeenCalled();
    const patch = update.mock.calls[0][0];
    expect(patch.current_screen).toBe(5);
    expect(patch.draft_answers.listed).toEqual({ shopify: true });
  });

  it("materialize flushes draft answers then calls createOrgAndBrand RPC", async () => {
    const update = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const client = makeClient({ update });
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient: () => client,
        getIdempotencyKey: () => KEY,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let out: { brandId: string } | undefined;
    await act(async () => {
      out = await result.current.materialize({
        build: "DTC",
        brandName: "Maison",
        websiteUrl: "https://maison.test",
        listed: {},
        grow: "Scale",
      });
    });
    expect(out?.brandId).toBe("44444444-4444-4444-8444-444444444444");
    expect(client.rpc).toHaveBeenCalledWith("materialize_onboarding_session", {
      p_idempotency_key: KEY,
      p_brand_name: "Maison",
      p_brand_url: "https://maison.test",
    });
    // Pre-RPC flush must not advance the stored screen to analysis.
    for (const call of update.mock.calls) {
      expect(call[0].current_screen).not.toBe(ANALYSIS_SCREEN);
      expect(call[0].current_screen).not.toBe(12);
    }
  });

  it("materialize failure does not persist analysis screen", async () => {
    const update = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const client = makeClient({
      update,
      rpcError: { message: "duplicate key value violates unique constraint" },
    });
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient: () => client,
        getIdempotencyKey: () => KEY,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await expect(
      act(async () => {
        await result.current.materialize({
          build: "DTC",
          brandName: "Maison",
          websiteUrl: "https://maison.test",
          listed: {},
          grow: "Scale",
        });
      }),
    ).rejects.toThrow();

    for (const call of update.mock.calls) {
      expect(call[0].current_screen).not.toBe(ANALYSIS_SCREEN);
      expect(call[0].current_screen).not.toBe(12);
    }
  });

  it("rejects an empty brand name before calling the RPC", async () => {
    const update = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const client = makeClient({ update });
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient: () => client,
        getIdempotencyKey: () => KEY,
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await expect(
      act(async () => {
        await result.current.materialize({
          build: null,
          brandName: "   ",
          websiteUrl: "https://maison.test",
          listed: {},
          grow: null,
        });
      }),
    ).rejects.toThrow(ONBOARDING_BRAND_NAME_REQUIRED);

    expect(client.rpc).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("surfaces a safe message on bootstrap failure and retry recovers", async () => {
    let failOnce = true;
    const client = makeClient();
    const getUser = vi.fn().mockImplementation(() => {
      if (failOnce) {
        failOnce = false;
        return Promise.resolve({
          data: { user: null },
          error: { message: 'relation "pg_something" does not exist' },
        });
      }
      return Promise.resolve({ data: { user: { id: USER_ID } }, error: null });
    });
    (client as { auth: { getUser: typeof getUser } }).auth.getUser = getUser;

    const createClient = vi.fn(() => client);
    const { result } = renderHook(() =>
      useOnboardingSession({
        createClient,
        getIdempotencyKey: () => KEY,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status !== "error") throw new Error("expected error");
    expect(result.current.message).not.toMatch(/pg_something|relation/i);
    expect(result.current.message).toMatch(/try again/i);

    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    // One GoTrueClient per hook lifetime — retry must not call the factory again.
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
