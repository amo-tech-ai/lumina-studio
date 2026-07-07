import Image from "next/image";
import { Camera, CheckCircle2, Circle, DollarSign, Package } from "lucide-react";

import { StatusChip } from "@/components/ui/status-chip";
import { isDeliverableCover } from "@/lib/cloudinary/url";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import { deliverableDot, formatMoney } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  data: ShootDetailPayload;
};

export function OverviewTab({ data }: Props) {
  const { shoot, deliverables, shots, crew, brand } = data;
  const shotsDone = shots.filter((s) => s.status !== "pending").length;

  // Derived, honest "production checklist" — there is no checklist table in the
  // schema; DC's mock content is fabricated, so this reads real shoot state instead.
  const checklist = [
    { label: "Shot list created", done: shots.length > 0 },
    { label: "Budget set", done: shoot.estimated_budget != null },
    { label: "Crew booked", done: crew.some((c) => c.confirmed) },
    { label: "Deliverables defined", done: deliverables.length > 0 },
    { label: "Moodboard added", done: shoot.mood_board_urls.length > 0 },
  ];

  return (
    <div className={styles.overview}>
      <div className={styles.statGrid}>
        <div className={styles.card}>
          <div className={styles.statLabel}>
            <Camera size={14} aria-hidden />
            Shots
          </div>
          <div className={styles.statValue}>
            {shotsDone}/{shots.length}
          </div>
          <div className={styles.statSub}>captured or approved</div>
        </div>
        <div className={styles.card}>
          <div className={styles.statLabel}>
            <Package size={14} aria-hidden />
            Deliverables
          </div>
          <div className={styles.statValue}>{deliverables.length}</div>
          <div className={styles.statSub}>{deliverables.length === 1 ? "channel" : "channels"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.statLabel}>
            <DollarSign size={14} aria-hidden />
            Budget
          </div>
          <div className={styles.statValue}>{formatMoney(shoot.estimated_budget, shoot.currency)}</div>
          <div className={styles.statSub}>
            {shoot.actual_cost != null ? `${formatMoney(shoot.actual_cost, shoot.currency)} spent` : "Not tracked yet"}
          </div>
        </div>
      </div>

      {shoot.mood_board_urls.length > 0 ? (
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Moodboard</h3>
            <span className={styles.statSub}>{brand.name} Brand DNA</span>
          </div>
          <div className={styles.moodboardGrid}>
            {shoot.mood_board_urls.slice(0, 6).map((url, i) => (
              <div key={i} className={styles.moodboardTile}>
                {isDeliverableCover(url) ? (
                  <Image src={url} alt="" fill sizes="16vw" className={styles.heroImage} />
                ) : (
                  // next/image throws on a host outside remotePatterns; mood_board_urls
                  // is free-form, so an off-cloud URL still renders — just unoptimized.
                  <img src={url} alt="" className={styles.fillImgFallback} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.overviewGrid}>
        <div>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 11 }}>
            Production checklist
          </h3>
          <div className={styles.checklist}>
            {checklist.map((c) => (
              <div key={c.label} className={styles.row}>
                {c.done ? (
                  <CheckCircle2 size={19} color="var(--color-approved)" aria-hidden />
                ) : (
                  <Circle size={19} color="var(--color-border-strong)" aria-hidden />
                )}
                <span className={styles.rowLabel} style={{ opacity: c.done ? 0.7 : 1 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 11 }}>
            Deliverables
          </h3>
          {deliverables.length === 0 ? (
            <p className={styles.statSub}>No deliverables defined yet.</p>
          ) : (
            <div className={styles.checklist}>
              {deliverables.map((d) => (
                <div key={d.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowLabel}>{d.channel}</div>
                    <div className={styles.rowSub}>
                      {d.format ?? "—"} · {d.quantity}
                    </div>
                  </div>
                  <StatusChip dot={deliverableDot(d.status)} label={d.status ?? "Unknown"} bare />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
