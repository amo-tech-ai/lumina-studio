import styles from "./crm-avatar.module.css";

/** Initials tile — no logo/photo column exists on crm_companies or crm_contacts,
 *  so this replaces DC's fabricated background-image logo with an honest,
 *  data-free visual. `square` for organizations, `circle` for people. */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CrmAvatar({ name, shape = "circle" }: { name: string; shape?: "circle" | "square" }) {
  return (
    <span className={`${styles.avatar} ${shape === "square" ? styles.square : styles.circle}`} aria-hidden>
      {initialsFromName(name)}
    </span>
  );
}
