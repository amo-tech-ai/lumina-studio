// Single source for the public marketing URL. Final domain: fashionos.co (decided
// 2026-06-22). Override per environment with NEXT_PUBLIC_SITE_URL; metadataBase
// resolves all relative OG image paths against it, so pages carry no domain literals.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fashionos.co";
