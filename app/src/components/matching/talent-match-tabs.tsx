"use client";

// IPI-308 · MODEL-P2 — Matching tab bar. Talent is the only live tab;
// Creator/Asset/Product are disabled shells (IPI2-123's own scope).
import { cn } from "@/lib/utils";

const DISABLED_TABS = ["Creator Matches", "Asset Matches", "Product Matches"] as const;
const COMING_SOON = "Coming soon — IPI2-123";

export function TalentMatchTabs() {
  return (
    <div
      className="flex items-center gap-6 overflow-x-auto border-b border-[#E5E7EB]"
      role="tablist"
      aria-label="Matching categories"
    >
      {DISABLED_TABS.map((label) => (
        <span
          key={label}
          role="tab"
          aria-disabled="true"
          aria-selected="false"
          aria-label={`${label} — ${COMING_SOON}`}
          title={COMING_SOON}
          tabIndex={0}
          className="shrink-0 whitespace-nowrap py-3 font-sans text-sm text-[#9CA3AF]"
        >
          {label}
        </span>
      ))}
      <span
        role="tab"
        aria-selected="true"
        className={cn(
          "shrink-0 whitespace-nowrap border-b-2 border-[#111] py-3 font-sans text-sm font-semibold text-[#111]",
        )}
      >
        Talent Matches
      </span>
    </div>
  );
}
