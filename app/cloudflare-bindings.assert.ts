/// <reference types="@cloudflare/workers-types" />

declare const env: CloudflareEnv;

const selfReference: Fetcher = env.WORKER_SELF_REFERENCE!;
const images: ImagesBinding = env.IMAGES!;

void selfReference;
void images;
