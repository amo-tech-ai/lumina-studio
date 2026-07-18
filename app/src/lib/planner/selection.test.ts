import { describe, expect, it } from "vitest";

import { parseSelectionParam, serializeSelectionParam } from "./selection";

const TASK_ID = "11111111-1111-1111-1111-111111111111";
const PHASE_ID = "22222222-2222-2222-2222-222222222222";
const MEMBER_ID = "33333333-3333-3333-3333-333333333333";

describe("parseSelectionParam / serializeSelectionParam round-trip", () => {
  it("round-trips a valid task selection", () => {
    const selection = parseSelectionParam(`task:${TASK_ID}`);
    expect(selection).toEqual({ type: "task", id: TASK_ID });
    expect(serializeSelectionParam(selection)).toBe(`task:${TASK_ID}`);
  });

  it("round-trips a valid phase selection", () => {
    const selection = parseSelectionParam(`phase:${PHASE_ID}`);
    expect(selection).toEqual({ type: "phase", id: PHASE_ID });
    expect(serializeSelectionParam(selection)).toBe(`phase:${PHASE_ID}`);
  });

  it("round-trips a valid member selection", () => {
    const selection = parseSelectionParam(`member:${MEMBER_ID}`);
    expect(selection).toEqual({ type: "member", id: MEMBER_ID });
    expect(serializeSelectionParam(selection)).toBe(`member:${MEMBER_ID}`);
  });
});

describe("parseSelectionParam — falls back to null (never crashes)", () => {
  it("rejects an unknown type", () => {
    expect(parseSelectionParam(`brand:${TASK_ID}`)).toBeNull();
  });

  it("rejects a uuid that's too short", () => {
    expect(parseSelectionParam("task:1111-1111-1111-1111-111111111111")).toBeNull();
  });

  it("rejects a uuid with invalid characters", () => {
    expect(parseSelectionParam("task:zzzzzzzz-1111-1111-1111-111111111111")).toBeNull();
  });

  it("rejects a uuid missing dashes", () => {
    expect(parseSelectionParam("task:111111111111111111111111111111111")).toBeNull();
  });

  it("rejects a value with no colon at all", () => {
    expect(parseSelectionParam(`task${TASK_ID}`)).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(parseSelectionParam("")).toBeNull();
  });

  it("returns null for a null input", () => {
    expect(parseSelectionParam(null)).toBeNull();
  });

  it("returns null for an undefined input", () => {
    expect(parseSelectionParam(undefined)).toBeNull();
  });

  it("splits on the FIRST colon only, so a value with extra colons fails uuid validation instead of re-splitting", () => {
    // `task:abc:def` — everything after the first colon (`abc:def`) is
    // treated as the id and fails UUID_RE, rather than being re-split on
    // the second colon. This matters because a real uuid never contains a
    // colon, so this rule can only ever reject malformed input, never a
    // legitimate value.
    expect(parseSelectionParam("task:abc:def")).toBeNull();
    expect(parseSelectionParam(`task:${TASK_ID}:extra`)).toBeNull();
  });
});

describe("serializeSelectionParam", () => {
  it("returns null for a null selection", () => {
    expect(serializeSelectionParam(null)).toBeNull();
  });
});
