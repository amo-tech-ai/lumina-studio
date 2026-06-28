import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "@copilotkit/react-core/v2/styles.css";

// ponytail: prevent static prerendering — auth check requires a live Supabase
// connection; CopilotKit hooks in children throw without a provider at build time.
export const dynamic = "force-dynamic";

// Only mount CopilotKit for authenticated users — prevents 401 noise on /api/copilotkit/info
// when unauthenticated users reach /app/* before the auth gate redirects them.
const OperatorLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  let authenticated = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    authenticated = Boolean(user);
  } catch {
    // Supabase not configured — treat as unauthenticated, page will redirect
  }

  if (!authenticated) {
    return children;
  }

  return (
    // Force REST transport so runtime-info + threads both hit the multi-route endpoint.
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <OperatorPanel>{children}</OperatorPanel>
    </CopilotKit>
  );
};

export default OperatorLayout;
