// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./hub-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
vi.mock("./new-plan-dialog.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/app/(operator)/app/planner/actions", () => ({
  createInstanceAction: vi.fn(),
}));

import { createInstanceAction } from "@/app/(operator)/app/planner/actions";
import type { EligibleEntity, WorkflowTemplate } from "@/lib/planner/queries";

import { NewPlanDialog } from "./new-plan-dialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ENTITIES: EligibleEntity[] = [
  { entityType: "shoot", entityId: "shoot-1", label: "Summer Lookbook" },
  { entityType: "campaign", entityId: "camp-1", label: "Q3 Retail Push" },
];
const TEMPLATES: WorkflowTemplate[] = [
  { id: "wf-1", name: "5-Week Product Shoot", category: "production", isDefault: true },
];

function renderDialog(overrides: Partial<React.ComponentProps<typeof NewPlanDialog>> = {}) {
  return render(
    <NewPlanDialog
      orgId="org-1"
      eligibleEntities={ENTITIES}
      workflowTemplates={TEMPLATES}
      variant="header"
      {...overrides}
    />,
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("new-plan-trigger-header"));
  return screen.findByRole("dialog");
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("What is this plan for?"), "shoot:shoot-1");
  await user.selectOptions(screen.getByLabelText("Workflow template"), "wf-1");
}

