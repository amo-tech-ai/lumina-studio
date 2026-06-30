import Link from "next/link";
import { Instagram, Linkedin, Mail } from "lucide-react";
import { SERVICES } from "./services";

// Dark marketing footer (replaces Vite Footer.tsx). Server component — static links.
export function MarketingFooter() {
  return (
    <footer style={{ background: "var(--mk-ink)", color: "#e7e5e4" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-cormorant)" }}>
            ipix<span style={{ color: "var(--mk-primary)" }}>.</span>
          </span>
          <p className="mt-3 max-w-xs text-sm text-stone-300">
            AI-powered content studio for fashion and DTC brands — planned shoots,
            on-brand imagery, every time.
          </p>
          <div className="mt-4 flex gap-4">
            <a href="https://instagram.com" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href="https://linkedin.com" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
            <a href="mailto:sk@ipix.co" aria-label="Email"><Mail className="h-5 w-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Services</h4>
          <ul className="space-y-2 text-sm text-stone-300">
            {SERVICES.slice(0, 5).map((s) => (
              <li key={s.href}><Link href={s.href}>{s.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">More</h4>
          <ul className="space-y-2 text-sm text-stone-300">
            {SERVICES.slice(5).map((s) => (
              <li key={s.href}><Link href={s.href}>{s.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Company</h4>
          <ul className="space-y-2 text-sm text-stone-300">
            <li><Link href="/#process">Process</Link></li>
            <li><Link href="/#portfolio">Work</Link></li>
            <li><Link href="/#contact">Contact</Link></li>
            <li><Link href="/login">Sign in</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-stone-400">
          © {new Date().getFullYear()} iPix / Lumina Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
