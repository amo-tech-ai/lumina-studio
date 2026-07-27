"use client";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { SALES_CHANNELS } from "@/components/onboarding/sales-channels.data";
import { cn } from "@/lib/utils";

/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * screen 5. Multi-select; Continue is blocked while nothing is picked.
 *
 * Real checkboxes rather than aria-pressed buttons: the semantics are "choose
 * any number of these", and a checkbox group announces that correctly without
 * extra ARIA.
 */
export function SalesChannelsQuestion({
  selected,
  onToggle,
}: {
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        Where is your brand listed?
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        Pick every place you already sell or post.
      </p>

      <fieldset className="mt-6 grid grid-cols-2 gap-2.5 border-0 p-0">
        <legend className="sr-only">Where is your brand listed?</legend>
        {SALES_CHANNELS.map((channel) => {
          const isSelected = Boolean(selected[channel.id]);
          return (
            <label
              key={channel.id}
              data-testid={`channel-${channel.id}`}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-lg)] border p-2.5",
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--onboarding-accent)]",
                isSelected
                  ? "border-[var(--onboarding-accent-line)] bg-[var(--onboarding-accent-tint)]"
                  : "border-[var(--onboarding-hair)]",
              )}
            >
              <input
                type="checkbox"
                name="listed"
                value={channel.id}
                checked={isSelected}
                onChange={() => onToggle(channel.id)}
                // Explicit name: the visible label also contains the brand
                // glyph, so the accessible name would otherwise read "SShopify".
                aria-label={channel.label}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                style={{ background: channel.background }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-extrabold text-[var(--onboarding-card)]"
              >
                {channel.glyph}
              </span>
              <span className="text-sm font-semibold">{channel.label}</span>
            </label>
          );
        })}
      </fieldset>
    </OnboardingCard>
  );
}
