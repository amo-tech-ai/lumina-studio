// IPI-536 — Settings route stub. Existence/UUID guard lives in the parent
// [instanceId]/layout.tsx. Real content ships in IPI-577 (PLN-S6).

export default function PlannerSettingsPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Planner Settings</h1>
      <p>Members and workflow settings will appear here.</p>
    </div>
  );
}
