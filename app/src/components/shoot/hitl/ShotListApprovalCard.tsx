"use client";

// IPI-150 SHOOT-AI-003 — Gate 2 approval card

import styles from "@/components/shoot/shoot-wizard.module.css";

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

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>
            {shots.length} shots · {deliverableCount} deliverable types
          </span>
        </div>
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
                    value={s.description}
                    onChange={(e) => update(s.shot_number, { description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.cellInput} ${styles.cellInputMuted}`}
                    value={s.angle}
                    onChange={(e) => update(s.shot_number, { angle: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.cellInput} ${styles.cellInputMuted}`}
                    value={s.lighting}
                    onChange={(e) => update(s.shot_number, { lighting: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
