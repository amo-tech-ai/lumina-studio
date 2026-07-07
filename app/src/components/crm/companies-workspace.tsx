"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { EntityList } from "@/components/ui/entity-list";
import { StatusChip } from "@/components/ui/status-chip";
import { crmStatusDotToken, crmStatusLabel } from "@/lib/crm/status-tokens";
import type { CompanyRow } from "@/lib/crm/queries";
import { CrmAvatar } from "./crm-avatar";
import styles from "./crm-list-workspace.module.css";

const FILTER_LABELS = ["Type", "Status", "Owner"];

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
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) => c.name.toLowerCase().includes(term) || (c.domain ?? "").toLowerCase().includes(term),
    );
  }, [companies, search]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Organizations</h1>
            <p className={styles.count}>
              {companies.length} {companies.length === 1 ? "company" : "companies"}
            </p>
          </div>
          <button type="button" disabled title="Coming soon" className={styles.newBtn}>
            <Plus size={15} aria-hidden />
            New organization
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
            emptyLabel="No companies yet"
            emptyBody="Add your first relationship to start building the pipeline."
            searchPlaceholder="Search name or domain"
            searchValue={search}
            onSearchChange={setSearch}
            error={fetchError}
            onRetry={() => router.refresh()}
            renderRow={(company) => (
              <Link
                href={`/app/crm/companies/${company.id}`}
                className={`${styles.row} ${styles.companiesGrid}`}
              >
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
        </div>
      </div>
    </div>
  );
}
