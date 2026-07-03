import { SectionPlaceholder } from "@/components/section-placeholder";

/**
 * IPI-248 — Asset library workspace (UI pending).
 * Data: GET /api/assets?brand_id=&shoot_id= → get_brand_assets RPC
 * (unifies public.assets + shoot.shoot_assets — see tasks/design-docs/shoot/data.md)
 */
export default function AssetsPage() {
  return (
    <SectionPlaceholder
      title="Assets"
      blurb="Score Asset DNA and review brand compliance for shoot media. API: GET /api/assets?brand_id=…"
      issue="IPI-248 Asset library"
    />
  );
}
