"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import { EntityList } from "@/components/ui/entity-list";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { CompanyDetailPayload } from "@/lib/crm/get-company-detail";
import type { ContactRow } from "@/lib/crm/queries";
import { crmStatusDotToken, crmStatusLabel } from "@/lib/crm/status-tokens";
import { ActivityTimeline } from "./activity-timeline";
import { CrmAvatar } from "./crm-avatar";
import { CrmCreateDialog } from "./crm-create-dialog";
import { CrmDetailShell, DealsTab, OverviewFields } from "./crm-detail-shell";
import styles from "./company-detail-workspace.module.css";
import shellStyles from "./crm-detail-shell.module.css";

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
 *  Shell/tab-strip/OverviewFields/DealsTab now come from crm-detail-shell.tsx,
 *  extracted in RF-04b (IPI-392) once ContactDetailWorkspace existed as the
 *  second real consumer — this file keeps only what's Company-specific
 *  (StatusChip header, brand link, ContactsTab).
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
      <div className={shellStyles.stateRoot}>
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
    <CrmDetailShell
      backHref="/app/crm/companies"
      backLabel="Companies"
      current={company.name}
      tabs={TAB_IDS}
      tabLabels={TAB_LABELS}
      tabCounts={tabCount}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelId="company-detail-tabpanel"
      header={
        <div className={shellStyles.headerRow}>
          <CrmAvatar name={company.name} shape="square" />
          <div className={shellStyles.headerText}>
            <div className={shellStyles.nameRow}>
              <h1 className={shellStyles.name}>{company.name}</h1>
              <StatusChip dot={crmStatusDotToken(company.status)} label={crmStatusLabel(company.status)} />
            </div>
            <div className={shellStyles.meta}>
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
      }
    >
      {tab === "overview" ? <OverviewTab company={company} ownerName={ownerName} /> : null}
      {tab === "contacts" ? <ContactsTab contacts={contacts} /> : null}
      {tab === "deals" ? (
        <div className={styles.dealsTab}>
          <div className={styles.dealsTabHeader}>
            <CrmCreateDialog kind="deal" triggerLabel="New deal" companyId={company.id} />
          </div>
          <DealsTab deals={deals} />
        </div>
      ) : null}
      {tab === "activity" ? <ActivityTimeline activities={activities} /> : null}
    </CrmDetailShell>
  );
}

function OverviewTab({
  company,
  ownerName,
}: {
  company: CompanyDetailPayload["company"];
  ownerName: string | null;
}) {
  return (
    <OverviewFields
      fields={[
        { label: "Status", value: crmStatusLabel(company.status) },
        { label: "Industry", value: company.industry ?? "—" },
        { label: "Owner", value: ownerName ?? "—" },
        {
          label: "Linked brand",
          value: company.brand_id ? (
            <Link href={`/app/brand/${company.brand_id}`} className={shellStyles.overviewLink}>
              Open brand
            </Link>
          ) : (
            "Not yet a brand"
          ),
        },
      ]}
    />
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
