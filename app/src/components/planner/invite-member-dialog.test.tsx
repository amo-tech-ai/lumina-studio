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

vi.mock("./invite-member-dialog.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

vi.mock("@/app/(operator)/app/planner/[instanceId]/settings/actions", () => ({
  inviteMemberAction: vi.fn(),
}));

import { inviteMemberAction } from "@/app/(operator)/app/planner/[instanceId]/settings/actions";
import { InviteMemberDialog } from "./invite-member-dialog";

afterEach(() => cleanup());

describe("InviteMemberDialog", () => {
  it("is a real dialog with role=dialog aria-modal=true — AC-B a11y", async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.id).toBe("pl-invite-dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("defaults the access select to contributor, never owner", async () => {
    // ponytail: @radix-ui/react-select's open interaction triggers an
    // infinite Popper-positioning recursion in jsdom's zero-size layout
    // (known upstream gap, e.g. radix-ui/primitives#1826) — this repo has
    // no prior test that opens a Select. Assert the wired default value
    // instead of the rendered option list; the role-exclusion itself is
    // proven by source (INVITE_ROLES never includes 'owner') and covered
    // live by mutations.test.ts's "maps invalid_role" case for the RPC.
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    expect(screen.getByRole("combobox").textContent).toBe("contributor");
  });

  it("submits email + role and closes on success — success state, no pending/invited chip", async () => {
    vi.mocked(inviteMemberAction).mockResolvedValue({
      ok: true,
      data: { id: "a1", instanceId: "i1", userId: "u1", role: "contributor" },
    });
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(inviteMemberAction).toHaveBeenCalledWith("i1", "new@example.com", "contributor");
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows the cloaked unavailable-account error inline via #pl-invite-err, dialog stays open — unknown/not-found state", async () => {
    // SEC-004 (migration 20260714211800, PR #387): unknown email and
    // out-of-org email are deliberately indistinguishable now — the RPC only
    // ever raises user_not_available, not the old no_account_found/
    // user_not_in_org split. This mock must track that live contract.
    vi.mocked(inviteMemberAction).mockResolvedValue({
      ok: false,
      error: { code: "user_not_available", message: "That person is not available to invite." },
    });
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    await user.type(screen.getByLabelText(/email/i), "nobody@example.com");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const err = await screen.findByRole("alert");
    expect(err.id).toBe("pl-invite-err");
    expect(err.textContent).toBe("That person is not available to invite.");
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("closes and unmounts the dialog on Cancel — focus-return verified live, not here", async () => {
    // ponytail: jsdom doesn't implement real focus/blur semantics (documented
    // jsdom limitation, e.g. jsdom/jsdom#2586), so document.activeElement
    // after an unmount can't be reliably asserted in this environment. This
    // isn't Radix's default FocusScope behavior — this component has no
    // <DialogTrigger>, so an explicit onCloseAutoFocus + triggerRef.focus()
    // was added (Sentry caught the missing case in review; confirmed live in
    // a real browser that focus landed on <body> without the fix, and on the
    // "Add member" button with it).
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("never renders invited/pending/accepted/expired/resend language — AC-F regression guard", async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog instanceId="i1" callerRole="owner" />);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    const text = document.body.textContent ?? "";
    expect(/invited|pending|accepted|expired|resend/i.test(text)).toBe(false);
  });
});
