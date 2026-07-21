"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSetCrmChatContext } from "@/context/crm-chat-context";

import { getPrimaryEntry, normalizeContactFields } from "@/lib/crm/jsonb-contact-fields";
import type { ContactRow } from "@/lib/crm/queries";
import { CrmAvatar } from "./crm-avatar";
import { CrmCreateDialog } from "./crm-create-dialog";
import { CrmFilterChip, CrmListWorkspace } from "./crm-list-workspace";
import styles from "./crm-list-workspace.module.css";

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
  const [orgFilter, setOrgFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const orgOptions = useMemo(() => {
    const ids = [...new Set(contacts.map((c) => c.company_id).filter((id): id is string => Boolean(id)))];
    return ids.map((id) => ({ value: id, label: companyNames[id] ?? id }));
  }, [contacts, companyNames]);

  const roleOptions = useMemo(() => {
    const roles = [...new Set(contacts.map((c) => c.role_title).filter((r): r is string => Boolean(r)))];
    return roles.map((r) => ({ value: r, label: r }));
  }, [contacts]);

  const companyChoices = useMemo(
    () => Object.entries(companyNames).map(([id, name]) => ({ id, name })),
    [companyNames],
  );

  const visible = useMemo(() => {
    return contacts.filter((c) => {
      if (orgFilter && c.company_id !== orgFilter) return false;
      if (roleFilter && c.role_title !== roleFilter) return false;
      return true;
    });
  }, [contacts, orgFilter, roleFilter]);

  const chatContext = useMemo(
    () => (fetchError ? {} : { contactCount: contacts.length }),
    [contacts.length, fetchError],
  );
  useSetCrmChatContext(chatContext);

  return (
    <CrmListWorkspace
      title="People"
      countLabel={(n) => `${n} ${n === 1 ? "contact" : "contacts"}`}
      headerCount={contacts.length}
      newAction={<CrmCreateDialog kind="contact" triggerLabel="New person" companies={companyChoices} />}
      filters={
        <>
          <CrmFilterChip label="Organization" value={orgFilter} options={orgOptions} onChange={setOrgFilter} />
          <CrmFilterChip label="Role" value={roleFilter} options={roleOptions} onChange={setRoleFilter} />
        </>
      }
      items={visible}
      searchPlaceholder="Search name, organization, role, or email"
      filterItems={(items, term) => filterContacts(items, term, companyNames)}
      emptyLabel="No contacts yet"
      emptyBody="Add your first person to start tracking relationships."
      emptyAction={<CrmCreateDialog kind="contact" triggerLabel="New person" companies={companyChoices} />}
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
