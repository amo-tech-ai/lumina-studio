"use client";

// IPI-150 SHOOT-AI-003 — Gate 2 approval card
// IPI-304 — renders through the shared ApprovalCardShell/ApprovalHeader;
// no ApprovalActions (this card has no approve/reject UI today).

import styles from "@/components/shoot/shoot-wizard.module.css";
import { ApprovalCardShell, ApprovalHeader } from "@/components/approval-card";

type Shot = { shot_number: number; description: string; angle: string; lighting: string; deliverable_ids: string[] };

interface Props {
  shots: Shot[];
  deliverableCount: number;
  uncoveredWarnings?: string[];
  onChange: (shots: Shot[]) => void;
}

export function ShotListApprovalCard({ shots, deliverableCount, uncoveredWarnings = [], onChange }: Props) {
  const update = (shot_number: number, patch: Partial<Shot>) =>
    onChange(shots.map((s) => (s.shot_number === shot_number ? { ...s, ...patch } : s)));

  return (
    <div className={styles.section}>
      {uncoveredWarnings.length > 0 && (
        <div className={styles.errorBanner}>🚨 Coverage gaps: {uncoveredWarnings.join(" · ")}</div>
      )}

      <ApprovalCardShell className={styles.card}>
        <ApprovalHeader
          className={styles.cardHeader}
          title={`${shots.length} shots · ${deliverableCount} deliverable types`}
          titleClassName={styles.cardTitle}
        />
        <table className={styles.table}>
          <thead>
            <tr>
              {["#", "Description", "Angle", "Lighting"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shots.map((s) => (
              <tr key={s.shot_number}>
                <td className={styles.rowNum}>{String(s.shot_number).padStart(2, "0")}</td>
                <td>
                  <input
                    className={styles.cellInput}
                    aria-label={`Description for shot ${s.shot_number}`}
                    value={s.description}
                    onChange={(e) => update(s.shot_number, { description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.cellInput} ${styles.cellInputMuted}`}
                    aria-label={`Angle for shot ${s.shot_number}`}
                    value={s.angle}
                    onChange={(e) => update(s.shot_number, { angle: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.cellInput} ${styles.cellInputMuted}`}
                    aria-label={`Lighting for shot ${s.shot_number}`}
                    value={s.lighting}
                    onChange={(e) => update(s.shot_number, { lighting: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ApprovalCardShell>
    </div>
  );
}
