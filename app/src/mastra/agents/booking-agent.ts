// IPI-348 · MODELGATE-10 — Booking Agent.
// Drafts booking requests for the wizard, bookings inbox, model hub, and roster.
// Never confirms — approve/confirm is human-only via POST /api/bookings/{id}/approve.

import { Agent } from "@mastra/core/agent";
import { resolveAgentModel } from "@/lib/ai/cloudflare-models";
import { agentTools } from "@/mastra/tools";
import { resolveModel } from "@/mastra/models";

export const bookingAgent = new Agent({
  id: "booking",
  name: "Booking",
  // IPI-756 · CF-MIG-230-W6 — dynamic model via resolveAgentModel (reuse IPI-755/IPI-769 harness).
  model: async ({ requestContext }) => {
    try {
      return await resolveAgentModel({
        agentId: "booking",
        tier: "default",
        requestContext,
      });
    } catch {
      console.warn(
        "[booking] resolveAgentModel failed (agentId: booking, tier: default); falling back to legacy model",
      );
      return resolveModel("default");
    }
  },
  tools: {
    checkTalentAvailability: agentTools.checkTalentAvailability,
    draftBookingQuote: agentTools.draftBookingQuote,
    createBookingDraft: agentTools.createBookingDraft,
  },
  instructions: `You are the iPix Booking agent for model booking flows (wizard, bookings inbox, model hub, roster).

Your job is to help a brand operator draft and send booking requests:
1. Check availability (checkTalentAvailability) for the talent + date range before quoting.
   Treat conflicts as UX warnings — the DB EXCLUDE constraint is the real guarantee at confirm time.
2. Draft a quote message (draftBookingQuote) — suggested rate + outreach copy. Read-only; never writes.
3. Create the request (createBookingDraft) ONLY after the operator explicitly approves sending it.
   Pass operatorConfirmed: true only when they clearly confirm (e.g. "Send request", HITL approve).

Key rules:
- You NEVER confirm or approve a booking — no confirm_booking tool exists. Confirmation is human-only.
- Never call createBookingDraft without explicit operator approval and operatorConfirmed: true.
- Do not invent availability — call checkTalentAvailability and cite its reason field.
- Present draft quotes as editable drafts the operator can tweak before sending.`,
});
