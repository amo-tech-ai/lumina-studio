"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Columns3, Users } from "lucide-react";

import styles from "./crm-mobile-tab-bar.module.css";

const TABS = [
  { href: "/app/crm/companies", label: "Companies", match: "/app/crm/companies", Icon: Building2 },
  { href: "/app/crm/contacts", label: "Contacts", match: "/app/crm/contacts", Icon: Users },
  { href: "/app/crm/pipeline", label: "Pipeline", match: "/app/crm/pipeline", Icon: Columns3 },
] as const;

/** IPI-572 — CRM Relationships bottom tabs (Companies · Contacts · Pipeline).
 *  Renders under the existing OperatorChatDock; desktop hidden via CSS.
 *  Does not replace nav, composer, or IntelligencePanel. */
export function CrmMobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabBar} aria-label="CRM sections" data-testid="crm-mobile-tab-bar">
      {TABS.map(({ href, label, match, Icon }) => {
        const active =
          pathname === match ||
          pathname.startsWith(`${match}/`) ||
          (match === "/app/crm/companies" && (pathname === "/app/crm" || pathname === "/app/crm/"));
        return (
          <Link
            key={href}
            href={href}
            className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} aria-hidden strokeWidth={active ? 2.25 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
