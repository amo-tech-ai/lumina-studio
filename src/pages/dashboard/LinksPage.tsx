import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

const LinksPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-serif text-3xl">Links</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        Map products to Mercur catalog IDs.
      </p>
    </div>
    <DashboardEmptyState
      title="Product links"
      description="Manual Medusa product linking lands in UI-004. Connect commerce after brand intake."
    />
  </div>
);

export default LinksPage;
