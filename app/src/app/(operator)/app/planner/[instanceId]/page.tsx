// IPI-536 — Workspace route stub. Existence/UUID guard lives in the sibling
// layout.tsx (shared with settings/page.tsx). Real content ships in PLN-S1A–F
// (IPI-578/579/580/581/582).

export default function PlannerWorkspacePage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Planner Workspace</h1>
      <p>Timeline, Kanban, List, and Calendar views will appear here.</p>
    </div>
  );
}