describe("NewPlanDialog", () => {
  it("is a real dialog with role=dialog aria-modal=true", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await openDialog(user);
    expect(dialog.id).toBe("pl-new-plan-dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("groups eligible entities by type in the picker", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    const select = screen.getByLabelText("What is this plan for?") as HTMLSelectElement;
    const groupLabels = [...select.querySelectorAll("optgroup")].map((g) => g.label);
    expect(groupLabels).toEqual(["Shoots", "Campaigns"]);
  });

  it("pre-fills the plan name from the selected entity's label", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    await user.selectOptions(screen.getByLabelText("What is this plan for?"), "campaign:camp-1");
    expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("Q3 Retail Push");
  });

  it("never overwrites a plan name the caller already typed when the entity selection changes", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    await user.type(screen.getByLabelText("Plan name"), "My Custom Name");
    await user.selectOptions(screen.getByLabelText("What is this plan for?"), "campaign:camp-1");

    expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("My Custom Name");
  });

  it("submits the selected entity, workflow, name, and org, then redirects to the new instance on success", async () => {
    vi.mocked(createInstanceAction).mockResolvedValue({
      ok: true,
      data: { replayed: false, instanceId: "inst-new-1" },
    });
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Create plan" }));

    await waitFor(() => expect(createInstanceAction).toHaveBeenCalledTimes(1), { timeout: 3000 });
    const [params, idempotencyKey] = vi.mocked(createInstanceAction).mock.calls[0];
    expect(params).toEqual({
      workflowId: "wf-1",
      orgId: "org-1",
      entityType: "shoot",
      entityId: "shoot-1",
      name: "Summer Lookbook",
      plannedStart: expect.any(String),
    });
    expect(typeof idempotencyKey).toBe("string");
    expect(idempotencyKey.length).toBeGreaterThan(0);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/app/planner/inst-new-1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("reuses the same idempotency key across a retry within one open dialog", async () => {
    vi.mocked(createInstanceAction).mockResolvedValueOnce({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
    });
    vi.mocked(createInstanceAction).mockResolvedValueOnce({
      ok: true,
      data: { replayed: false, instanceId: "inst-new-2" },
    });
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Create plan" }));
    // Waiting on the mock's call count alone is too early: it increments the
    // instant startTransition's callback starts running, before the awaited
    // promise settles and isSaving flips back to false (button text still
    // reads "Creating…", disabled) — wait for the rendered error instead,
    // which only appears once the first attempt has actually finished.
    await screen.findByRole("alert", {}, { timeout: 5000 });
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    await waitFor(() => expect(createInstanceAction).toHaveBeenCalledTimes(2), { timeout: 5000 });

    const firstKey = vi.mocked(createInstanceAction).mock.calls[0][1];
    const secondKey = vi.mocked(createInstanceAction).mock.calls[1][1];
    expect(secondKey).toBe(firstKey);
  });

  it("mints a fresh idempotency key the next time the dialog is reopened", async () => {
    vi.mocked(createInstanceAction).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
    });
    const user = userEvent.setup();
    renderDialog();

    await openDialog(user);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    // Same reasoning as the retry test above — wait for the error to render
    // (attempt actually finished), not just the mock call count.
    await screen.findByRole("alert", {}, { timeout: 5000 });
    const firstKey = vi.mocked(createInstanceAction).mock.calls[0][1];

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await openDialog(user);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    await waitFor(() => expect(createInstanceAction).toHaveBeenCalledTimes(2), { timeout: 3000 });
    const secondKey = vi.mocked(createInstanceAction).mock.calls[1][1];

    expect(secondKey).not.toBe(firstKey);
  });

  it("shows the RPC's FORBIDDEN message verbatim — never invents its own copy, dialog stays open", async () => {
    vi.mocked(createInstanceAction).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "You don't have permission to create a plan for this organization." },
    });
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create plan" }));

    const err = await screen.findByRole("alert");
    expect(err.id).toBe("pl-new-plan-err");
    expect(err.textContent).toContain("You don't have permission to create a plan for this organization.");
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("offers a link to the existing plan on INSTANCE_ALREADY_EXISTS", async () => {
    vi.mocked(createInstanceAction).mockResolvedValue({
      ok: false,
      error: {
        code: "INSTANCE_ALREADY_EXISTS",
        message: "A plan already exists for this item and workflow.",
        existingInstanceId: "inst-existing-9",
      },
    });
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create plan" }));

    const link = await screen.findByRole("link", { name: "Open the existing plan" });
    expect(link.getAttribute("href")).toBe("/app/planner/inst-existing-9");
  });

  it("does not render a link when the error has no existingInstanceId", async () => {
    vi.mocked(createInstanceAction).mockResolvedValue({
      ok: false,
      error: { code: "INVALID_INPUT", message: "That request wasn't valid." },
    });
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create plan" }));

    await screen.findByRole("alert");
    expect(screen.queryByRole("link", { name: /open the existing plan/i })).toBeNull();
  });

  it("never renders a client-side permission/role check — the CTA and dialog render unconditionally regardless of orgId", async () => {
    const user = userEvent.setup();
    renderDialog({ orgId: null });
    await openDialog(user);

    expect(screen.getByText(/you need to belong to an organization/i)).toBeDefined();
    const text = document.body.textContent ?? "";
    expect(/insufficient role|read-only|viewer access/i.test(text)).toBe(false);
  });

  it("shows an inline notice, not an empty dropdown, when there are no eligible entities", async () => {
    const user = userEvent.setup();
    renderDialog({ eligibleEntities: [] });
    await openDialog(user);

    expect(screen.getByText(/nothing eligible for a new plan yet/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Create plan" })).toBeNull();
  });

  it("shows an inline notice when there is no workflow template", async () => {
    const user = userEvent.setup();
    renderDialog({ workflowTemplates: [] });
    await openDialog(user);

    expect(screen.getByText(/no workflow template yet/i)).toBeDefined();
  });

  it("closes and resets on Cancel — a reopened dialog starts blank", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);
    await user.type(screen.getByLabelText("Plan name"), "Draft name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(screen.getByTestId("new-plan-trigger-header"));
    expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("");
  });

  it("keeps Create plan disabled until an entity is chosen and the (possibly auto-filled) name is non-empty", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    const submitButton = () => screen.getByRole("button", { name: "Create plan" }) as HTMLButtonElement;
    expect(submitButton().disabled).toBe(true);

    // Choosing an entity both selects it and auto-fills the still-empty name
    // (see the "pre-fills the plan name" test above) — that's what actually
    // unblocks submit here, not a separate typed name.
    await user.selectOptions(screen.getByLabelText("What is this plan for?"), "shoot:shoot-1");
    expect(submitButton().disabled).toBe(false);

    // Clearing the name by hand disables it again.
    await user.clear(screen.getByLabelText("Plan name"));
    expect(submitButton().disabled).toBe(true);
  });

  it("renders both a header and an empty variant trigger with distinct testids", () => {
    const { unmount } = renderDialog({ variant: "header" });
    expect(screen.getByTestId("new-plan-trigger-header")).toBeDefined();
    unmount();

    renderDialog({ variant: "empty" });
    expect(screen.getByTestId("new-plan-trigger-empty")).toBeDefined();
  });
});
