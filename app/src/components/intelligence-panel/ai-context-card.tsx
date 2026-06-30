import type { RouteBriefing } from "./route-briefing";

type Props = {
  brandName: string | null;
  briefing: RouteBriefing;
};

export function AIContextCard({ brandName, briefing }: Props) {
  return (
    <section
      aria-label="AI context briefing"
      className="border-b border-[#F0F0F1] bg-white px-4 py-3"
    >
      <p className="font-sans text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        {briefing.section}
      </p>
      <h2 className="mt-1 font-sans text-sm font-semibold text-[#111]">
        {brandName ? brandName : "No brand selected"}
      </h2>
      <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#6B7280]">
        {briefing.headline}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested next actions">
        {briefing.nextActions.slice(0, 3).map((action) => (
          <li
            key={action}
            className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-1 font-sans text-[11px] text-[#374151]"
          >
            {action}
          </li>
        ))}
      </ul>
    </section>
  );
}
