import type { ShootDetailCrewMember } from "@/lib/shoot/get-shoot-detail";
import { formatRoleLabel, roleInitials } from "@/lib/shoot/shoot-detail-format";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = { crew: ShootDetailCrewMember[] };

export function ShootDetailTeamTab({ crew }: Props) {
  if (crew.length === 0) {
    return (
      <ShootDetailEmpty message="No crew assigned yet. Add team members when scheduling the shoot." />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle}>Team &amp; crew</h3>
      <div className={styles.crewGrid}>
        {crew.map((member) => (
          <div key={member.id} className={styles.crewCard}>
            <span className={styles.crewAvatar}>{roleInitials(member.role)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.crewName}>{formatRoleLabel(member.role)}</div>
              {member.notes ? (
                <div className={styles.crewRole} style={{ marginTop: "0.125rem" }}>
                  {member.notes}
                </div>
              ) : null}
            </div>
            <span
              className={styles.statusChip}
              data-confirmed={member.confirmed ? "true" : undefined}
            >
              {member.confirmed ? "Confirmed" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
