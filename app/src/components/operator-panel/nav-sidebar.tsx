"use client";

// IPI-85 / IPI-110 — Left nav rail for the 3-panel operator shell.
// IPI-218 — Brand switcher section added (visible when expanded).
// Collapsed by default (icon-only, 3.5 rem). Click the toggle or any label
// to expand (14 rem). Active section highlighted with brand accent.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "./sign-out-button";
import { useMobileRailHidden } from "./use-mobile-rail-hidden";
import type { UnreadBadgeState } from "./use-unread-notifications";
import styles from "./nav-sidebar.module.css";

const NAV = [
  { href: "/app",           icon: "⌂",  label: "Home" },
  { href: "/app/shoots",    icon: "📷", label: "Shoots" },
  { href: "/app/planner",   icon: "🗓", label: "Planner" },
  { href: "/app/crm",       icon: "◎",  label: "CRM" },
  { href: "/app/brand",     icon: "◈",  label: "Brand" },
  { href: "/app/assets",    icon: "🖼", label: "Assets" },
  { href: "/app/campaigns", icon: "📣", label: "Campaigns" },
  { href: "/app/matching",  icon: "🤝", label: "Matching" },
  { href: "/app/inbox",     icon: "🔔", label: "Inbox" },
] as const;

export interface Brand {
  id: string;
  name: string;
  status: string;
}

export function NavSidebar({
  onThreadsClick,
  brands = [],
  activeBrandId,
  onBrandSelect,
  unreadNotifications = { count: 0, hasMore: false },
}: {
  onThreadsClick?: () => void;
  brands?: Brand[];
  activeBrandId?: string | null;
  onBrandSelect?: (id: string) => void;
  /** IPI-407 — unread state for the Inbox nav badge. `count` is only "how many
   *  came back in a 50-row page" — `hasMore` (next_cursor present) is what
   *  actually drives the "50+" display, since count alone can never exceed 50. */
  unreadNotifications?: UnreadBadgeState;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // When the rail is CSS-hidden, MobileSignOutBar owns Sign Out (unique testid).
  const railHidden = useMobileRailHidden();
  const showSignOutInRail = railHidden !== true;

  return (
    <nav
      className={`${styles.nav} ${open ? styles.navOpen : styles.navClosed}`}
      aria-label="App navigation"
    >
      {/* Toggle */}
      <button
        className={styles.toggleBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Collapse navigation" : "Expand navigation"}
        title={open ? "Collapse" : "Expand"}
      >
        <span className={styles.toggleIcon}>{open ? "‹" : "›"}</span>
      </button>

      {/* Brand switcher — only when expanded and brands are loaded */}
      {open && brands.length > 0 && (
        <div className={styles.brands}>
          <span className={styles.brandSectionLabel}>Brands</span>
          {brands.map((brand) => {
            const active = brand.id === activeBrandId;
            return (
              <button
                key={brand.id}
                className={`${styles.brandItem} ${active ? styles.brandItemActive : ""}`}
                onClick={() => onBrandSelect?.(brand.id)}
                title={brand.name}
              >
                <span className={styles.brandDot} />
                <span className={styles.label}>{brand.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Nav links */}
      <ul className={styles.list}>
        {NAV.map(({ href, icon, label }) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          const isInbox = href === "/app/inbox";
          const badgeCount = isInbox ? unreadNotifications.count : 0;
          const badgeHasMore = isInbox && unreadNotifications.hasMore;
          const badgeLabel = badgeHasMore ? "50+" : badgeCount > 0 ? String(badgeCount) : null;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.item} ${active ? styles.itemActive : ""}`}
                title={!open ? label : undefined}
                aria-label={badgeLabel ? `${label} — ${badgeLabel} unread` : label}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.iconWrap}>
                  <span className={styles.icon} aria-hidden="true">{icon}</span>
                  {badgeLabel && <span className={styles.badge} aria-hidden="true">{badgeLabel}</span>}
                </span>
                {open && <span className={styles.label}>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Threads + Sign out — always at bottom of the rail */}
      <div className={styles.footer}>
        {onThreadsClick && (
          <button
            className={styles.item}
            onClick={onThreadsClick}
            title={!open ? "Chat threads" : undefined}
            aria-label="Chat threads"
          >
            <span className={styles.icon} aria-hidden="true">💬</span>
            {open && <span className={styles.label}>Threads</span>}
          </button>
        )}
        {showSignOutInRail && <SignOutButton showLabel={open} />}
      </div>
    </nav>
  );
}
