// IPI-348 · MODELGATE-10 — Booking Agent tools.
// READ via public.search_talent; WRITE via create_booking_request RPC only.
// Never expose confirm_booking — confirmation is human-only via POST .../approve.
//
// Same auth pattern as talent-match-tools.ts: requestToken (AsyncLocalStorage)
// + user-scoped Supabase client so auth.uid() resolves inside RPCs.

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createBookingRequest } from "@/lib/booking/booking-service";
import { TalentResultSchema } from "@/lib/talent/types";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { requestToken } from "@/lib/request-token";

function getUserScopedClient() {
  const accessToken = requestToken.getStore();
  if (!accessToken) throw new Error("Access token not available in request context");
  return createUserScopedClient(accessToken);
}

type TalentRow = z.infer<typeof TalentResultSchema>;

async function findTalentInSearch(
  talentProfileId: string,
  dateStart: string,
  dateEnd: string,
): Promise<TalentRow | null> {
  const supabase = getUserScopedClient();
  const { data, error } = await supabase.rpc("search_talent", {
    p_date_start: dateStart,
    p_date_end: dateEnd,
  });
  if (error) throw new Error(`search_talent failed: ${error.message}`);
  const rows = (data ?? []) as TalentRow[];
  return rows.find((row) => row.id === talentProfileId) ?? null;
}

/** Tier midpoints from talent.compute_rate_tier boundaries — not raw rates from DB. */
const TIER_SUGGESTED_DAILY: Record<string, number> = {
  $: 400,
  $$: 1000,
  $$$: 2500,
};

export function buildQuoteDraft(input: {
  displayName: string;
  dateStart: string;
  dateEnd: string;
  rateTier?: string | null;
  shootType?: string;
  rateQuoted?: number;
}): { suggestedRate: number | null; messageDraft: string } {
  const suggestedRate =
    input.rateQuoted ??
    (input.rateTier ? (TIER_SUGGESTED_DAILY[input.rateTier] ?? null) : null);

  const shootLine = input.shootType ? ` for your ${input.shootType} shoot` : "";
  const rateLine =
    suggestedRate != null
      ? `We're offering $${suggestedRate.toLocaleString()} for ${input.dateStart}–${input.dateEnd}.`
      : `We'd like to book you ${input.dateStart}–${input.dateEnd}.`;

  return {
    suggestedRate,
    messageDraft:
      `Hi ${input.displayName},\n\n` +
      `${rateLine}${shootLine}. ` +
      `Please let us know if these dates work or if you'd like to counter.\n\n` +
      `Thanks!`,
  };
}

export const checkTalentAvailability = createTool({
  id: "checkTalentAvailability",
  description:
    "Pre-check whether a talent profile appears available for a date range. " +
    "Uses search_talent availability flags (blocked/tentative/booked calendar rows) — " +
    "UX feedback only; confirmed overlap is enforced at approve time by the DB EXCLUDE constraint.",
  inputSchema: z.object({
    talentProfileId: z.string().uuid(),
    dateStart: z.string().describe("YYYY-MM-DD"),
    dateEnd: z.string().describe("YYYY-MM-DD"),
  }),
  outputSchema: z.object({
    talentProfileId: z.string(),
    isAvailable: z.boolean(),
    displayName: z.string().nullable(),
    rateTier: z.string().nullable(),
    reason: z.string(),
  }),
  execute: async ({ talentProfileId, dateStart, dateEnd }) => {
    const match = await findTalentInSearch(talentProfileId, dateStart, dateEnd);
    if (!match) {
      return {
        talentProfileId,
        isAvailable: false,
        displayName: null,
        rateTier: null,
        reason:
          "Talent profile was not returned by search_talent for these dates (may be outside browse limit).",
      };
    }

    return {
      talentProfileId,
      isAvailable: match.is_available,
      displayName: match.display_name,
      rateTier: match.rate_tier ?? null,
      reason: match.is_available
        ? "No blocked, tentative, or booked availability conflicts for the requested dates."
        : "Talent has blocked, tentative, or booked availability overlapping these dates.",
    };
  },
});

export const draftBookingQuote = createTool({
  id: "draftBookingQuote",
  description:
    "Draft a suggested day rate and outreach message for a booking request. Read-only — does not write to the database.",
  inputSchema: z.object({
    displayName: z.string(),
    dateStart: z.string().describe("YYYY-MM-DD"),
    dateEnd: z.string().describe("YYYY-MM-DD"),
    rateTier: z.enum(["$", "$$", "$$$"]).optional(),
    shootType: z.string().optional(),
    rateQuoted: z.number().optional().describe("Override suggested rate when operator already set one"),
  }),
  outputSchema: z.object({
    suggestedRate: z.number().nullable(),
    messageDraft: z.string(),
  }),
  execute: async (input) => buildQuoteDraft(input),
});

export const createBookingDraft = createTool({
  id: "createBookingDraft",
  description:
    "Create a booking request in status requested via create_booking_request RPC. " +
    "Requires operatorConfirmed after explicit human approval — never call proactively.",
  inputSchema: z.object({
    brandOrgId: z.string().uuid(),
    talentProfileId: z.string().uuid(),
    dateStart: z.string().describe("YYYY-MM-DD"),
    dateEnd: z.string().describe("YYYY-MM-DD"),
    shootId: z.string().uuid().optional(),
    rateQuoted: z.number().optional(),
    message: z.string().max(2000).optional(),
    operatorConfirmed: z
      .boolean()
      .describe("Must be true after the operator explicitly approves sending the request"),
  }),
  outputSchema: z.object({
    booking_id: z.string(),
    status: z.string(),
    version: z.number(),
    expires_at: z.string(),
  }),
  execute: async ({
    brandOrgId,
    talentProfileId,
    dateStart,
    dateEnd,
    shootId,
    rateQuoted,
    message,
    operatorConfirmed,
  }) => {
    if (!operatorConfirmed) {
      throw new Error(
        "createBookingDraft requires operatorConfirmed: true after explicit operator approval",
      );
    }

    const supabase = getUserScopedClient();
    const result = await createBookingRequest(supabase, {
      brand_org_id: brandOrgId,
      talent_profile_id: talentProfileId,
      shoot_id: shootId ?? null,
      date_start: dateStart,
      date_end: dateEnd,
      rate_quoted: rateQuoted,
      message,
    });

    if (!result.ok) {
      throw new Error(`${result.code}: ${result.message}`);
    }

    return result.data;
  },
});
