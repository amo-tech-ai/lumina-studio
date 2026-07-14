// IPI-536 — shared loading skeleton for all 4 Planner route stubs.

export function PlannerLoadingSkeleton() {
  return (
    <div
      style={{ padding: "2rem" }}
      role="status"
      aria-busy="true"
      aria-label="Loading Planner"
    >
      <div
        style={{
          height: 24,
          width: 200,
          background: "var(--muted-bg, #e5e5e5)",
          borderRadius: 6,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 16,
          width: "80%",
          background: "var(--muted-bg, #e5e5e5)",
          borderRadius: 6,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 16,
          width: "60%",
          background: "var(--muted-bg, #e5e5e5)",
          borderRadius: 6,
        }}
      />
    </div>
  );
}
