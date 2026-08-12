"use client";

// IPI-308 · MODEL-P2 — Minimal shortlist drawer (list, not a casting board).
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TalentResult } from "@/lib/talent/types";

export function ShortlistDrawer({
  open,
  onOpenChange,
  talents,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talents: TalentResult[];
  onRemove: (talentProfileId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Shortlist ({talents.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2">
          {talents.length === 0 ? (
            <p className="font-sans text-sm" style={{ color: "var(--color-text-secondary)" }}>
              No talent shortlisted yet — swipe right or tap Shortlist on a card.
            </p>
          ) : (
            talents.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span
                  className="truncate font-sans text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {t.display_name}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => onRemove(t.id)}>
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
