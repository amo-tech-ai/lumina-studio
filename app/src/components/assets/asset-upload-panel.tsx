"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetInfo, CloudinaryUploadWidgetOptions } from "next-cloudinary";

import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY } from "@/lib/cloudinary/url";
import { pollUntilMirrorTerminal } from "@/lib/assets/upload-poll";

import styles from "./assets-workspace.module.css";

export type UploadBrandOption = { id: string; name: string };

export type QueueItemState =
  | "uploading"
  | "processing"
  | "ready"
  | "client_failed"
  | "processing_failed"
  | "timed_out"
  | "cancelled"
  | "unknown_after_refresh";

export type UploadQueueItem = {
  id: string;
  filename: string;
  cloudinary_asset_id: string | null;
  public_id: string | null;
  state: QueueItemState;
  message?: string;
};

const STORAGE_KEY = "ipix-asset-upload-queue-v1";

/** Client-side queue only (IPI-433) — Cloudinary + webhook + Supabase mirror are source of truth. */
function readPersistedQueue(): UploadQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UploadQueueItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      // Upload still in widget flight — no cloudinary_asset_id to reconcile.
      if (item.state === "uploading") {
        return {
          ...item,
          state: "unknown_after_refresh" as const,
          message: "Upload status unknown — check Asset Library",
        };
      }
      // Mirror poll can resume when we retained the immutable provider id.
      if (item.state === "processing" && item.cloudinary_asset_id) {
        return { ...item, message: "Resuming status check…" };
      }
      if (item.state === "processing") {
        return {
          ...item,
          state: "unknown_after_refresh" as const,
          message: "Upload status unknown — check Asset Library",
        };
      }
      return item;
    });
  } catch {
    return [];
  }
}

function widgetInfo(info: CloudinaryUploadWidgetInfo | string | undefined) {
  if (!info || typeof info === "string") return null;
  return info;
}

type Props = {
  brands: UploadBrandOption[];
  defaultBrandId?: string;
  onReady?: () => void;
};

