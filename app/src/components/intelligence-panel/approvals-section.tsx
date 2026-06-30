import Link from "next/link";
import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";

type Props = {
  approvals: IntelligencePanelData["approvals"];
};

export function ApprovalsSection({ approvals }: Props) {
  if (approvals.pendingCount === 0) {
    return (
      <section aria-label="Pending approvals" className="border-t border-[#F0F0F1] px-4 py-3">
        <p className="font-sans text-[11px] font-medium text-[#6B7280]">Approvals</p>
        <p className="mt-1 font-sans text-xs text-[#9CA3AF]">No pending brand drafts.</p>
      </section>
    );
  }

  return (
    <section aria-label="Pending approvals" className="border-t border-[#F0F0F1] px-4 py-3">
      <p className="font-sans text-[11px] font-medium text-[#6B7280]">
        Approvals · {approvals.pendingCount} pending
      </p>
      <ul className="mt-2 space-y-1.5">
        {approvals.items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="block rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 font-sans text-xs text-[#374151] hover:bg-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
