"use client";

// IPI-308 · MODEL-P2 — Matching tab shell. Talent is the only live tab;
// Creator/Asset/Product stay disabled shells (IPI2-123).
import { TalentMatchTabs } from "@/components/matching/talent-match-tabs";
import { TalentTab } from "@/components/matching/talent-tab";

import styles from "./matching.module.css";

export default function MatchingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Matching</h1>
      </div>
      <TalentMatchTabs />
      <div className={styles.content}>
        <TalentTab />
      </div>
    </div>
  );
}
