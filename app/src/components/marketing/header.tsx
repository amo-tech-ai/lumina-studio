"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { SERVICES } from "./services";

// Scroll-aware marketing header (replaces Vite Header.tsx). Transparent at top,
// solid backdrop once scrolled. Services dropdown + mobile sheet. No operator UI.
export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors"
      style={{
        background: scrolled ? "color-mix(in srgb, var(--mk-bg) 88%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        borderBottom: scrolled ? "1px solid var(--mk-border)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
          ipix<span style={{ color: "var(--mk-primary)" }}>.</span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setServicesOpen(false); }}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setServicesOpen(false); }}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen((v) => !v)}
            >
              Services <ChevronDown className="h-4 w-4" />
            </button>
            {servicesOpen && (
              <div
                className="absolute left-0 top-full w-64 rounded-md p-2 shadow-lg"
                style={{ background: "var(--mk-surface)", border: "1px solid var(--mk-border)" }}
              >
                {SERVICES.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="block rounded px-3 py-2 text-sm hover:bg-[var(--mk-bg)]"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/#portfolio" className="text-sm">Work</Link>
          <Link href="/#process" className="text-sm">Process</Link>
          <Link href="/login" className="text-sm">Sign in</Link>
          <Link
            href="/#contact"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--mk-primary)" }}
          >
            Get a Quote
          </Link>
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* mobile sheet */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{ background: "var(--mk-bg)", borderTop: "1px solid var(--mk-border)" }}
        >
          <nav className="flex flex-col gap-1 px-6 py-4">
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} className="py-2 text-sm" onClick={() => setMobileOpen(false)}>
                {s.label}
              </Link>
            ))}
            <Link href="/login" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Sign in</Link>
            <Link
              href="/#contact"
              className="mt-2 rounded-md px-4 py-2 text-center text-sm font-medium text-white"
              style={{ background: "var(--mk-primary)" }}
              onClick={() => setMobileOpen(false)}
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
