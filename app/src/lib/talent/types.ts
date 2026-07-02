// IPI-308 · MODEL-P2 — shared talent search result shape, used by both the
// model-match agent's tools and the Talent tab UI (same public.search_talent RPC).
import { z } from "zod";

export const TalentResultSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  bio: z.string().nullable(),
  measurements: z.record(z.unknown()),
  languages: z.array(z.string()),
  travel_ready: z.boolean(),
  verification_status: z.string(),
  ai_tags: z.record(z.unknown()),
  is_agency_represented: z.boolean(),
  rate_tier: z.string().nullable(),
  is_available: z.boolean(),
});

export type TalentResult = z.infer<typeof TalentResultSchema>;

export type TalentSearchFilters = {
  shootType?: string;
  budgetTier?: "$" | "$$" | "$$$";
  dateStart?: string;
  dateEnd?: string;
  representation?: "independent" | "agency";
  onlyShortlistId?: string;
};
