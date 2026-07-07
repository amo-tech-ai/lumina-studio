"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { EntityList } from "@/components/ui/entity-list";
import { getPrimaryEntry, type ContactFieldEntry } from "@/lib/crm/jsonb-contact-fields";
import type { ContactRow } from "@/lib/crm/queries";
import { CrmAvatar } from "./crm-avatar";
import styles from "./crm-list-workspace.module.css";

const FILTER_LABELS = ["Organization", "Role"];

/** email is a jsonb array ({value,type,primary}), not a single column —
 *  getPrimaryEntry (jsonb-contact-fields.ts) already picks the primary/first
 *  entry; this just narrows the untyped Json column before calling it. */
function primaryEmail(email: unknown): string | null {
  return Array.isArray(email) ? (getPrimaryEntry(email as ContactFieldEntry[])?.value ?? null) : null;
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
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(term));
  }, [contacts, search]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>People</h1>
            <p className={styles.count}>
              {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
            </p>
          </div>
          <button type="button" disabled title="Coming soon" className={styles.newBtn}>
            <Plus size={15} aria-hidden />
            New person
          </button>
        </div>
        <div className={styles.filterRow}>
          {FILTER_LABELS.map((label) => (
            <button key={label} type="button" disabled title="Coming soon" className={styles.filterBtn}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.listCard}>
          <EntityList
            items={filtered}
            emptyLabel="No contacts yet"
            emptyBody="Add your first person to start tracking relationships."
            searchPlaceholder="Search name"
            searchValue={search}
            onSearchChange={setSearch}
            error={fetchError}
            onRetry={() => router.refresh()}
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
        </div>
      </div>
    </div>
  );
}
