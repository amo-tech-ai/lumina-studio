import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import { ActiveBrandProvider } from "@/context/active-brand-context";
import "@copilotkit/react-core/v2/styles.css";

// ponytail: prevent static prerendering — CopilotKit hooks in children
// throw without a provider at build time.
export const dynamic = "force-dynamic";

// Always mount CopilotKit for operator routes — pages use CopilotKit hooks (useAgentContext,
// useFrontendTool) and will crash without the provider. Auth is handled by middleware (see
// app/middleware.ts → src/middleware.ts), not by conditionally mounting providers.
const OperatorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    // showDevConsole={false}: official CopilotKit disable (IPI-849). Default is
    // already false, but be explicit — props alone do not drop the package from
    // the Worker graph (CopilotKitInspector still has a static dynamic-import
    // string); CF builds alias @copilotkit/web-inspector via IPIX_CF_BUNDLE_STUBS.
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      showDevConsole={false}
    >
      <ActiveBrandProvider>
        <OperatorPanel>{children}</OperatorPanel>
      </ActiveBrandProvider>
    </CopilotKit>
  );
};

export default OperatorLayout;
