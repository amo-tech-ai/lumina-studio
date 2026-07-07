import { Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { ShootDetailCrewMember } from "@/lib/shoot/get-shoot-detail";
import { CREW_ROLE_LABEL, crewInitials } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  crew: ShootDetailCrewMember[];
};

/** shoot.shoot_crew has no resolved person name (only FK ids) — render by role,
 *  not a fabricated name. "Invite" is a Phase 2 write action, kept disabled. */
export function TeamTab({ crew }: Props) {
  if (crew.length === 0) {
    return (
      <EmptyState heading="No crew assigned yet" body="Booked crew for this shoot will appear here." icon={<Users />} />
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Team &amp; crew</h3>
        <button type="button" className={styles.secondaryBtn} disabled title="Coming soon">
          <Plus size={15} aria-hidden />
          Invite
        </button>
      </div>
      <div className={styles.crewGrid}>
        {crew.map((m) => (
          <div key={m.id} className={styles.crewRow}>
            <span className={styles.crewAvatar} aria-hidden>
              {crewInitials(m.role)}
            </span>
            <div className={styles.rowMain}>
              <div className={styles.crewName}>{CREW_ROLE_LABEL[m.role]}</div>
              {m.notes ? <div className={styles.crewMeta}>{m.notes}</div> : null}
            </div>
            <StatusChip
              dot={m.confirmed ? "var(--color-approved)" : "var(--color-warning-text)"}
              label={m.confirmed ? "Confirmed" : "Pending"}
              bare
            />
          </div>
        ))}
      </div>
    </div>
  );
}
