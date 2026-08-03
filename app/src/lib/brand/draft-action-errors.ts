/**
 * Safe client-facing errors for Brand DNA promote / discard.
 * Full Supabase payloads stay server-side via logDraftActionError.
 */

export type DraftActionCode = "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "UNKNOWN";

export type DraftActionResult =
  | {
      ok: true;
      status: "completed" | "already_completed";
    }
  | {
      ok: false;
      code: DraftActionCode;
      error: string;
    };

export type DraftActionName = "promote" | "discard";

export const DRAFT_ACTION_MESSAGES = {
  NOT_FOUND: "This item no longer exists.",
  FORBIDDEN: "You do not have permission to perform this action.",
  CONFLICT: "This action has already been completed.",
  UNKNOWN: "We could not complete this action. Please try again.",
} as const;

/** Domain messages that are already client-safe (no schema / SQL). */
export const DRAFT_ACTION_DOMAIN = {
  NO_DRAFT: "No draft to apply",
  INVALID_DNA: "Brand DNA is incomplete or invalid",
  /** Kept for process-draft-approval soft-success on concurrent CAS. */
  NOT_DRAFT_READY: "Brand is not in draft_ready state",
} as const;

export type PgErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

/** Server-only — never forward these fields to the client. */
export function logDraftActionError(
  action: DraftActionName,
  brandId: string,
  error: PgErrorLike,
): void {
  console.error(`[draft-action:${action}]`, {
    brandId,
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

export function failure(
  code: DraftActionCode,
  error: string = DRAFT_ACTION_MESSAGES[code],
): Extract<DraftActionResult, { ok: false }> {
  return { ok: false, code, error };
}

/**
 * Map a PostgREST/Postgres error to a safe client failure (or signal unique
 * violation for the caller to resolve as idempotent success).
 */
export function mapDraftActionDbError(
  action: DraftActionName,
  brandId: string,
  error: PgErrorLike,
): Extract<DraftActionResult, { ok: false }> | { uniqueViolation: true } {
  logDraftActionError(action, brandId, error);
  const code = error.code ?? "";
  if (code === "P0002") return failure("NOT_FOUND");
  if (code === "42501") return failure("FORBIDDEN");
  if (code === "23505") return { uniqueViolation: true };
  return failure("UNKNOWN");
}

export function isUniqueViolationSignal(
  value: unknown,
): value is { uniqueViolation: true } {
  return (
    !!value &&
    typeof value === "object" &&
    "uniqueViolation" in value &&
    (value as { uniqueViolation: unknown }).uniqueViolation === true
  );
}
