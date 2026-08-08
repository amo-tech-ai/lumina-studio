import { bench, describe } from "vitest";
import {
  filterInformationalExtras,
  syncAllowlist,
} from "../scripts/lib/groq-allowlist-sync.mjs";

// Realistic-ish model catalogs: a local allowlist plus a larger remote catalog
// with informational extras (whisper/playai) mixed in.
const localIds = new Set(
  Array.from({ length: 60 }, (_, i) => `model-${i}`),
);
const remoteIds = new Set([
  ...Array.from({ length: 55 }, (_, i) => `model-${i}`),
  ...Array.from({ length: 20 }, (_, i) => `extra-${i}`),
  "whisper-large-v3",
  "whisper-large-v3-turbo",
  "playai-tts-v1",
]);

describe("groq allowlist sync", () => {
  bench("syncAllowlist over catalog", () => {
    syncAllowlist(localIds, remoteIds);
  });

  bench("filterInformationalExtras", () => {
    const { extraOnGroq } = syncAllowlist(localIds, remoteIds);
    filterInformationalExtras(extraOnGroq);
  });
});
