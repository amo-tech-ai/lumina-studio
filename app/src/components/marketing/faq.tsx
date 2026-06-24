"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

// Minimal accessible accordion for service-page FAQ sections (replaces the Vite
// shadcn Accordion). One open at a time; native button semantics.
export function FAQ({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mx-auto max-w-2xl divide-y" style={{ borderColor: "var(--mk-border)" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="py-1">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-lg font-medium">{item.q}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 transition-transform"
                style={{ transform: isOpen ? "rotate(180deg)" : "none", color: "var(--mk-primary)" }}
              />
            </button>
            {isOpen && (
              <p className="pb-4 leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
