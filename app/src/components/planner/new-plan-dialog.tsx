"use client";

// IPI-650 · PLN-HUB-002 — "New plan" CTA. Single dialog, not a multi-step
// wizard (per the ticket: reuse the Hub's own single-CTA pattern rather than
// build a separate wizard screen — SCR-35-Planner-Hub.dc.html shows the same
// "New plan" button + copy in both its header and empty state, both wired to
// one flow). Renders twice (header + empty state, see hub-workspace.tsx /
// hub-states.tsx) with independent open state — matching the DC mockup where
// both buttons are visible simultaneously in the empty screenState.
//
// No client-side role/permission check anywhere in this file — the ticket's
// correction #1 is explicit that would duplicate authorization
// planner_create_instance's RPC already owns. A viewer-role caller sees this
// same CTA and dialog; submitting surfaces the RPC's own FORBIDDEN error
// (INSTANCE_MUTATION_MESSAGES in mutations.ts), never a client-side "you
// can't do this" guess.

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createInstanceAction } from "@/app/(operator)/app/planner/actions";
import type { EligibleEntity, WorkflowTemplate } from "@/lib/planner/queries";
import type { EntityType } from "@/lib/planner/types";

import styles from "./hub-workspace.module.css";
import dialogStyles from "./new-plan-dialog.module.css";

const ENTITY_GROUP_LABEL: Record<EntityType, string> = {
  shoot: "Shoots",
  campaign: "Campaigns",
  crm_deal: "CRM deals",
};

const ENTITY_TYPE_ORDER: EntityType[] = ["shoot", "campaign", "crm_deal"];

function entityKey(entity: Pick<EligibleEntity, "entityType" | "entityId">): string {
  return `${entity.entityType}:${entity.entityId}`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  orgId: string | null;
  eligibleEntities: EligibleEntity[];
  workflowTemplates: WorkflowTemplate[];
  variant: "header" | "empty";
};

export function NewPlanDialog({ orgId, eligibleEntities, workflowTemplates, variant }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entitySelection, setEntitySelection] = useState("");
  const [workflowId, setWorkflowId] = useState(
    workflowTemplates.find((w) => w.isDefault)?.id ?? workflowTemplates[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [plannedStart, setPlannedStart] = useState(todayIsoDate);
  const [error, setError] = useState<{ message: string; existingInstanceId?: string } | null>(null);
  const [isSaving, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Generated once per open dialog (not per submit) so a retry of the same
  // logical attempt — network failure, double-click on Submit — reuses the
  // same key, matching createInstanceAction's documented replay contract
  // (app/src/app/(operator)/app/planner/actions.ts). A fresh key is only
  // minted the next time the dialog opens.
  const idempotencyKeyRef = useRef<string | null>(null);

  function reset() {
    setEntitySelection("");
    setWorkflowId(workflowTemplates.find((w) => w.isDefault)?.id ?? workflowTemplates[0]?.id ?? "");
    setName("");
    setPlannedStart(todayIsoDate());
    setError(null);
    idempotencyKeyRef.current = null;
  }

  function handleOpen() {
    idempotencyKeyRef.current ??= crypto.randomUUID();
    setOpen(true);
  }

  function handleEntityChange(nextKey: string) {
    setEntitySelection(nextKey);
    const entity = eligibleEntities.find((e) => entityKey(e) === nextKey);
    // Only ever fills a still-empty field — never overwrites a name the
    // caller already typed (CLAUDE.md "smart defaults, never ask for the
    // same info twice", not "override what I already told you").
    if (entity && name.trim() === "") {
      setName(entity.label);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    const entity = eligibleEntities.find((item) => entityKey(item) === entitySelection);
    if (!entity || !workflowId || !name.trim() || !plannedStart) return;

    setError(null);
    idempotencyKeyRef.current ??= crypto.randomUUID();
    const idempotencyKey = idempotencyKeyRef.current;

    startTransition(async () => {
      const result = await createInstanceAction(
        {
          workflowId,
          orgId,
          entityType: entity.entityType,
          entityId: entity.entityId,
          name: name.trim(),
          plannedStart,
        },
        idempotencyKey,
      );

      if (!result.ok) {
        setError({ message: result.error.message, existingInstanceId: result.error.existingInstanceId });
        return;
      }

      setOpen(false);
      reset();
      router.push(`/app/planner/${result.data.instanceId}`);
    });
  }

  const groupedEntities = ENTITY_TYPE_ORDER.map((type) => ({
    type,
    items: eligibleEntities.filter((entity) => entity.entityType === type),
  })).filter((group) => group.items.length > 0);

  const hasEligibleEntities = eligibleEntities.length > 0;
  const hasWorkflowTemplates = workflowTemplates.length > 0;
  const canSubmit = Boolean(orgId && entitySelection && workflowId && name.trim() && plannedStart);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={handleOpen}
        className={styles.newPlanBtn}
        data-testid={`new-plan-trigger-${variant}`}
      >
        <Plus size={variant === "header" ? 15 : 14} aria-hidden />
        New plan
      </button>
      <DialogContent
        id="pl-new-plan-dialog"
        className="sm:max-w-md"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
        </DialogHeader>

        {!orgId ? (
          <p className={dialogStyles.notice}>
            You need to belong to an organization before you can create a plan.
          </p>
        ) : !hasEligibleEntities || !hasWorkflowTemplates ? (
          <p className={dialogStyles.notice}>
            {!hasEligibleEntities
              ? "There's nothing eligible for a new plan yet — every shoot, campaign, and CRM deal you can access already has one, or none exist yet."
              : "This organization has no workflow template yet — a plan needs one to start from."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={dialogStyles.form}>
            <label className={dialogStyles.field}>
              <span className={dialogStyles.label}>What is this plan for?</span>
              <select
                className={dialogStyles.select}
                value={entitySelection}
                onChange={(e) => handleEntityChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a shoot, campaign, or deal
                </option>
                {groupedEntities.map((group) => (
                  <optgroup key={group.type} label={ENTITY_GROUP_LABEL[group.type]}>
                    {group.items.map((item) => (
                      <option key={entityKey(item)} value={entityKey(item)}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className={dialogStyles.field}>
              <span className={dialogStyles.label}>Workflow template</span>
              <select
                className={dialogStyles.select}
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                required
              >
                {workflowTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className={dialogStyles.field}>
              <span className={dialogStyles.label}>Plan name</span>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Lookbook"
                autoFocus
              />
            </label>

            <label className={dialogStyles.field}>
              <span className={dialogStyles.label}>Planned start</span>
              <Input
                type="date"
                required
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
              />
            </label>

            {error ? (
              <p id="pl-new-plan-err" role="alert" className={dialogStyles.error}>
                {error.message}
                {error.existingInstanceId ? (
                  <>
                    {" "}
                    <Link href={`/app/planner/${error.existingInstanceId}`} className={dialogStyles.errorLink}>
                      Open the existing plan
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !canSubmit}>
                {isSaving ? "Creating…" : "Create plan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
