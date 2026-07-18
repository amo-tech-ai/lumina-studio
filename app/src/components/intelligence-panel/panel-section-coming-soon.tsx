import styles from "./intelligence-panel.module.css";

type Props = {
  title: string;
};

/**
 * Single reusable "not built yet" inline placeholder for panel sections
 * that have no shipped content, parameterized by title (IPI-286 correction
 * #4). Mirrors the disabled + title="Coming soon" convention already used
 * by app/src/components/planner/settings-tabs.tsx, adapted for a static
 * content section rather than a tab control.
 */
export function PanelSectionComingSoon({ title }: Props) {
  return (
    <section className={styles.section} aria-label={`${title} — coming soon`}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <p className={styles.mutedCopyInline} title="Coming soon">
        Coming soon.
      </p>
    </section>
  );
}
