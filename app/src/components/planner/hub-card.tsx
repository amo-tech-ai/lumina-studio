// IPI-526 — Planner Hub plan card. Semantic link to the Workspace route
// (correction #8: accessible name describes the destination). Renders only
// real fields listPlannerInstances returns — no per-card database requests.
// The cover photo and owner icon are decorative (same fallback-cover idiom
// ShootCard already uses via shootListCoverForShoot): listPlannerInstances
// has no cover_url or owner-display-name field, so nothing here is fabricated
// data — a real name/photo would need its own ticket (owner-name resolution
// mirrors the listMembers/planner_get_member_names precedent from IPI-577).

import Image from "next/image";
import Link from "next/link";
import { Briefcase, Clapperboard, Megaphone, User, type LucideIcon } from "lucide-react";

import { plannerHubCoverForInstance } from "@/lib/command-center/sample-images";
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
        <Image
          src={plannerHubCoverForInstance(item.id)}
          alt=""
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 33vw, 25vw"
          className={styles.cardCoverImage}
        />
        <span className={styles.cardCoverScrim} aria-hidden />
        <span className={`${styles.statusChip} ${styles[`tone${capitalize(treatment.tone)}`]}`}>
          <span className={styles.statusDot} aria-hidden />
          {treatment.label}
        </span>
        <span className={styles.cardCoverEntity}>
          <Icon size={13} aria-hidden />
          {entity.label}
        </span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardName}>{item.name}</p>
        <p className={item.atRisk ? styles.cardSentenceRisk : styles.cardSentence}>
          {item.progress === null ? "No tasks yet" : `${item.progress}% complete`}
        </p>
        <div className={styles.cardMetaRow}>
          <span className={styles.cardDates}>
            {formatPlannerDate(item.plannedStart)} – {formatPlannerDate(item.plannedEnd)}
          </span>
          <span className={styles.cardOwner} aria-hidden>
            <User size={11} />
          </span>
        </div>
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
