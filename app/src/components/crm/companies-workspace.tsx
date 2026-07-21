"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSetCrmChatContext } from "@/context/crm-chat-context";

import { StatusChip } from "@/components/ui/status-chip";
import { crmStatusDotToken, crmStatusLabel } from "@/lib/crm/status-tokens";
import type { CompanyRow } from "@/lib/crm/queries";
import { CrmAvatar } from "./crm-avatar";
import { CrmCreateDialog } from "./crm-create-dialog";
import { CrmFilterChip, CrmListWorkspace } from "./crm-list-workspace";
import styles from "./crm-list-workspace.module.css";

function filterCompanies(companies: CompanyRow[], term: string): CompanyRow[] {
  return companies.filter(
    (c) => c.name.toLowerCase().includes(term) || (c.domain ?? "").toLowerCase().includes(term),
  );
}

/** Ported from SCR-26-CRM-Companies-List.dc.html (RF-03). DC's `kind` chip,
 *  `deals` count, `lastActivity`, and logo image aren't backed by any
 *  crm_companies column — dropped rather than fabricated (see PR negative-AC
 *  notes). Row click routes to the existing /app/crm/companies/[id] stub
 *  (IPI-391 builds the real detail page) instead of DC's inline right-rail
 *  preview, which relies on a hardcoded AI summary this ticket doesn't wire. */
export function CompaniesWorkspace({
  companies,
  ownerNames,
  fetchError,
}: {
  companies: CompanyRow[];
  /** crm_companies.owner is a uuid FK to profiles(id) — this is the resolved
   *  id→display-name map built in page.tsx (via getProfileNames), never the raw id. */
  ownerNames: Record<string, string>;
  fetchError: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);

  const statusOptions = useMemo(() => {
    const values = [...new Set(companies.map((c) => c.status).filter(Boolean))];
    return values.map((v) => ({ value: v, label: crmStatusLabel(v) }));
  }, [companies]);

  const ownerOptions = useMemo(() => {
    const ids = [...new Set(companies.map((c) => c.owner).filter((id): id is string => Boolean(id)))];
    return ids.map((id) => ({ value: id, label: ownerNames[id] ?? id }));
  }, [companies, ownerNames]);

  const visible = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (ownerFilter && c.owner !== ownerFilter) return false;
      return true;
    });
  }, [companies, statusFilter, ownerFilter]);

  const chatContext = useMemo(
    () => (fetchError ? {} : { companyCount: companies.length }),
    [companies.length, fetchError],
  );
  useSetCrmChatContext(chatContext);

  const createDialog = <CrmCreateDialog kind="company" triggerLabel="New organization" />;

  return (
    <CrmListWorkspace
      title="Organizations"
      countLabel={(n) => `${n} ${n === 1 ? "company" : "companies"}`}
      headerCount={companies.length}
      newAction={createDialog}
      filters={
        <>
          <CrmFilterChip
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <CrmFilterChip label="Owner" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        </>
      }
      items={visible}
      searchPlaceholder="Search name or domain"
      filterItems={filterCompanies}
      emptyLabel="No companies yet"
      emptyBody="Add your first relationship to start building the pipeline."
      emptyAction={<CrmCreateDialog kind="company" triggerLabel="Add a company" />}
      fetchError={fetchError}
      renderRow={(company) => (
        <Link href={`/app/crm/companies/${company.id}`} className={`${styles.row} ${styles.companiesGrid}`}>
          <div className={styles.rowMain}>
            <CrmAvatar name={company.name} shape="square" />
            <div className={styles.rowMainText}>
              <div className={styles.rowName}>{company.name}</div>
              {company.domain ? <div className={styles.rowSub}>{company.domain}</div> : null}
            </div>
          </div>
          <div>
            <StatusChip dot={crmStatusDotToken(company.status)} label={crmStatusLabel(company.status)} />
          </div>
          <div className={styles.rowCell}>{company.industry ?? "—"}</div>
          <div className={styles.rowCell}>{(company.owner && ownerNames[company.owner]) ?? "—"}</div>
        </Link>
      )}
    />
  );
}
