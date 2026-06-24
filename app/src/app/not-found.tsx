import type { Metadata } from "next";
import Link from "next/link";
import "./(marketing)/marketing.css";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  robots: { index: false, follow: false },
};

// WEB-013 — root not-found.tsx catches ALL unmatched routes (marketing + operator).
// Rendered under the root layout only → no header/footer, no CopilotKit/OperatorPanel.
// Wrapped in `.marketing` for brand tokens/fonts (marketing.css).
export default function NotFound() {
  return (
    <div className="marketing flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="mb-10 text-2xl font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
        ipix<span style={{ color: "var(--mk-primary)" }}>.</span>
      </Link>
      <p className="mb-4 text-sm uppercase tracking-[0.25em]" style={{ color: "var(--mk-primary)" }}>Error 404</p>
      <h1 className="mb-4 text-6xl font-light md:text-7xl">Page Not Found</h1>
      <p className="mb-10 max-w-md text-base leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/" className="px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>
          Return Home
        </Link>
        <Link href="/#services" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>
          Browse Services
        </Link>
      </div>
    </div>
  );
}
