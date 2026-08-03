"use client";

/**
 * IPI-927 · COPILOT-AUTH-LOCAL-001 — session-aware CopilotKit mount.
 *
 * Operator layout cannot read rotating browser JWTs (Server Component).
 * Wait for Supabase session hydration, then mount CopilotKit with Bearer.
 * No token → no /api/copilotkit/info (Option A: real session for shell + AI).
 *
 * Fail-closed runtime stays in route.ts (IPI-915 / IPI-846). Do not log tokens.
 */

import { CopilotKit } from "@copilotkit/react-core/v2";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import { ActiveBrandProvider } from "@/context/active-brand-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import "@copilotkit/react-core/v2/styles.css";

const AUTH_HYDRATE_MS = 2500;

type AuthPhase = "loading" | "authed" | "signed-out";

export function AuthenticatedCopilotProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const supabase = createSupabaseBrowserClient();

    const apply = (token: string | null) => {
      if (cancelled) return;
      settled = true;
      if (token) {
        setAccessToken(token);
        setPhase("authed");
      } else {
        setAccessToken(null);
        setPhase("signed-out");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const token = session?.access_token ?? null;
      // Null INITIAL_SESSION is not decisive — cookies may still hydrate (OAuth).
      if (event === "INITIAL_SESSION" && !token) return;
      if (event === "SIGNED_OUT") {
        apply(null);
        return;
      }
      if (token) {
        apply(token);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || settled) return;
      if (session?.access_token) apply(session.access_token);
    });

    const timer = setTimeout(() => {
      if (cancelled || settled) return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || settled) return;
        apply(session?.access_token ?? null);
      });
    }, AUTH_HYDRATE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // Stable headers object — Authorization only via prop (not also setHeaders).
  // Mount is gated on accessToken so the first /info already carries Bearer.
  const headers = useMemo(
    () =>
      accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    [accessToken],
  );

  if (phase === "loading") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading operator session"
        data-testid="copilot-auth-loading"
        style={{ minHeight: "100dvh" }}
      />
    );
  }

  if (phase === "signed-out" || !accessToken || !headers) {
    return (
      <div
        data-testid="copilot-auth-signed-out"
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "var(--font-sans, Outfit, system-ui, sans-serif)",
        }}
      >
        <p style={{ margin: 0 }}>
          Sign in to use the operator workspace and AI assistants.
        </p>
        <Link href="/login" style={{ color: "var(--primary, #E87C4D)" }}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      enableInspector={false}
      showDevConsole={false}
      headers={headers}
    >
      <ActiveBrandProvider>
        <OperatorPanel>{children}</OperatorPanel>
      </ActiveBrandProvider>
    </CopilotKit>
  );
}
