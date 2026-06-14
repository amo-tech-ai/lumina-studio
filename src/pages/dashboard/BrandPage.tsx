import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

const BrandPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-serif text-3xl">Brand</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        Brand DNA profile and URL analysis.
      </p>
    </div>
    <DashboardEmptyState
      title="Connect brand URL"
      description="Paste your brand site to generate an AI profile and DNA scores — coming in UI-002 (IPI-23)."
    />
  </div>
);

export default BrandPage;
