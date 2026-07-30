"use client";

// IPI-562 · CRM-UX-005 Phase 2 — one dialog shell for company | contact | deal creates.

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";

import {
  createCompanyAction,
  createContactAction,
  createDealAction,
} from "@/app/(operator)/app/crm/actions";
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

import listStyles from "./crm-list-workspace.module.css";
import styles from "./crm-create-dialog.module.css";

type Kind = "company" | "contact" | "deal";

const TITLES: Record<Kind, string> = {
  company: "New organization",
  contact: "New person",
  deal: "New deal",
};

const COMPANY_STATUSES = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "lost", label: "Lost" },
] as const;

const DEAL_STAGES = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
] as const;

export function CrmCreateDialog({
  kind,
  triggerLabel,
  companyId,
  companies,
  triggerClassName,
}: {
  kind: Kind;
  triggerLabel: string;
  /** Locked company for deal creates (company detail Deals tab). */
  companyId?: string;
  /** Optional company picker for contacts. */
  companies?: { id: string; name: string }[];
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<string>("prospect");
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [contactCompanyId, setContactCompanyId] = useState<string>(companyId ?? "");
  const [stage, setStage] = useState<string>("lead");
  const [value, setValue] = useState("");

  function reset() {
    setError(null);
    setName("");
    setDomain("");
    setIndustry("");
    setStatus("prospect");
    setEmail("");
    setRoleTitle("");
    setContactCompanyId(companyId ?? "");
    setStage("lead");
    setValue("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let result;
      if (kind === "company") {
        result = await createCompanyAction({
          name,
          domain: domain || null,
          industry: industry || null,
          status: status as "prospect" | "active" | "inactive" | "lost",
        });
      } else if (kind === "contact") {
        result = await createContactAction({
          name,
          email: email || null,
          role_title: roleTitle || null,
          company_id: contactCompanyId || null,
        });
      } else {
        const dealCompanyId = companyId ?? contactCompanyId;
        const parsedValue = value.trim() === "" ? null : Number(value);
        if (parsedValue !== null && Number.isNaN(parsedValue)) {
          setError("Enter a valid deal value.");
          return;
        }
        result = await createDealAction({
          company_id: dealCompanyId,
          stage: stage as "lead" | "qualified" | "proposal" | "negotiation",
          value: parsedValue,
          currency: "GBP",
        });
      }

      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  const canSubmit =
    !isSaving &&
    (kind === "company"
      ? name.trim().length > 0
      : kind === "contact"
        ? name.trim().length > 0
        : Boolean(companyId ?? contactCompanyId));

  const trigger: ReactNode = (
    <button
      type="button"
      ref={triggerRef}
      className={triggerClassName ?? listStyles.newBtn}
      onClick={() => setOpen(true)}
      disabled={isSaving}
    >
      <Plus size={15} aria-hidden />
      {triggerLabel}
    </button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <span className={styles.triggerWrap}>{trigger}</span>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{TITLES[kind]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={styles.form}>
          {kind === "company" ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Domain</span>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.com"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Industry</span>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </>
          ) : null}

          {kind === "contact" ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Role</span>
                <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
              </label>
              {companies && companies.length > 0 ? (
                <label className={styles.field}>
                  <span className={styles.label}>Organization</span>
                  <Select
                    value={contactCompanyId || "__none__"}
                    onValueChange={(v) => setContactCompanyId(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
            </>
          ) : null}

          {kind === "deal" ? (
            <>
              {!companyId ? (
                <label className={styles.field}>
                  <span className={styles.label}>Organization</span>
                  <Select value={contactCompanyId} onValueChange={setContactCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
              <label className={styles.field}>
                <span className={styles.label}>Stage</span>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Value (GBP)</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Optional"
                  autoFocus={Boolean(companyId)}
                />
              </label>
            </>
          ) : null}

          {error ? (
            <p role="alert" className={styles.error}>
              {error}
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
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
