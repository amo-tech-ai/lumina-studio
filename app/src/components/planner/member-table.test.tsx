// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeAll, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// jsdom doesn't implement PointerEvent capture/scrollIntoView — Radix Select
// needs both to open via click. Standard testing-library workaround, scoped
// to this file (the repo has no shared vitest setup file to put it in).
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

vi.mock("./member-table.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
vi.mock("./invite-member-dialog.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

vi.mock("@/app/(operator)/app/planner/[instanceId]/settings/actions", () => ({
  inviteMemberAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
  removeMemberAction: vi.fn(),
}));

import { removeMemberAction } from "@/app/(operator)/app/planner/[instanceId]/settings/actions";
import { MemberTable } from "./member-table";
import type { PlannerMember } from "@/lib/planner/types";

afterEach(() => cleanup());

const OWNER: PlannerMember = {
  id: "a1",
  instanceId: "i1",
  userId: "owner-1",
  role: "owner",
  permissions: null,
  displayName: "Maya",
};
const MANAGER: PlannerMember = {
  id: "a2",
  instanceId: "i1",
  userId: "manager-1",
  role: "manager",
  permissions: null,
  displayName: "Priya",
};
const VIEWER: PlannerMember = {
  id: "a3",
  instanceId: "i1",
  userId: "viewer-1",
  role: "viewer",
  permissions: null,
  displayName: null,
};

describe("MemberTable", () => {
  it("renders name/role/access for every member — success state", () => {
    render(
      <MemberTable instanceId="i1" members={[OWNER, MANAGER]} role="owner" currentUserId="owner-1" />,
    );

    expect(screen.getByText("Maya")).toBeDefined();
    expect(screen.getByText("Priya")).toBeDefined();
    expect(screen.getByText("Full access")).toBeDefined();
    expect(screen.getByText("Edit access")).toBeDefined();
  });

  it("falls back to a placeholder when displayName is null", () => {
    render(<MemberTable instanceId="i1" members={[VIEWER]} role="owner" currentUserId="owner-1" />);
    expect(screen.getByText("Unnamed member")).toBeDefined();
  });

  it("renders just the owner row for a single-member plan — empty state (never truly empty)", () => {
    render(<MemberTable instanceId="i1" members={[OWNER]} role="owner" currentUserId="owner-1" />);
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + owner
  });

  it("shows Add member only for manager+ — AC-C role-guard", () => {
    const { rerender } = render(
      <MemberTable instanceId="i1" members={[OWNER, VIEWER]} role="viewer" currentUserId="viewer-1" />,
    );
    expect(screen.queryByRole("button", { name: "Add member" })).toBeNull();

    rerender(<MemberTable instanceId="i1" members={[OWNER, VIEWER]} role="manager" currentUserId="manager-1" />);
    expect(screen.getByRole("button", { name: "Add member" })).toBeDefined();
  });

  it("hides remove/role controls on the owner row even for another owner — dv.ownerLock", () => {
    render(<MemberTable instanceId="i1" members={[OWNER, MANAGER]} role="owner" currentUserId="manager-1" />);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull(); // owner row has no controls
  });

  it("a manager sees no controls on their own row, and none on a peer manager's either — self-elevation guard + SEC-003b target gate", () => {
    // Live-verified: planner_update_role/planner_remove_assignment reject
    // v_target_role IN ('owner','manager') for any non-owner caller — a
    // manager cannot act on a peer manager's row at all, not just role
    // changes. VIEWER stays here to prove the row-level gate is target-role-
    // specific, not "manager sees nothing but their own row."
    const MANAGER_2: PlannerMember = { ...MANAGER, id: "a4", userId: "manager-2", displayName: "Deepa" };
    render(
      <MemberTable
        instanceId="i1"
        members={[OWNER, MANAGER, MANAGER_2, VIEWER]}
        role="manager"
        currentUserId="manager-1"
      />,
    );
    // manager-1 is the caller: no control on self (MANAGER) or the peer
    // manager (MANAGER_2) — only the viewer row is actionable.
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
  });

  it("manager sees remove control for a non-owner, non-self row", () => {
    render(<MemberTable instanceId="i1" members={[OWNER, MANAGER, VIEWER]} role="manager" currentUserId="manager-1" />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeDefined();
  });

  it("calls removeMemberAction and shows the returned error inline — error state", async () => {
    vi.mocked(removeMemberAction).mockResolvedValue({
      ok: false,
      error: { code: "last_owner_protected", message: "A plan must always have at least one owner." },
    });
    const user = userEvent.setup();
    render(<MemberTable instanceId="i1" members={[OWNER, VIEWER]} role="owner" currentUserId="owner-1" />);

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("A plan must always have at least one owner.");
    });
    expect(removeMemberAction).toHaveBeenCalledWith("i1", "viewer-1");
  });

  it("wires the role select to the member's current role", () => {
    // ponytail: @radix-ui/react-select's open interaction triggers an
    // infinite Popper-positioning recursion in jsdom's zero-size layout
    // (known upstream gap, e.g. radix-ui/primitives#1826) — this repo has
    // no prior test that opens a Select. The onValueChange -> Server Action
    // call path is the same startTransition/setError shape already proven
    // by the "removeMemberAction" test above; browser-verified manually.
    render(<MemberTable instanceId="i1" members={[OWNER, VIEWER]} role="owner" currentUserId="owner-1" />);
    expect(screen.getByRole("combobox").textContent).toBe("viewer");
  });

  it("never renders invited/pending/accepted/expired/resend language — AC-F regression guard", () => {
    render(<MemberTable instanceId="i1" members={[OWNER, MANAGER, VIEWER]} role="owner" currentUserId="owner-1" />);
    const text = document.body.textContent ?? "";
    expect(/invited|pending|accepted|expired|resend/i.test(text)).toBe(false);
  });
});
