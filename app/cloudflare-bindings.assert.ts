/// <reference types="@cloudflare/workers-types" />

declare const env: CloudflareEnv;

const selfReference: Fetcher = env.WORKER_SELF_REFERENCE!;
const images: ImagesBinding = env.IMAGES!;
// IPI-707 · CF-SMOKE-001 — Assert Worker version metadata binding exists.
const versionMetadata: WorkerVersionMetadata = env.WORKER_VERSION_METADATA!;

void selfReference;
void images;
void versionMetadata;
