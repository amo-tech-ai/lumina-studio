// IPI-526 — Planner Hub plan card. Semantic link to the Workspace route
// (correction #8: accessible name describes the destination). Renders only
// fields listPlannerInstances actually returns — no owner-name/cover-photo
// lookups, since neither exists in the Slice A contract and per-card
// requests are explicitly forbidden.

import Link from "next/link";
import { Briefcase, Clapperboard, Megaphone, type LucideIcon } from "lucide-react";

import type { PlannerInstanceSummary } from "@/lib/planner/queries";
import { getInstanceUiTreatment } from "@/lib/planner/status-transitions";
import type { EntityType } from "@/lib/planner/types";

import styles from "./hub-workspace.module.css";

const ENTITY_META: Record<EntityType, { label: string; Icon: LucideIcon }> = {
  shoot: { label: "Shoot", Icon: Clapperboard },
  campaign: { label: "Campaign", Icon: Megaphone },
  crm_deal: { label: "CRM Deal", Icon: Briefcase },
};

function formatPlannerDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // ponytail: pin to UTC so SSR and hydration render the same day, matching
  // ShootCard's formatShootDate (app/src/components/shoot/ShootCard.tsx).
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

type Props = { item: PlannerInstanceSummary };

export function HubCard({ item }: Props) {
  const treatment = getInstanceUiTreatment(item.status);
  const entity = ENTITY_META[item.entityType];
  const Icon = entity.Icon;

  return (
    <Link
      href={`/app/planner/${item.id}`}
      className={styles.card}
      aria-label={`Open ${item.name} planner`}
      data-testid="hub-card"
      data-at-risk={item.atRisk ? "true" : undefined}
    >
      <div className={styles.cardCover}>
        <Icon size={22} aria-hidden className={styles.cardCoverIcon} />
        <span className={`${styles.statusChip} ${styles[`tone${capitalize(treatment.tone)}`]}`}>
          <span className={styles.statusDot} aria-hidden />
          {treatment.label}
        </span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardName}>{item.name}</p>
        <p className={styles.cardMeta}>
          <Icon size={12} aria-hidden />
          {entity.label}
        </p>
        <p className={styles.cardDates}>
          {formatPlannerDate(item.plannedStart)} – {formatPlannerDate(item.plannedEnd)}
        </p>
        <div className={styles.progressTrack}>
          <div
            className={item.atRisk ? styles.progressFillRisk : styles.progressFill}
            style={{ width: `${item.progress ?? 0}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
