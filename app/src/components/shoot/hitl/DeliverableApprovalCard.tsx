"use client";

// IPI-150 SHOOT-AI-003 — Gate 1 approval card

import styles from "@/components/shoot/shoot-wizard.module.css";

type Deliverable = { id: string; channel: string; format: string; quantity: number };

interface Props {
  deliverables: Deliverable[];
  totalAssets: number;
  uncoveredWarnings?: string[];
  onChange: (deliverables: Deliverable[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function DeliverableApprovalCard({
  deliverables,
  totalAssets,
  uncoveredWarnings = [],
  onChange,
  onAdd,
  onRemove,
}: Props) {
  const update = (id: string, patch: Partial<Deliverable>) => {
    const next = deliverables.map((d) => (d.id === id ? { ...d, ...patch } : d));
    onChange(next);
  };

  return (
    <div className={styles.section}>
      {uncoveredWarnings.length > 0 && (
        <div className={styles.specWarn}>⚠ {uncoveredWarnings.join(" · ")}</div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>
            {deliverables.length} deliverables · {totalAssets} total assets
          </span>
          <button className={styles.cardAction} onClick={onAdd}>+ Add</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              {["#", "Channel", "Format", "Qty", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliverables.map((d, i) => (
              <tr key={d.id}>
                <td className={styles.rowNum}>{i + 1}</td>
                <td>
                  <input
                    className={styles.cellInput}
                    placeholder="channel"
                    value={d.channel}
                    onChange={(e) => update(d.id, { channel: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.cellInput} ${styles.cellInputMuted}`}
                    placeholder="format"
                    value={d.format}
                    onChange={(e) => update(d.id, { format: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={d.quantity}
                    onChange={(e) => {
                      const qty = Math.max(1, Math.floor(Number(e.target.value)));
                      if (Number.isFinite(qty)) update(d.id, { quantity: qty });
                    }}
                    className={styles.qtyInput}
                  />
                </td>
                <td>
                  <button
                    onClick={() => onRemove(d.id)}
                    className={styles.removeBtn}
                    aria-label={`Remove deliverable ${i + 1}`}
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
