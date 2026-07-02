import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import { ActiveBrandProvider } from "@/context/active-brand-context";
import "@copilotkit/react-core/v2/styles.css";

// ponytail: prevent static prerendering — CopilotKit hooks in children
// throw without a provider at build time.
export const dynamic = "force-dynamic";

// Always mount CopilotKit for operator routes — pages use CopilotKit hooks (useAgentContext,
// useFrontendTool) and will crash without the provider. Auth is handled by middleware (see
// app/middleware.ts → src/proxy.ts), not by conditionally mounting providers.
const OperatorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <ActiveBrandProvider>
        <OperatorPanel>{children}</OperatorPanel>
      </ActiveBrandProvider>
    </CopilotKit>
  );
};

export default OperatorLayout;
