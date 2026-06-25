import type { BrandIntakeStatus } from "@/lib/brand-hub";
import { intakeStatusColor, intakeStatusLabel } from "@/lib/brand-hub";

type Props = {
  status: BrandIntakeStatus | string | null | undefined;
  errorMessage?: string;
};

export const IntakeBanner = ({ status, errorMessage }: Props) => {
  const s = (status ?? "brand_created") as BrandIntakeStatus;

  if (s === "ready" || s === "scores_complete") return null;

  if (s === "failed") {
    return (
      <div
        className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3"
        role="alert"
      >
        <p className="font-sans text-sm font-medium text-[#DC2626]">Analysis failed</p>
        {errorMessage && (
          <p className="mt-1 font-sans text-xs text-[#991B1B]">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (s === "crawl_running" || s === "analysis_running") {
    return (
      <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
        <p className="font-sans text-sm text-[#92400E]">
          {s === "crawl_running" ? "Crawl in progress…" : "Analyzing brand…"}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#FDE68A]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[#D97706]" />
        </div>
      </div>
    );
  }

  if (s === "brand_created" || s === "crawl_complete") {
    return (
      <div className="rounded-xl border border-[#E8E0D8] bg-white px-4 py-3">
        <p className="font-sans text-sm text-[#64748B]">
          {s === "brand_created"
            ? "Analysis not started yet. Use Re-analyze to run brand intelligence."
            : "Crawl complete — run analysis to populate scores and profile."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8E0D8] bg-white px-4 py-3">
      <p className="font-sans text-sm text-[#64748B]">
        Status:{" "}
        <span style={{ color: intakeStatusColor(s) }}>{intakeStatusLabel(s)}</span>
      </p>
    </div>
  );
};