export function AssetUploadPanel({ brands = [], defaultBrandId, onReady }: Props) {
  const [brandId, setBrandId] = useState(defaultBrandId ?? brands[0]?.id ?? "");
  const [queue, setQueue] = useState<UploadQueueItem[]>(() => readPersistedQueue());
  const abortByItem = useRef(new Map<string, AbortController>());
  const seenSuccess = useRef(new Set<string>());

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    if (defaultBrandId) setBrandId(defaultBrandId);
  }, [defaultBrandId]);

  const updateItem = useCallback((id: string, patch: Partial<UploadQueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const startPolling = useCallback(
    (itemId: string, cloudinaryAssetId: string) => {
      abortByItem.current.get(itemId)?.abort();
      const controller = new AbortController();
      abortByItem.current.set(itemId, controller);

      updateItem(itemId, { state: "processing", message: "Waiting for Supabase…" });

      void pollUntilMirrorTerminal(cloudinaryAssetId, controller.signal, (response) => {
        if (response.status === "processing" || response.status === "not_found") {
          updateItem(itemId, { state: "processing" });
        }
      })
        .then((result) => {
          abortByItem.current.delete(itemId);
          if (result.outcome === "ready") {
            updateItem(itemId, { state: "ready", message: "Ready in Asset Library" });
            onReady?.();
            return;
          }
          if (result.outcome === "failed") {
            updateItem(itemId, {
              state: "processing_failed",
              message: "Processing failed — retry or check Asset Library",
            });
            return;
          }
          if (result.outcome === "timed_out") {
            updateItem(itemId, {
              state: "timed_out",
              message: "Processing is taking longer than expected. Check the Asset Library.",
            });
            return;
          }
          if (result.outcome === "aborted") {
            updateItem(itemId, { state: "cancelled", message: "Upload cancelled" });
          }
        })
        .catch(() => {
          abortByItem.current.delete(itemId);
          updateItem(itemId, {
            state: "processing_failed",
            message: "Could not confirm upload status — check the Asset Library or retry",
          });
        });
    },
    [onReady, updateItem],
  );

  useEffect(() => {
    for (const item of queue) {
      if (item.state === "processing" && item.cloudinary_asset_id) {
        startPolling(item.id, item.cloudinary_asset_id);
      }
    }
    // Resume persisted processing rows once on mount (sessionStorage hydration).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only resume
  }, []);

  const onUploadSuccess = useCallback(
    (itemId: string, filename: string, info: CloudinaryUploadWidgetInfo | string | undefined) => {
      const parsed = widgetInfo(info);
      const dedupeKey = parsed?.asset_id ?? parsed?.public_id ?? itemId;
      if (seenSuccess.current.has(dedupeKey)) return;
      seenSuccess.current.add(dedupeKey);

      const cloudinaryAssetId = parsed?.asset_id ?? null;
      if (!cloudinaryAssetId) {
        updateItem(itemId, {
          state: "client_failed",
          message: "Missing cloudinary asset id from upload response",
        });
        return;
      }

      updateItem(itemId, {
        filename: parsed?.original_filename ?? filename,
        cloudinary_asset_id: cloudinaryAssetId,
        public_id: parsed?.public_id ?? null,
        state: "processing",
      });
      startPolling(itemId, cloudinaryAssetId);
    },
    [startPolling, updateItem],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const onSimulate = (event: Event) => {
      const assetId =
        (event as CustomEvent<{ assetId?: string }>).detail?.assetId ??
        "abcdef0123456789abcdef0123456789";
      const itemId = crypto.randomUUID();
      const info = {
        asset_id: assetId,
        public_id: "ipix/e2e/fixture",
        original_filename: "e2e-fixture.jpg",
        version: 1,
      } as CloudinaryUploadWidgetInfo;
      setQueue((prev) => [
        {
          id: itemId,
          filename: info.original_filename ?? "e2e-fixture.jpg",
          cloudinary_asset_id: null,
          public_id: null,
          state: "uploading",
        },
        ...prev,
      ]);
      onUploadSuccess(itemId, info.original_filename ?? "e2e-fixture.jpg", info);
    };

    window.addEventListener("ipi433-e2e-simulate", onSimulate);
    return () => window.removeEventListener("ipi433-e2e-simulate", onSimulate);
  }, [onUploadSuccess]);

  const cancelItem = useCallback(
    (itemId: string) => {
      abortByItem.current.get(itemId)?.abort();
      abortByItem.current.delete(itemId);
      updateItem(itemId, { state: "cancelled", message: "Upload cancelled" });
    },
    [updateItem],
  );

  const retryItem = useCallback(
    (itemId: string) => {
      abortByItem.current.get(itemId)?.abort();
      abortByItem.current.delete(itemId);
      updateItem(itemId, {
        state: "client_failed",
        message: "Select Upload again to retry with a new signature",
      });
    },
    [updateItem],
  );

  const removeItem = useCallback((itemId: string) => {
    abortByItem.current.get(itemId)?.abort();
    abortByItem.current.delete(itemId);
    setQueue((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  if (brands.length === 0) {
    return (
      <p className={styles.uploadHint}>Create a brand before uploading assets.</p>
    );
  }

  const uploadOptions: CloudinaryUploadWidgetOptions = {
    sources: ["local"],
    multiple: true,
    maxFiles: 10,
    maxFileSize: 50_000_000,
    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "mp4", "mov"],
    resourceType: "auto",
    context: { brand_id: brandId },
    folder: `ipix/brands/${brandId}/products`,
  };

  return (
    <section className={styles.uploadPanel} aria-label="Upload assets">
      <div className={styles.uploadControls}>
        <label className={styles.filterSelectLabel}>
          <span className="sr-only">Upload to brand</span>
          <select
            className={styles.filterSelect}
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <CldUploadWidget
          config={{ cloud: { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY } }}
          uploadPreset={CLOUDINARY_UPLOAD_PRESET}
          signatureEndpoint="/api/assets/cloudinary-sign"
          options={uploadOptions}
          onSuccess={(result, { widget: _widget }) => {
            const itemId = crypto.randomUUID();
            const info = typeof result.info === "string" ? undefined : result.info;
            const filename =
              info?.original_filename ?? info?.public_id ?? "upload";
            setQueue((prev) => [
              {
                id: itemId,
                filename,
                cloudinary_asset_id: null,
                public_id: null,
                state: "uploading",
              },
              ...prev,
            ]);
            onUploadSuccess(itemId, filename, info);
          }}
          onQueuesEnd={(_result, { widget }) => {
            widget.close();
          }}
          onError={() => {
            const itemId = crypto.randomUUID();
            setQueue((prev) => [
              {
                id: itemId,
                filename: "upload",
                cloudinary_asset_id: null,
                public_id: null,
                state: "client_failed",
                message: "Upload failed in widget",
              },
              ...prev,
            ]);
          }}
        >
          {({ open }) => (
            <button type="button" className={styles.primaryBtn} onClick={() => open()}>
              Upload
            </button>
          )}
        </CldUploadWidget>
      </div>

      {queue.length > 0 ? (
        <ul className={styles.uploadQueue} data-testid="upload-queue">
          {queue.map((item) => (
            <li key={item.id} className={styles.uploadQueueItem}>
              <div>
                <strong>{item.filename}</strong>
                <span className={styles.uploadState}> — {item.state.replaceAll("_", " ")}</span>
                {item.message ? <p className={styles.uploadMessage}>{item.message}</p> : null}
              </div>
              <div className={styles.uploadActions}>
                {(item.state === "processing" || item.state === "uploading") && (
                  <button
                    type="button"
                    className={styles.clearFilterBtn}
                    data-testid="upload-cancel"
                    onClick={() => cancelItem(item.id)}
                  >
                    Cancel
                  </button>
                )}
                {(item.state === "client_failed" ||
                  item.state === "processing_failed" ||
                  item.state === "timed_out") && (
                  <button
                    type="button"
                    className={styles.clearFilterBtn}
                    data-testid="upload-retry"
                    onClick={() => retryItem(item.id)}
                  >
                    Retry
                  </button>
                )}
                {(item.state === "ready" ||
                  item.state === "cancelled" ||
                  item.state === "unknown_after_refresh") && (
                  <button type="button" className={styles.clearFilterBtn} onClick={() => removeItem(item.id)}>
                    Dismiss
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
