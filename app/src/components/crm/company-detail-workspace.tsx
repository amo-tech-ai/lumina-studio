"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import { EntityList } from "@/components/ui/entity-list";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { CompanyDetailPayload } from "@/lib/crm/get-company-detail";
import type { ContactRow, DealRow } from "@/lib/crm/queries";
import {
  crmDealStageDotToken,
  crmDealStageLabel,
  crmStatusDotToken,
  crmStatusLabel,
} from "@/lib/crm/status-tokens";
import { formatMoney } from "@/lib/format";
import { ActivityTimeline } from "./activity-timeline";
import { CrmAvatar } from "./crm-avatar";
import styles from "./company-detail-workspace.module.css";

const TAB_IDS = ["overview", "contacts", "deals", "activity"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  contacts: "Contacts",
  deals: "Deals",
  activity: "Activity",
};

type Props = {
  data: CompanyDetailPayload | null;
  fetchError: string | null;
};

/** Company Detail — ported from SCR-27-CRM-Company-Detail.dc.html (IPI-391).
 *  Built as a normal page, not Profile360 — extraction is IPI-392 (RF-04b),
 *  deliberately sequenced after both Company and Contact detail exist.
 *
 *  Dropped vs DC: the "kind" chip (brand/agency/vendor/sponsor) and logo image
 *  aren't backed by any crm_companies column (same call as CompaniesWorkspace,
 *  RF-03) — never fabricated. The relationship-summary AI card is also
 *  dropped here: no crm-assistant summary RPC exists yet, and the
 *  IntelligencePanel (wired via CrmRecordContext) already owns that surface —
 *  an honest empty is correct, not a placeholder card with no data behind it. */
export function CompanyDetailWorkspace({ data, fetchError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  if (fetchError || !data) {
    return (
      <div className={styles.stateRoot}>
        <ErrorState message={fetchError ?? "Something went wrong."} onRetry={() => router.refresh()} />
      </div>
    );
  }

  const { company, ownerName, contacts, deals, activities } = data;
  const tabCount: Partial<Record<TabId, number>> = {
    contacts: contacts.length,
    deals: deals.length,
    activity: activities.length,
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/app/crm/companies" className={styles.breadcrumbLink}>
            Companies
          </Link>
          <ChevronRight size={13} aria-hidden />
          <span className={styles.breadcrumbCurrent}>{company.name}</span>
        </div>

        <div className={styles.headerRow}>
          <CrmAvatar name={company.name} shape="square" />
          <div className={styles.headerText}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{company.name}</h1>
              <StatusChip dot={crmStatusDotToken(company.status)} label={crmStatusLabel(company.status)} />
            </div>
            <div className={styles.meta}>
              {company.domain ? <span>{company.domain}</span> : null}
              {company.industry ? <span>{company.industry}</span> : null}
              <span>Owner {ownerName ?? "—"}</span>
            </div>
          </div>
          {company.brand_id ? (
            <Link href={`/app/brand/${company.brand_id}`} className={styles.brandLink}>
              Open brand
              <ExternalLink size={13} aria-hidden />
            </Link>
          ) : (
            <span className={styles.notBrand}>Not yet a brand</span>
          )}
        </div>

        <div className={styles.tabRow} role="tablist">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              id={`company-detail-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls="company-detail-tabpanel"
              onClick={() => setTab(id)}
              className={tab === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              {TAB_LABELS[id]}
              {tabCount[id] !== undefined ? <span className={styles.tabCount}>{tabCount[id]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div
          id="company-detail-tabpanel"
          role="tabpanel"
          aria-labelledby={`company-detail-tab-${tab}`}
          className={styles.bodyMax}
        >
          {tab === "overview" ? <OverviewTab company={company} ownerName={ownerName} /> : null}
          {tab === "contacts" ? <ContactsTab contacts={contacts} /> : null}
          {tab === "deals" ? <DealsTab deals={deals} /> : null}
          {tab === "activity" ? <ActivityTimeline activities={activities} /> : null}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  company,
  ownerName,
}: {
  company: CompanyDetailPayload["company"];
  ownerName: string | null;
}) {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "Status", value: crmStatusLabel(company.status) },
    { label: "Industry", value: company.industry ?? "—" },
    { label: "Owner", value: ownerName ?? "—" },
    {
      label: "Linked brand",
      value: company.brand_id ? (
        <Link href={`/app/brand/${company.brand_id}`} className={styles.overviewLink}>
          Open brand
        </Link>
      ) : (
        "Not yet a brand"
      ),
    },
  ];
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

function ContactsTab({ contacts }: { contacts: ContactRow[] }) {
  return (
    <EntityList
      items={contacts}
      emptyLabel="No contacts yet"
      emptyBody="Contacts linked to this company will appear here."
      renderRow={(contact) => (
        <Link href={`/app/crm/contacts/${contact.id}`} className={styles.contactRow}>
          <CrmAvatar name={contact.name} shape="circle" />
          <div className={styles.contactText}>
            <div className={styles.contactName}>{contact.name}</div>
            <div className={styles.contactRole}>{contact.role_title ?? "—"}</div>
          </div>
          <ChevronRight size={15} aria-hidden className={styles.chevron} />
        </Link>
      )}
    />
  );
}

function DealsTab({ deals }: { deals: DealRow[] }) {
  return (
    <EntityList
      items={deals}
      emptyLabel="No deals yet"
      emptyBody="Deals linked to this company will appear here."
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
