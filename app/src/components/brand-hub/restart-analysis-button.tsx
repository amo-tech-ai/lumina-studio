"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * IPI-918 · ONB2-INT-001e — Brand Hub recovery control for a failed analysis.
 * Calls the IPI-905 route (POST /api/brands/[id]/restart-analysis), which is
 * stage-aware: it reuses a live crawl, restarts a failed one, or re-runs Brand
 * Intelligence only. The operator never re-enters onboarding, and the browser
 * never writes intake_status itself.
 */

/**
 * Operator-safe copy per typed API code. Deliberately not the server `message`:
 * a non-typed failure (HTML 500, proxy error) must never leak Firecrawl,
 * Supabase, or Gemini internals into the banner.
 */
const RESTART_ERROR_COPY: Record<string, string> = {
  unauthorized: "You need owner or editor access to restart this analysis.",
  not_found: "This brand no longer exists — refresh the page.",
  invalid_state: "This brand isn't in a failed state, so there's nothing to restart.",
  invalid_url: "Add a valid website URL (https://…) to this brand, then restart.",
  already_running: "Analysis is already running — watch the progress above.",
  provider_unavailable: "We couldn't restart analysis right now. Try again in a minute.",
};

const RESTART_ERROR_FALLBACK =
  "We couldn't restart analysis right now. Try again in a minute.";

function errorCopyFor(payload: unknown): string {
  const code =
    payload && typeof payload === "object"
      ? (payload as { code?: unknown }).code
      : undefined;
  // Guard with hasOwnProperty: a plain object literal still inherits
  // `constructor`/`hasOwnProperty` from Object.prototype, so an unguarded
  // `RESTART_ERROR_COPY[code]` would return a function instead of falling
  // back to copy if `code` were ever one of those inherited names.
  const hasCode =
    typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(RESTART_ERROR_COPY, code);
  return hasCode ? RESTART_ERROR_COPY[code as string] : RESTART_ERROR_FALLBACK;
}

export type RestartAnalysisButtonProps = {
  brandId: string;
  /**
   * Called after a successful restart POST resolves. Brand Hub (SSR parent)
   * relies on router.refresh() to replace this component; onboarding callers
   * (pure client) need to reset their own failed phase since router.refresh()
   * does not unmount them. Optional so existing Brand Hub callers are unaffected.
   */
  onRestart?: () => void;
  /**
   * Optional live-region role for the error text. Brand Hub nests this button
   * inside an existing role="alert" banner; onboarding renders it as a sibling,
   * so the caller can opt into announcement semantics here.
   */
  errorRole?: "alert" | "status";
};

export const RestartAnalysisButton = ({ brandId, onRestart, errorRole }: RestartAnalysisButtonProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref, not just `disabled={pending}`: two clicks dispatched inside one React
  // batch would both read the pre-render `pending === false`.
  const inFlight = useRef(false);

  const handleClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/restart-analysis`, {
        method: "POST",
        // Explicit even though same-origin is the default: the route authenticates
        // from the Supabase auth cookie, so dropping credentials returns 401.
        credentials: "same-origin",
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // Non-JSON body (gateway/HTML error) — falls through to generic copy.
      }

      const ok =
        response.ok &&
        payload != null &&
        typeof payload === "object" &&
        (payload as { ok?: unknown }).ok === true;

      if (!ok) {
        setError(errorCopyFor(payload));
        inFlight.current = false;
        setPending(false);
        return;
      }

      // Realtime already carries live progress; refresh so the server-rendered
      // page (and this banner's initialStatus) reflect the new intake_status.
      // Deliberately do NOT clear inFlight/pending here: router.refresh() is
      // fire-and-forget (no completion promise), so clearing the lock now would
      // re-enable the button for a window where a second click could fire another
      // POST before the refreshed page replaces this failed-state banner.
      router.refresh();
      onRestart?.();
    } catch {
      setError(RESTART_ERROR_FALLBACK);
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleClick}
        className="rounded-full border-[#FECACA] bg-white font-sans text-xs text-[#991B1B] hover:bg-[#FEF2F2]"
      >
        <RotateCcw size={14} aria-hidden />
        {pending ? "Restarting…" : "Restart analysis"}
      </Button>
      {error && (
        <p
          className="font-sans text-[11px] text-[#991B1B]"
          {...(errorRole ? { role: errorRole, "aria-live": errorRole === "alert" ? "assertive" : "polite" } : {})}
        >
          {error}
        </p>
      )}
    </div>
  );
};
