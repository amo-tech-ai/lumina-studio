/** Dev layout QA — `?skip=1` / `?skip=approval` (layout PR; intel fixture lives in lib/ on IPI-306). */

export const DEV_PREVIEW_HERO_BRAND_ID = "00000000-0000-4000-8000-000000000001";

export const DEV_PREVIEW_BRANDS = [
  { id: DEV_PREVIEW_HERO_BRAND_ID, name: "Nike", status: "active" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Adidas", status: "active" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Puma", status: "draft" },
] as const;

export function isDevSkipMode(skip: string | null): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return skip === "1" || skip === "approval";
}
