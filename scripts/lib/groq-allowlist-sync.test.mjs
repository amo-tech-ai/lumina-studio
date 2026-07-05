import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterInformationalExtras,
  syncAllowlist,
} from "./groq-allowlist-sync.mjs";

describe("syncAllowlist", () => {
  it("flags allowlist IDs missing on Groq", () => {
    const local = new Set(["a", "b"]);
    const remote = new Set(["a"]);
    const { missingOnGroq, extraOnGroq } = syncAllowlist(local, remote);
    assert.deepEqual(missingOnGroq, ["b"]);
    assert.deepEqual(extraOnGroq, []);
  });

  it("flags remote IDs not in allowlist", () => {
    const local = new Set(["a"]);
    const remote = new Set(["a", "c"]);
    const { missingOnGroq, extraOnGroq } = syncAllowlist(local, remote);
    assert.deepEqual(missingOnGroq, []);
    assert.deepEqual(extraOnGroq, ["c"]);
  });

  it("filters whisper/playai from informational extras", () => {
    const extras = ["custom-model", "whisper-large-v3", "playai-tts-v1"];
    assert.deepEqual(filterInformationalExtras(extras), ["custom-model"]);
  });
});
