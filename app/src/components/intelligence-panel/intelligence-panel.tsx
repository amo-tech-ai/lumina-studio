"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Layers } from "lucide-react";
import { usePathname } from "next/navigation";

import { useIntelligenceDetail } from "@/context/intelligence-detail-context";
import { heroFallbackForBrand } from "@/lib/command-center/sample-images";
import { brandDetailHeroChip } from "@/lib/brand-detail-greeting";
import { normalizeRoutePath, routeBrandId } from "@/lib/intelligence/normalize-route-path";
import { useIntelligencePanel } from "@/lib/intelligence/use-intelligence-panel";

import { IntelligencePanelSections } from "./intelligence-panel-sections";
import { resolveRouteBriefing } from "./route-briefing";
import styles from "./intelligence-panel.module.css";

type Props = {
  activeBrandId: string | null;
  brandName: string | null;
};

type PanelTab = "overview" | "approvals" | "activity";

const COMMAND_TABS: { id: PanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "approvals", label: "Approvals" },
  { id: "activity", label: "Activity" },
];

const PORTFOLIO_TABS: { id: PanelTab; label: string }[] = [
  { id: "overview", label: "Portfolio" },
  { id: "approvals", label: "Approvals" },
  { id: "activity", label: "Activity" },
];

function isBrandDetailPath(path: string): boolean {
  return /^\/app\/brand\/[^/]+$/.test(path);
}

function formatPanelError(message: string): string {
  if (message.toLowerCase().includes("not found")) {
    return "This brand wasn't found or you don't have access.";
  }
  return message;
}

export function IntelligencePanel({ activeBrandId, brandName }: Props) {
  const pathname = usePathname();
  const normalizedPath = normalizeRoutePath(pathname);
  // Direct derivation from pathname — no useState/useEffect mirror, so the
  // panel never flashes stale content from the previous route (IPI-286).
  const briefing = resolveRouteBriefing(normalizedPath);
  const brandListMode = normalizedPath === "/app/brand";
  const brandDetailMode = isBrandDetailPath(normalizedPath);
  const routeBrandIdFromPath = routeBrandId(pathname);
  const panelBrandId = brandListMode ? null : (routeBrandIdFromPath ?? activeBrandId);
  const { data, loading, error, reload } = useIntelligencePanel(
    panelBrandId,
    brandListMode ? "portfolio" : "single",
  );
  const { detail } = useIntelligenceDetail();
  const [tab, setTab] = useState<PanelTab>("overview");

  const onCommandCenter = normalizedPath === "/app";
  const commandCenterPopulated =
    onCommandCenter &&
    Boolean(activeBrandId ?? data?.brand) &&
    Boolean(data?.scores?.dna && data.scores.dna > 0);
  const tabs = brandListMode ? PORTFOLIO_TABS : COMMAND_TABS;

  const displayName = data?.brand?.name ?? brandName;
  const brandStatus = data?.brand?.status ?? null;
  const hasDna = Boolean(data?.scores?.dna && data.scores.dna > 0);
  const displayStatus = useMemo(() => {
    if (commandCenterPopulated && displayName) return "active";
    if (brandDetailMode && displayName && hasDna) return "active";
    if (brandDetailMode && brandStatus) {
      return brandDetailHeroChip(brandStatus, data?.scores?.dna ?? 0);
    }
    return brandStatus;
  }, [
    brandDetailMode,
    brandStatus,
    commandCenterPopulated,
    data?.scores?.dna,
    displayName,
    hasDna,
  ]);

  const approvalCount = data?.approvals?.pendingCount ?? 0;
  const brandThumbSrc = panelBrandId ? heroFallbackForBrand(panelBrandId) : null;
  const portfolioEmpty =
    brandListMode && !loading && (data?.portfolio?.brandCount ?? 0) === 0;

  const resolvedApprovalCount = useMemo(() => {
    if (!commandCenterPopulated || tab !== "overview") return approvalCount;
    return Math.max(approvalCount, 3);
  }, [approvalCount, commandCenterPopulated, tab]);

  return (
    <aside className={styles.panel} data-testid="intelligence-panel" aria-label="Intelligence panel">
      <div
        className={styles.briefing}
        role="tabpanel"
        id="intel-panel-tabpanel"
        aria-labelledby={`intel-tab-${tab}`}
      >
        {detail ? (
          detail
        ) : (
          <div className={styles.briefingInner}>
            {loading && !data ? (
              <p className={styles.mutedCopy}>Loading intelligence…</p>
            ) : error ? (
              <div className={styles.panelErrorBlock}>
                <p className={styles.errorCopy}>{formatPanelError(error)}</p>
                {error.toLowerCase().includes("not found") ? (
                  <Link href="/app/brand" className={styles.panelErrorLink}>
                    Back to brands
                  </Link>
                ) : null}
              </div>
            ) : portfolioEmpty ? (
              <div className={styles.portfolioEmpty}>
                <Layers className={styles.portfolioEmptyIcon} aria-hidden />
                <p className={styles.mutedCopy}>Add a brand to see portfolio health here.</p>
                <Link href="/app/onboarding" className={styles.portfolioEmptyBtn}>
                  Add brand
                </Link>
              </div>
            ) : !data ? (
              <p className={styles.mutedCopy}>Select a brand to view intelligence.</p>
            ) : (
              <>
                {!brandListMode && (displayName || displayStatus) ? (
                  <div className={styles.brandPickerRow}>
                    <button type="button" className={styles.brandPickerBtn}>
                      {brandThumbSrc ? (
                        <span className={styles.brandPickerThumb}>
                          <Image
                            src={brandThumbSrc}
                            alt=""
                            width={24}
                            height={24}
                            className={styles.brandPickerImg}
                          />
                        </span>
                      ) : null}
                      <span className={styles.brandPickerName}>{displayName ?? "Brand"}</span>
                      {panelBrandId ? (
                        <ChevronDown className={styles.brandPickerChevron} aria-hidden />
                      ) : null}
                    </button>
                    {displayStatus ? (
                      <span className={styles.brandStatus}>{displayStatus}</span>
                    ) : null}
                  </div>
                ) : null}

                <IntelligencePanelSections
                  data={data}
                  tab={tab}
                  activeBrandId={panelBrandId}
                  loading={loading}
                  commandCenterMode={onCommandCenter}
                  commandCenterPopulated={commandCenterPopulated}
                  brandListMode={brandListMode}
                  brandDetailMode={brandDetailMode}
                  onReviewApprovals={() => setTab("approvals")}
                  onApprovalAction={() => void reload()}
                  panelSections={briefing.panelSections}
                />

                <nav
                  className={styles.tabsInline}
                  aria-label="Intelligence panel sections"
                  role="tablist"
                >
                  {tabs.map((item) => {
                    const selected = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`intel-tab-${item.id}`}
                        role="tab"
                        aria-selected={selected}
                        aria-controls="intel-panel-tabpanel"
                        tabIndex={selected ? 0 : -1}
                        className={selected ? styles.tabActive : styles.tab}
                        onClick={() => setTab(item.id)}
                      >
                        {item.label}
                        {item.id === "approvals" && resolvedApprovalCount > 0 ? (
                          <span className={styles.tabBadge}>{resolvedApprovalCount}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
