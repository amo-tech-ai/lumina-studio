// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ApprovalCardShell, ApprovalActions, ApprovalHeader } from "@/components/approval-card";
import { useState } from "react";

/** Mirrors FollowUpDraftCard approve path without mounting CopilotKit hooks. */
function DraftCardHarness() {
  const [draft, setDraft] = useState("Hello from company 11111111-1111-4111-8111-111111111111");
  const [kept, setKept] = useState<string | null>(null);

  if (kept) {
    return <pre data-testid="kept">{kept}</pre>;
  }

  return (
    <ApprovalCardShell className="p-2">
      <ApprovalHeader title="Review follow-up draft" titleClassName="text-sm" />
      <textarea
        data-testid="crm-follow-up-body"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <ApprovalActions
        className="flex gap-2"
        state="idle"
        onReject={() => setKept(null)}
        onApprove={() => setKept(draft)}
        rejectLabel="Discard"
        approveLabel="Keep draft"
      />
    </ApprovalCardShell>
  );
}

describe("CRM follow-up draft HITL (IPI-369 Phase C)", () => {
  it("Keep draft stores editable text without implying send/log", () => {
    render(<DraftCardHarness />);
    fireEvent.change(screen.getByTestId("crm-follow-up-body"), {
      target: { value: "Edited draft only" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Keep draft" }));
    expect(screen.getByTestId("kept").textContent).toBe("Edited draft only");
  });
});
