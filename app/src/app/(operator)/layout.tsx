<<<<<<< HEAD
import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import { ActiveBrandProvider } from "@/context/active-brand-context";
import "@copilotkit/react-core/v2/styles.css";
=======
import { AuthenticatedCopilotProvider } from "@/components/copilot/authenticated-copilot-provider";
>>>>>>> origin/main

// ponytail: prevent static prerendering — CopilotKit hooks in children
// throw without a provider at build time.
export const dynamic = "force-dynamic";

<<<<<<< HEAD
// Always mount CopilotKit for operator routes — pages use CopilotKit hooks (useAgentContext,
// useFrontendTool) and will crash without the provider. Auth is handled by middleware (see
// app/middleware.ts → src/middleware.ts), not by conditionally mounting providers.
=======
// IPI-927 — session-aware client provider mounts CopilotKit only after a real
// Supabase access_token is ready (Bearer on /api/copilotkit/info). Auth fail-closed
// stays in the runtime route; middleware alone does not stop early /info 401 spam
// when OPERATOR_AUTH_ENABLED=false locally.
>>>>>>> origin/main
const OperatorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
<<<<<<< HEAD
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    // enableInspector={false} / showDevConsole={false}: official CopilotKit
    // disable (IPI-849), same contract as marketing-chat. Props alone do not
    // drop the package from the Worker graph (CopilotKitInspector still has a
    // static dynamic-import string); CF builds alias @copilotkit/web-inspector
    // via IPIX_CF_BUNDLE_STUBS.
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      enableInspector={false}
      showDevConsole={false}
    >
      <ActiveBrandProvider>
        <OperatorPanel>{children}</OperatorPanel>
      </ActiveBrandProvider>
    </CopilotKit>
=======
    <AuthenticatedCopilotProvider>{children}</AuthenticatedCopilotProvider>
>>>>>>> origin/main
  );
};

export default OperatorLayout;
