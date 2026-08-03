import { afterEach, describe, expect, it, vi } from "vitest";
import { DRAFT_ACTION_MESSAGES } from "./draft-action-errors";
import { discardBrandDraft } from "./discard-draft";

function mockSupabase(
  brand: Record<string, unknown> | null,
  selectErr?: { code?: string; message: string; details?: string; hint?: string },
  updateErr?: { code?: string; message: string; details?: string; hint?: string },
) {
  const updateCalls: Record<string, unknown>[] = [];
  let selectCount = 0;
  return {
    sb: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              selectCount += 1;
              if (selectCount === 1 && selectErr) {
                return { data: null, error: selectErr };
              }
              return { data: brand, error: null };
            }),
          })),
        })),
        update: vi.fn((patch: Record<string, unknown>) => {
          updateCalls.push(patch);
          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () =>
                    updateErr
                      ? { data: null, error: updateErr }
                      : { data: { id: "b1" }, error: null },
                }),
              }),
            }),
          };
        }),
      })),
    } as never,
    updateCalls,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("discardBrandDraft", () => {
  it("returns an error when the brand is not found", async () => {
    const { sb } = mockSupabase(null);
    const result = await discardBrandDraft(sb, "b1");
    expect(result).toEqual({
      ok: false,
      code: "NOT_FOUND",
      error: DRAFT_ACTION_MESSAGES.NOT_FOUND,
    });
  });

  it("restores to brand_created when there was no prior scores_complete profile", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile: null,
      intake_status: "draft_ready",
    });
    const result = await discardBrandDraft(sb, "b1");

    expect(result).toEqual({ ok: true, status: "completed" });
    expect(updateCalls[0]).toMatchObject({ intake_status: "brand_created" });
  });

  it("IPI-744 — clears analysis_lock_token/analysis_locked_at on rejection, so a delayed reanalyzeBrand restore can't later overwrite the restored status", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile: { _lifecycle: "scores_complete" },
      intake_status: "draft_ready",
    });
    const result = await discardBrandDraft(sb, "b1");

    expect(result).toEqual({ ok: true, status: "completed" });
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      intake_status: "ready",
      analysis_lock_token: null,
      analysis_locked_at: null,
    });
  });

  it("never leaks raw Supabase update errors to the client", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { sb } = mockSupabase(
      { id: "b1", ai_profile: null, intake_status: "draft_ready" },
      undefined,
      {
        code: "42501",
        message: 'permission denied for table brands',
        details: "policy brands_update",
        hint: "GRANT UPDATE",
      },
    );
    const result = await discardBrandDraft(sb, "b1");
    expect(result).toEqual({
      ok: false,
      code: "FORBIDDEN",
      error: DRAFT_ACTION_MESSAGES.FORBIDDEN,
    });
    expect(JSON.stringify(result)).not.toMatch(/brands|policy|GRANT|permission denied/i);
    expect(spy).toHaveBeenCalled();
  });

  it("treats 23505 as idempotent success when brand already left draft_ready", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let selectCount = 0;
    const sb = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              selectCount += 1;
              if (selectCount === 1) {
                return {
                  data: { id: "b1", ai_profile: null, intake_status: "draft_ready" },
                  error: null,
                };
              }
              return { data: { intake_status: "brand_created" }, error: null };
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: {
                    code: "23505",
                    message: 'duplicate key value violates unique constraint "brands_pkey"',
                  },
                }),
              }),
            }),
          }),
        })),
      })),
    } as never;

    const result = await discardBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: true, status: "already_completed" });
  });
});
