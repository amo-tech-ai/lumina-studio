import Link from "next/link";

import { plannerRoute } from "@/lib/planner/constants";

// IPI-536 — Planner-scoped not-found. Deliberately lives at the /app/planner
// (parent) segment, NOT inside [instanceId]/ — Next.js does not let a
// segment's own not-found.tsx catch a notFound() call thrown from that same
// segment's layout.tsx, only from page.tsx/children (confirmed by manual
// browser test: putting this file at [instanceId]/not-found.tsx fell through
// to the root marketing 404 instead). Also deliberately NOT the root
// app/src/app/not-found.tsx: that one is the marketing-site 404 (wrapped in
// `.marketing`/marketing.css, no operator shell) — falling back to it from an
// authenticated Planner route would drop the user out of the
// OperatorPanel/nav/chat dock entirely. This file renders inside the
// (operator) layout, so the shell stays visible.
export default function PlannerInstanceNotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Plan not found</h1>
      <p>This plan doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href={plannerRoute()}>Back to Planner</Link>
    </div>
  );
}
