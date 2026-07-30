"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { useSetCrmChatContext } from "@/context/crm-chat-context";

import { ErrorState } from "@/components/ui/error-state";
import type { ContactDetailPayload } from "@/lib/crm/get-contact-detail";
import { normalizeContactFields, type ContactFieldEntry } from "@/lib/crm/jsonb-contact-fields";
import { ActivityTimeline } from "./activity-timeline";
import { CrmAvatar } from "./crm-avatar";
import { CrmDetailShell, DealsTab } from "./crm-detail-shell";
import styles from "./contact-detail-workspace.module.css";
import shellStyles from "./crm-detail-shell.module.css";

const TAB_IDS = ["overview", "deals", "activity"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  deals: "Deals",
  activity: "Activity",
};

type Props = {
  data: ContactDetailPayload | null;
  fetchError: string | null;
};

/** Contact Detail — ported from SCR-29-CRM-Contact-Detail.dc.html (IPI-392).
 *  Shares its header/tab-strip/tabpanel chrome and DealsTab with
 *  CompanyDetailWorkspace via crm-detail-shell.tsx (extracted this ticket).
 *
 *  Dropped vs DC: the "Sample data" breadcrumb badge (this is real data, not
 *  a design-tool artifact) and the AI relationship-summary card — same call
 *  as Company Detail, no crm-assistant summary RPC exists yet. The "Platform
 *  user" header link is dropped too: crm_contacts.profile_id is a real FK,
 *  but no platform user/profile route exists to link to — a link to nowhere
 *  is worse than no link. The "Contact" header badge is a static label, not
 *  a data-driven chip — crm_contacts has no type/role differentiation column,
 *  but every row in this table genuinely is a contact, so this isn't the
 *  same fabrication risk as the dropped per-row kind/ptype chips elsewhere. */
export function ContactDetailWorkspace({ data, fetchError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  const chatContext = useMemo(() => {
    if (fetchError || !data) return {};
    return {
      contactName: data.contact.name,
      companyName: data.companyName ?? undefined,
      crmRecordLoaded: true,
    };
  }, [data, fetchError]);
  useSetCrmChatContext(chatContext);

  if (fetchError || !data) {
    return (
      <div className={shellStyles.stateRoot}>
        <ErrorState message={fetchError ?? "Something went wrong."} onRetry={() => router.refresh()} />
      </div>
    );
  }

  const { contact, companyName, deals, activities } = data;
  const tabCount: Partial<Record<TabId, number>> = {
    deals: deals.length,
    activity: activities.length,
  };

  return (
    <CrmDetailShell
      backHref="/app/crm/contacts"
      backLabel="Contacts"
      current={contact.name}
      tabs={TAB_IDS}
      tabLabels={TAB_LABELS}
      tabCounts={tabCount}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelId="contact-detail-tabpanel"
      header={
        <div className={shellStyles.headerRow}>
          <CrmAvatar name={contact.name} shape="circle" />
          <div className={shellStyles.headerText}>
            <div className={shellStyles.nameRow}>
              <h1 className={shellStyles.name}>{contact.name}</h1>
              <span className={styles.typeBadge}>Contact</span>
            </div>
            <div className={shellStyles.meta}>
              {contact.role_title ? <span>{contact.role_title}</span> : null}
              <span>
                {contact.company_id ? (
                  <Link href={`/app/crm/companies/${contact.company_id}`} className={shellStyles.overviewLink}>
                    {companyName ?? "—"}
                  </Link>
                ) : (
                  "No linked organization"
                )}
              </span>
            </div>
          </div>
        </div>
      }
    >
      {tab === "overview" ? <OverviewTab contact={contact} /> : null}
      {tab === "deals" ? <DealsTab deals={deals} /> : null}
      {tab === "activity" ? <ActivityTimeline activities={activities} /> : null}
    </CrmDetailShell>
  );
}

function OverviewTab({ contact }: { contact: ContactDetailPayload["contact"] }) {
  const emails = normalizeContactFields(contact.email);
  const phones = normalizeContactFields(contact.phone);
  return (
    <div className={styles.fieldGroupStack}>
      <ContactFieldGroup label="Email" icon={<Mail size={15} aria-hidden className={styles.fieldIcon} />} entries={emails} />
      <ContactFieldGroup label="Phone" icon={<Phone size={15} aria-hidden className={styles.fieldIcon} />} entries={phones} />
    </div>
  );
}

function ContactFieldGroup({ label, icon, entries }: { label: string; icon: ReactNode; entries: ContactFieldEntry[] }) {
  return (
    <div className={styles.fieldGroup}>
      <div className={styles.fieldGroupLabel}>{label}</div>
      {entries.length === 0 ? (
        <div className={styles.fieldGroupEmpty}>No {label.toLowerCase()} on file.</div>
      ) : (
        <div className={styles.fieldGroupList}>
          {entries.map((entry, i) => (
            <button
              key={`${entry.value}-${i}`}
              type="button"
              className={styles.fieldRow}
              onClick={() => copyToClipboard(entry.value, label)}
              aria-label={`Copy ${label.toLowerCase()} ${entry.value}`}
            >
              {icon}
              <span className={styles.fieldValue}>{entry.value}</span>
              {entry.type ? <span className={styles.fieldTypeBadge}>{entry.type}</span> : null}
              {entry.primary ? <span className={styles.fieldPrimaryBadge}>Primary</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mobile & a11y AC: "Email/phone rows selectable (tap to copy)". Silent
 *  fallback on unsupported/insecure contexts — clipboard access is a nice-to-have
 *  affordance here, not a page-breaking feature if it's unavailable. */
async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn't copy — try selecting the text instead.");
  }
}
