import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import "@copilotkit/react-core/v2/styles.css";

// (operator) group layout — the CopilotKit + OperatorPanel shell, scoped to /app/*.
// Marketing routes live in the (marketing) group and never mount this, so they get
// no CopilotSidebar / ThreadsDrawer / agent UI.
export default function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <OperatorPanel>{children}</OperatorPanel>
    </CopilotKit>
  );
}
