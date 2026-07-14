// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./settings-tabs.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
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

import { SettingsTabs } from "./settings-tabs";

afterEach(() => cleanup());

const MEMBERS = [
  { id: "a1", instanceId: "i1", userId: "u1", role: "owner" as const, permissions: null, displayName: "Maya" },
];

describe("SettingsTabs — AC-D disabled tabs convention", () => {
  it("only Members is a real, enabled tab", () => {
    render(<SettingsTabs instanceId="i1" members={MEMBERS} role="owner" currentUserId="u1" />);
    expect(screen.getByRole("tab", { name: "Members" }).hasAttribute("disabled")).toBe(false);
  });

  it("Notifications/Workflow/Danger render disabled with title='Coming soon', not as tabs", () => {
    render(<SettingsTabs instanceId="i1" members={MEMBERS} role="owner" currentUserId="u1" />);
    for (const label of ["Notifications", "Workflow", "Danger zone"]) {
      const el = screen.getByRole("button", { name: label });
      expect(el.hasAttribute("disabled")).toBe(true);
      expect(el.getAttribute("title")).toBe("Coming soon");
    }
    // AC-D: not the ComingSoonButton component itself, just its convention.
    expect(screen.queryAllByRole("tab")).toHaveLength(1);
  });

  it("renders the member table under the Members tab", () => {
    render(<SettingsTabs instanceId="i1" members={MEMBERS} role="owner" currentUserId="u1" />);
    expect(screen.getByText("Maya")).toBeDefined();
  });
});
