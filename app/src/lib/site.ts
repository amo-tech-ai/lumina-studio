// Single source for the public marketing URL. Final domain: www.ipix.co.
// Override per environment with NEXT_PUBLIC_SITE_URL; metadataBase
// resolves all relative OG image paths against it, so pages carry no domain literals.
const DEFAULT_SITE_URL = "https://www.ipix.co";

// Deployment-preview hosts must never become canonical (IPI-902 · CF-MKT-002):
// an accidental NEXT_PUBLIC_SITE_URL pointing at a preview Worker or Vercel
// deployment would leak into canonical/OG URLs and split search signals.
const FORBIDDEN_CANONICAL_HOSTS = [
  /(^|\.)workers\.dev$/i,
  /(^|\.)vercel\.app$/i,
] as const;

// Normalize defensively: a malformed NEXT_PUBLIC_SITE_URL would otherwise throw at
// module-eval time inside every `new URL(SITE_URL)` (metadataBase) and break the app.
// Also rejects preview hosts (workers.dev / vercel.app) — those fall back to the
// canonical production domain instead of being emitted into metadata.
export function normalizeSiteUrl(raw: string | undefined): string {
  if (!raw) return DEFAULT_SITE_URL;
  const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate).origin;
    if (FORBIDDEN_CANONICAL_HOSTS.some((re) => re.test(parsed))) {
      return DEFAULT_SITE_URL;
    }
    return parsed;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

// Absolute canonical URL for a public marketing route. Always resolves against
// the canonical production host (SITE_URL) — page files never hardcode a host.
export function canonicalUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
