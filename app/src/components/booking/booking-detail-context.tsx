"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

import type { BookingActionKind } from "@/lib/booking/booking-fsm";

const ACTION_VERBS: Record<BookingActionKind, string> = {
  approve: "approve it",
  confirm: "confirm it",
  decline: "decline it",
  cancel: "cancel it",
};

export function useBookingDetailContext({
  status,
  talentName,
  dateStart,
  dateEnd,
  rateQuoted,
  viewerRole,
  actions,
}: {
  status: string;
  talentName: string;
  dateStart: string;
  dateEnd: string;
  rateQuoted: number | null;
  viewerRole: string | null;
  actions: BookingActionKind[];
}) {
  const actionPhrase = actions.length
    ? `You can help by: ${actions.map((a) => ACTION_VERBS[a]).join(", ")}.`
    : "This booking is in a final state — no further actions apply.";

  useAgentContext({
    description: `Booking detail — status "${status}" for ${talentName}, ${dateStart} to ${dateEnd}. ${
      rateQuoted != null ? `Rate: $${rateQuoted}.` : "No rate quoted yet."
    } Viewer role: ${viewerRole ?? "unknown"}. ${actionPhrase}`,
    value: {
      booking_status: status,
      talent_name: talentName,
      date_start: dateStart || null,
      date_end: dateEnd || null,
      rate_quoted: rateQuoted,
      viewer_role: viewerRole,
      available_actions: actions,
    },
  });
}
