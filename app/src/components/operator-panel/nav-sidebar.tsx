"use client";

// IPI-85 / IPI-110 — Left nav rail for the 3-panel operator shell.
// IPI-218 — Brand switcher section added (visible when expanded).
// Collapsed by default (icon-only, 3.5 rem). Click the toggle or any label
// to expand (14 rem). Active section highlighted with brand accent.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./nav-sidebar.module.css";

const NAV = [
  { href: "/app",           icon: "⌂",  label: "Home" },
  { href: "/app/shoots",    icon: "📷", label: "Shoots" },
  { href: "/app/brand",     icon: "◈",  label: "Brand" },
  { href: "/app/assets",    icon: "🖼", label: "Assets" },
  { href: "/app/campaigns", icon: "📣", label: "Campaigns" },
  { href: "/app/matching",  icon: "🤝", label: "Matching" },
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
}: {
  onThreadsClick?: () => void;
  brands?: Brand[];
  activeBrandId?: string | null;
  onBrandSelect?: (id: string) => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
          return (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.item} ${active ? styles.itemActive : ""}`}
                title={!open ? label : undefined}
              >
                <span className={styles.icon}>{icon}</span>
                {open && <span className={styles.label}>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Threads shortcut at bottom */}
      {onThreadsClick && (
        <div className={styles.footer}>
          <button
            className={styles.item}
            onClick={onThreadsClick}
            title={!open ? "Chat threads" : undefined}
          >
            <span className={styles.icon}>💬</span>
            {open && <span className={styles.label}>Threads</span>}
          </button>
        </div>
      )}
    </nav>
  );
}
