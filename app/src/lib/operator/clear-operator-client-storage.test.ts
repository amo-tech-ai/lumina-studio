import { describe, expect, it } from "vitest";

import {
  clearOperatorClientStorage,
  OPERATOR_CLIENT_STORAGE_PREFIXES,
} from "./clear-operator-client-storage";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("clearOperatorClientStorage — IPI-725", () => {
  it("removes ipix:copilot: prefixed keys from local and session", () => {
    const local = memoryStorage({
      "ipix:copilot:thread:v1:u1:default:host": "t-1",
      "ipix:copilot:other": "x",
      ipix_anon_id: "keep-me",
      unrelated: "keep",
    });
    const session = memoryStorage({
      "ipix:copilot:thread:v1:u1:planner:host": "t-2",
      asset_queue: "keep",
    });

    const removed = clearOperatorClientStorage({ local, session });

    expect(removed.local.sort()).toEqual([
      "ipix:copilot:other",
      "ipix:copilot:thread:v1:u1:default:host",
    ]);
    expect(removed.session).toEqual(["ipix:copilot:thread:v1:u1:planner:host"]);
    expect(local.getItem("ipix_anon_id")).toBe("keep-me");
    expect(local.getItem("unrelated")).toBe("keep");
    expect(session.getItem("asset_queue")).toBe("keep");
  });

  it("never removes ipix_anon_id even if it matched a prefix by mistake", () => {
    const local = memoryStorage({ ipix_anon_id: "lead" });
    clearOperatorClientStorage({ local, session: memoryStorage() });
    expect(local.getItem("ipix_anon_id")).toBe("lead");
  });

  it("does not call Storage.clear — only removeItem on allowlisted keys", () => {
    const local = memoryStorage({
      "ipix:copilot:thread:v1:a:b:c": "1",
      keep: "2",
    });
    const clear = local.clear.bind(local);
    let clearCalls = 0;
    local.clear = () => {
      clearCalls += 1;
      clear();
    };

    clearOperatorClientStorage({ local, session: memoryStorage() });

    expect(clearCalls).toBe(0);
    expect(local.getItem("keep")).toBe("2");
    expect(local.getItem("ipix:copilot:thread:v1:a:b:c")).toBeNull();
  });

  it("exports the IPI-634 thread prefix for shared use", () => {
    expect(OPERATOR_CLIENT_STORAGE_PREFIXES).toContain("ipix:copilot:");
  });

  it("no-ops when storages are null", () => {
    expect(clearOperatorClientStorage({ local: null, session: null })).toEqual({
      local: [],
      session: [],
    });
  });
});
