"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { StatusChip } from "@/components/ui/status-chip";
import { EntityList } from "@/components/ui/entity-list";
import type { DealRow } from "@/lib/crm/queries";
import { crmDealStageDotToken, crmDealStageLabel } from "@/lib/crm/status-tokens";
import { formatMoney } from "@/lib/format";
import styles from "./crm-detail-shell.module.css";

/** Shared chrome for CRM detail pages (Company IPI-391, Contact IPI-392) —
 *  breadcrumb, header wrapper, tab strip, and tabpanel mechanics are
 *  byte-identical between the two; only header content and tab bodies
 *  differ per entity. Extracted after both real consumers existed (RF-04b),
 *  per docs/crm/PROFILE-360-template.md's own build order.
 *
 *  This is deliberately NOT the full Profile360 EntityConfig/TabConfig engine
 *  from that doc (typeField/typeValue/keyFacts/gated tab archetypes for 8
 *  entity kinds). That template targets model/photographer/location/agency
 *  profiles that have no backing schema yet — building it now for 2 real
 *  consumers would be speculative. This extracts only what's genuinely
 *  duplicated today; the fuller engine is a config-registry problem for
 *  whenever those other entity kinds get real tables. */
export function CrmDetailShell<TabId extends string>({
  backHref,
  backLabel,
  current,
  header,
  tabs,
  tabLabels,
  tabCounts,
  activeTab,
  onTabChange,
  tabPanelId,
  children,
}: {
  backHref: string;
  backLabel: string;
  current: string;
  header: ReactNode;
  tabs: readonly TabId[];
  tabLabels: Record<TabId, string>;
  tabCounts?: Partial<Record<TabId, number>>;
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  tabPanelId: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href={backHref} className={styles.breadcrumbLink}>
            {backLabel}
          </Link>
          <ChevronRight size={13} aria-hidden />
          <span className={styles.breadcrumbCurrent}>{current}</span>
        </div>

        {header}

        <div className={styles.tabRow} role="tablist">
          {tabs.map((id) => (
            <button
              key={id}
              id={`${tabPanelId}-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={tabPanelId}
              onClick={() => onTabChange(id)}
              className={activeTab === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              {tabLabels[id]}
              {tabCounts?.[id] !== undefined ? <span className={styles.tabCount}>{tabCounts[id]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div id={tabPanelId} role="tabpanel" aria-labelledby={`${tabPanelId}-tab-${activeTab}`} className={styles.bodyMax}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Generic {label,value} 2-column fact grid — the "Overview" tab body shared
 *  by both detail pages (company's Status/Industry/Owner, contact's Role/Org). */
export function OverviewFields({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className={styles.overviewGrid}>
      {fields.map((f) => (
        <div key={f.label} className={styles.overviewField}>
          <div className={styles.overviewLabel}>{f.label}</div>
          <div className={styles.overviewValue}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Generic deals-list renderer — identical between Company Detail (deals
 *  scoped by company_id) and Contact Detail (deals scoped by the contact's
 *  linked company_id, since crm_deals has no contact_id column — see
 *  get-contact-detail.ts). No entity-specific logic lives here. */
export function DealsTab({ deals }: { deals: DealRow[] }) {
  return (
    <EntityList
      items={deals}
      emptyLabel="No deals yet"
      emptyBody="Deals linked to this record will appear here."
      renderRow={(deal) => (
        <Link href={`/app/crm/pipeline/${deal.id}`} className={styles.dealRow}>
          <div className={styles.dealText}>
            <StatusChip dot={crmDealStageDotToken(deal.stage)} label={crmDealStageLabel(deal.stage)} />
            {deal.expected_close_date ? (
              <div className={styles.dealClose}>Closes {formatShortDate(deal.expected_close_date)}</div>
            ) : null}
          </div>
          <span className={styles.dealValue}>{formatMoney(deal.value, deal.currency)}</span>
        </Link>
      )}
    />
  );
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
