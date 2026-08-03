import { AuthenticatedCopilotProvider } from "@/components/copilot/authenticated-copilot-provider";

// ponytail: prevent static prerendering — CopilotKit hooks in children
// throw without a provider at build time.
export const dynamic = "force-dynamic";

// IPI-927 — session-aware client provider mounts CopilotKit only after a real
// Supabase access_token is ready (Bearer on /api/copilotkit/info). Auth fail-closed
// stays in the runtime route; middleware alone does not stop early /info 401 spam
// when OPERATOR_AUTH_ENABLED=false locally.
const OperatorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <AuthenticatedCopilotProvider>{children}</AuthenticatedCopilotProvider>
  );
};

export default OperatorLayout;
