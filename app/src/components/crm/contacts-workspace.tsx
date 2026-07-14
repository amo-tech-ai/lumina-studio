"use client";

import Link from "next/link";

import { getPrimaryEntry, normalizeContactFields } from "@/lib/crm/jsonb-contact-fields";
import type { ContactRow } from "@/lib/crm/queries";
import { CrmAvatar } from "./crm-avatar";
import { ComingSoonButton, CrmListWorkspace } from "./crm-list-workspace";
import styles from "./crm-list-workspace.module.css";

const FILTER_LABELS = ["Organization", "Type", "Has open deal"];

/** email is a jsonb array — normalizeContactFields handles both the
 *  {value,type,primary} object shape and the plain-string shape real seed
 *  data actually uses (see jsonb-contact-fields.ts). */
function primaryEmail(email: unknown): string | null {
  return getPrimaryEntry(normalizeContactFields(email))?.value ?? null;
}

function filterContacts(contacts: ContactRow[], term: string, companyNames: Record<string, string>): ContactRow[] {
  return contacts.filter((c) => {
    const email = primaryEmail(c.email)?.toLowerCase() ?? "";
    const org = (c.company_id ? companyNames[c.company_id] : undefined)?.toLowerCase() ?? "";
    return (
      c.name.toLowerCase().includes(term) ||
      email.includes(term) ||
      (c.role_title ?? "").toLowerCase().includes(term) ||
      org.includes(term)
    );
  });
}

/** Ported from SCR-28-CRM-Contacts-List.dc.html (RF-03). DC's `ptype` chip
 *  (model/photographer/crew), `openDeals`, and `lastActivity` aren't backed by
 *  any crm_contacts column — dropped rather than fabricated. `companyNames` is
 *  a plain id→name lookup built in page.tsx from the org's own listCompanies()
 *  result (no join added to listContacts, which the crm-assistant Mastra tool
 *  also calls). Row click routes to /app/crm/contacts/[id] (IPI-392 builds the
 *  real detail page). */
export function ContactsWorkspace({
  contacts,
  companyNames,
  fetchError,
}: {
  contacts: ContactRow[];
  companyNames: Record<string, string>;
  fetchError: string | null;
}) {
  return (
    <CrmListWorkspace
      title="People"
      countLabel={(n) => `${n} ${n === 1 ? "contact" : "contacts"}`}
      newLabel="New person"
      filterLabels={FILTER_LABELS}
      items={contacts}
      searchPlaceholder="Search name, organization, role, or email"
      filterItems={(items, term) => filterContacts(items, term, companyNames)}
      emptyLabel="No contacts yet"
      emptyBody="Add your first person to start tracking relationships."
      emptyAction={<ComingSoonButton label="New person" />}
      fetchError={fetchError}
      renderRow={(contact) => {
        const email = primaryEmail(contact.email);
        const org = contact.company_id ? (companyNames[contact.company_id] ?? "—") : "—";
        return (
          <Link href={`/app/crm/contacts/${contact.id}`} className={`${styles.row} ${styles.contactsGrid}`}>
            <div className={styles.rowMain}>
              <CrmAvatar name={contact.name} shape="circle" />
              <div className={styles.rowMainText}>
                <div className={styles.rowName}>{contact.name}</div>
              </div>
            </div>
            <div className={styles.rowCell}>{org}</div>
            <div className={styles.rowCell}>{contact.role_title ?? "—"}</div>
            <div className={styles.rowCell}>{email ?? "—"}</div>
          </Link>
        );
      }}
    />
  );
}
