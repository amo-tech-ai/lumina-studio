/** Bounded polling schedule for IPI-433 — total window 60s (override for E2E). */
const E2E_POLL_MAX = Number(process.env.NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS);
export const UPLOAD_POLL_MAX_MS =
  Number.isFinite(E2E_POLL_MAX) && E2E_POLL_MAX > 0 ? E2E_POLL_MAX : 60_000;

export function uploadPollDelayMs(elapsedMs: number): number {
  if (Number.isFinite(E2E_POLL_MAX) && E2E_POLL_MAX > 0) return 200;
  if (elapsedMs < 10_000) return 1_000;
  if (elapsedMs < 30_000) return 2_000;
  return 5_000;
}

export type MirrorPollStatus = "ready" | "processing" | "failed" | "archived" | "not_found";

export type MirrorPollResponse = {
  status: MirrorPollStatus;
  cloudinary_asset_id: string | null;
  version: number | null;
  public_id: string | null;
};

export async function fetchMirrorStatus(
  cloudinaryAssetId: string,
  signal?: AbortSignal,
): Promise<MirrorPollResponse> {
  const params = new URLSearchParams({ cloudinaryAssetId });
  const res = await fetch(`/api/assets/status?${params}`, { signal, credentials: "include" });
  if (res.status === 404) {
    return {
      status: "not_found",
      cloudinary_asset_id: cloudinaryAssetId,
      version: null,
      public_id: null,
    };
  }
  if (!res.ok) {
    throw new Error(`status poll failed: HTTP ${res.status}`);
  }
  return (await res.json()) as MirrorPollResponse;
}

/** Poll until ready/failed/archived, timeout, or abort. */
export async function pollUntilMirrorTerminal(
  cloudinaryAssetId: string,
  signal: AbortSignal,
  onTick?: (response: MirrorPollResponse) => void,
): Promise<
  | { outcome: "ready"; response: MirrorPollResponse }
  | { outcome: "failed"; response: MirrorPollResponse }
  | { outcome: "timed_out"; last: MirrorPollResponse | null }
  | { outcome: "aborted" }
> {
  const started = Date.now();
  let last: MirrorPollResponse | null = null;

  while (Date.now() - started < UPLOAD_POLL_MAX_MS) {
    if (signal.aborted) return { outcome: "aborted" };

    last = await fetchMirrorStatus(cloudinaryAssetId, signal);
    onTick?.(last);

    if (last.status === "ready") return { outcome: "ready", response: last };
    if (last.status === "failed") return { outcome: "failed", response: last };
    if (last.status === "archived") return { outcome: "failed", response: last };

    const elapsed = Date.now() - started;
    const delay = uploadPollDelayMs(elapsed);
    const remaining = UPLOAD_POLL_MAX_MS - elapsed;
    if (remaining <= 0) break;

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, Math.min(delay, remaining));
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    }).catch((e) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    });

    if (signal.aborted) return { outcome: "aborted" };
  }

  return { outcome: "timed_out", last };
}
