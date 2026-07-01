import Link from "next/link";

import type { IntelligenceSuggestion } from "@/lib/intelligence/panel-contract";

type Props = { suggestions: IntelligenceSuggestion[] };

const ICONS = {
  action: "💡",
  insight: "✨",
  warning: "⚠️",
};

export function SuggestionRail({ suggestions }: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 font-sans text-xs font-semibold text-[#E5E7EB]">
        Suggestions ({suggestions.length})
      </h3>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="rounded bg-[#1F2937] px-3 py-2 text-xs"
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">{ICONS[s.type]}</span>
              <div className="flex-1">
                <div className="font-semibold text-[#E5E7EB]">{s.title}</div>
                <div className="mt-1 text-[#9CA3AF]">{s.description}</div>
                {s.action && (
                  <Link
                    href={s.action.href}
                    className="mt-2 inline-block text-[#60A5FA] hover:underline"
                  >
                    {s.action.label}
                  </Link>
                )}
              </div>
              <div className="text-xs text-[#6B7280]">
                {Math.round(s.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
