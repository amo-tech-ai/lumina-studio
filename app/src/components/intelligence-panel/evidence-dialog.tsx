"use client";

import { useState } from "react";
import { toast } from "sonner";

import { EvidenceBlock } from "@/components/evidence-block";
import type { EvidenceBlockProps } from "@/components/evidence-block/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  triggerLabel: string;
  evidence: Omit<EvidenceBlockProps, "className" | "loading">;
  triggerClassName?: string;
};

export function EvidenceDialog({ triggerLabel, evidence, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] max-w-md overflow-y-auto p-0 sm:max-w-lg"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{evidence.title}</DialogTitle>
          </DialogHeader>
          <EvidenceBlock
            {...evidence}
            onApprove={() => {
              toast.success("Approved (fixture preview)");
              setOpen(false);
            }}
            onImprove={() => toast.message("Edit queued (fixture preview)")}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
