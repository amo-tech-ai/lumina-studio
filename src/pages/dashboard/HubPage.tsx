import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

const HubPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-serif text-3xl">Command center</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        Your operator workspace for brands, assets, and commerce links.
      </p>
    </div>
    <DashboardEmptyState
      title="Welcome to iPix"
      description="Use the left navigation to open Brand, Assets, or Links. Brand URL intake ships in UI-002."
    />
  </div>
);

export default HubPage;
