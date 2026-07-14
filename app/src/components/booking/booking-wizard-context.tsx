"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

const STEP_LABELS = ["Talent & shoot", "Dates", "Rate", "Message", "Review & send"];

const STEP_NEXT_ACTIONS: Record<number, string[]> = {
  0: ["confirm the talent", "link a shoot", "continue to dates"],
  1: ["suggest dates", "check availability", "continue to the rate"],
  2: ["suggest a rate", "explain the suggested rate", "approve the rate", "continue to the message"],
  3: ["draft a message", "improve the message", "continue to review"],
  4: ["review the request", "send the request"],
};

type Outcome = "idle" | "created" | "rejected";

export function useBookingWizardContext({
  step,
  talentName,
  talentId,
  dateStart,
  dateEnd,
  rateQuoted,
  messageDraft,
  outcome,
}: {
  step: number;
  talentName: string;
  talentId: string;
  dateStart: string;
  dateEnd: string;
  rateQuoted: string;
  messageDraft: string;
  outcome: Outcome;
}) {
  const stepLabel = STEP_LABELS[step] ?? `Step ${step + 1}`;
  const nextActions = outcome === "idle" ? (STEP_NEXT_ACTIONS[step] ?? []) : [];
  const outcomeNote =
    outcome === "created"
      ? "Booking request has already been sent."
      : outcome === "rejected"
        ? "Operator declined to send this request."
        : `You can help with: ${nextActions.join(", ")}.`;

  useAgentContext({
    description: `Booking wizard — operator is on the ${stepLabel} step, booking talent "${talentName || talentId}". ${
      dateStart && dateEnd ? `Dates: ${dateStart} to ${dateEnd}.` : "No dates selected yet."
    } ${rateQuoted ? `Rate override: $${rateQuoted}.` : "No rate override — AI will suggest one."} ${
      messageDraft ? "A draft message exists." : "No draft message yet."
    } ${outcomeNote}`,
    value: {
      wizard_step: stepLabel,
      step_number: step + 1,
      talent_id: talentId,
      talent_name: talentName,
      date_start: dateStart || null,
      date_end: dateEnd || null,
      rate_override: rateQuoted || null,
      message_drafted: Boolean(messageDraft.trim()),
      outcome,
      suggested_next_actions: nextActions,
    },
  });
}
