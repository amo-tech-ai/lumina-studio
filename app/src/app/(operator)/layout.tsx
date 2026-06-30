import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import "@copilotkit/react-core/v2/styles.css";

// ponytail: prevent static prerendering — auth check requires a live Supabase
// connection; CopilotKit hooks in children throw without a provider at build time.
export const dynamic = "force-dynamic";

// Always mount CopilotKit for operator routes — pages use CopilotKit hooks (useAgentContext,
// useFrontendTool) and will crash without the provider. Auth is handled by middleware redirects,
// not by conditionally mounting providers.
const OperatorLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <OperatorPanel>{children}</OperatorPanel>
    </CopilotKit>
  );
};

export default OperatorLayout;
