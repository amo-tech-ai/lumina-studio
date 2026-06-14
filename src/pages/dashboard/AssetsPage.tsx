import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

const AssetsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-serif text-3xl">Assets</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        Shoot assets with DNA compliance badges.
      </p>
    </div>
    <DashboardEmptyState
      title="No assets yet"
      description="Upload and score creative assets after brand setup. Asset list UI ships in UI-003."
    />
  </div>
);

export default AssetsPage;
