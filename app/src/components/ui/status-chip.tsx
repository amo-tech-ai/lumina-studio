import styles from "./status-chip.module.css";

/** Presentational status pill — a colored dot + label. Ported 1:1 from
 *  StatusChip.dc.html (RF-01). Intentionally domain-free: the caller passes a
 *  resolved `dot` color token and `label` (see `crm/status-tokens.ts`,
 *  `shoot-list-filters.ts`). Do not add a status enum here. */
type Props = {
  /** Dot color — a token var string like `var(--color-approved)`, never a raw hex. */
  dot: string;
  label: string;
  /** DC style variants — mutually exclusive; `bare` wins if both set. */
  bare?: boolean;
  onImage?: boolean;
};

export function StatusChip({ dot, label, bare = false, onImage = false }: Props) {
  const modeClass = bare ? styles.bare : onImage ? styles.onImage : styles.pill;
  return (
    <span className={`${styles.wrap} ${modeClass}`}>
      <span className={styles.dot} style={{ background: dot }} aria-hidden />
      {label}
    </span>
  );
}
