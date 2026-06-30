// Single source for the public marketing URL. Final domain: www.ipix.co.
// Override per environment with NEXT_PUBLIC_SITE_URL; metadataBase
// resolves all relative OG image paths against it, so pages carry no domain literals.
const DEFAULT_SITE_URL = "https://www.ipix.co";

// Normalize defensively: a malformed NEXT_PUBLIC_SITE_URL would otherwise throw at
// module-eval time inside every `new URL(SITE_URL)` (metadataBase) and break the app.
function normalizeSiteUrl(raw: string | undefined): string {
  if (!raw) return DEFAULT_SITE_URL;
  const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
