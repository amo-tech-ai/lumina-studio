"use client";

/**
 * IPI-927 · COPILOT-AUTH-LOCAL-001 — session-aware CopilotKit mount.
 * IPI-934 · COPILOT-AUTH-LOCAL-002 — hydrate error UI + late-session recovery.
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

/** Exported for focused hydrate-race tests (IPI-934). */
export const AUTH_HYDRATE_MS = 2500;

type AuthPhase = "loading" | "authed" | "signed-out" | "error";

const shellStyle = {
  minHeight: "100dvh",
  display: "grid",
  placeContent: "center",
  gap: "0.75rem",
  padding: "1.5rem",
  textAlign: "center",
  fontFamily: "var(--font-sans, Outfit, system-ui, sans-serif)",
} as const;

export function AuthenticatedCopilotProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hydrateAttempt, setHydrateAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let hasToken = false;

    const applyToken = (token: string) => {
      if (cancelled) return;
      hasToken = true;
      setAccessToken(token);
      setPhase("authed");
    };

    const applySignedOut = () => {
      if (cancelled) return;
      hasToken = false;
      setAccessToken(null);
      setPhase("signed-out");
    };

    const failHydrate = () => {
      if (cancelled || hasToken) return;
      setAccessToken(null);
      setPhase("error");
    };

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      failHydrate();
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const token = session?.access_token ?? null;
      // Null INITIAL_SESSION is not decisive — cookies may still hydrate (OAuth).
      if (event === "INITIAL_SESSION" && !token) return;
      if (event === "SIGNED_OUT") {
        applySignedOut();
        return;
      }
      if (token) {
        applyToken(token);
      }
    });

    const readSession = () =>
      supabase.auth.getSession().then(
        ({ data: { session } }) => {
          if (cancelled) return;
          const token = session?.access_token ?? null;
          // Late token may arrive after a timeout settled signed-out — still promote.
          if (token) {
            applyToken(token);
            return;
          }
          // Null without a prior token: leave loading for timer / SIGNED_OUT.
        },
        () => {
          failHydrate();
        },
      );

    void readSession();

    const timer = setTimeout(() => {
      // Never clear an already-applied access token.
      if (cancelled || hasToken) return;
      void supabase.auth.getSession().then(
        ({ data: { session } }) => {
          if (cancelled || hasToken) return;
          const token = session?.access_token ?? null;
          if (token) {
            applyToken(token);
          } else if (!hasToken) {
            // Soft settle — a later valid getSession / auth event may still promote.
            applySignedOut();
          }
        },
        () => {
          failHydrate();
        },
      );
    }, AUTH_HYDRATE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [hydrateAttempt]);

  const headers = useMemo(
    () =>
      accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    [accessToken],
  );

  const retryHydrate = () => {
    setAccessToken(null);
    setPhase("loading");
    setHydrateAttempt((n) => n + 1);
  };

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

  if (phase === "error") {
    return (
      <div data-testid="copilot-auth-error" style={shellStyle}>
        <p style={{ margin: 0 }}>
          We couldn&apos;t load your session. Retry or sign in again.
        </p>
        <button
          type="button"
          data-testid="copilot-auth-retry"
          onClick={retryHydrate}
          style={{
            cursor: "pointer",
            border: "1px solid var(--primary, #E87C4D)",
            background: "transparent",
            color: "var(--primary, #E87C4D)",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontFamily: "inherit",
          }}
        >
          Retry
        </button>
        <Link href="/login" style={{ color: "var(--primary, #E87C4D)" }}>
          Sign in
        </Link>
      </div>
    );
  }

  if (phase === "signed-out" || !accessToken || !headers) {
    return (
      <div data-testid="copilot-auth-signed-out" style={shellStyle}>
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
