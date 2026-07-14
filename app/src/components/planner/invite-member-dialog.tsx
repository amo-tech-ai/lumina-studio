"use client";

// IPI-577 · PLN-S6 — invite dialog on @/components/ui/dialog (Radix Dialog
// already provides role="dialog" aria-modal="true", focus-trap, and
// focus-return on close — no new primitive needed). "Invite" adds an
// existing registered account immediately; there is no multi-step
// invitation lifecycle to render any state for.

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteMemberAction } from "@/app/(operator)/app/planner/[instanceId]/settings/actions";
import type { PlannerRole } from "@/lib/planner/types";

import styles from "./invite-member-dialog.module.css";

// Never 'owner' — matches planner_invite_member's invalid_role rejection.
// Offering it in this dropdown would only produce an RPC error the user
// can't fix by retrying.
const INVITE_ROLES: PlannerRole[] = ["manager", "contributor", "viewer"];

export function InviteMemberDialog({ instanceId }: { instanceId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlannerRole>("contributor");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  function reset() {
    setEmail("");
    setRole("contributor");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteMemberAction(instanceId, email.trim(), role);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button type="button" onClick={() => setOpen(true)}>
        Add member
      </Button>
      <DialogContent id="pl-invite-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoFocus
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Access</span>
            <Select value={role} onValueChange={(next) => setRole(next as PlannerRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {error ? (
            <p id="pl-invite-err" role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !email.trim()}>
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
