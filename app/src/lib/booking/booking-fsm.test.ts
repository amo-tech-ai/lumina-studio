import { describe, expect, it } from "vitest";

import { allowedActions, stepperIndex } from "./booking-fsm";

describe("allowedActions", () => {
  it.each([
    ["requested", "brand", ["approve", "decline", "cancel"]],
    ["requested", "talent", ["decline", "cancel"]],
    ["quoted", "brand", ["approve", "decline", "cancel"]],
    ["quoted", "agency", ["decline", "cancel"]],
    ["approved", "brand", ["confirm", "cancel"]],
    ["approved", "talent", ["cancel"]],
    ["confirmed", "brand", ["cancel"]],
    ["confirmed", "talent", ["cancel"]],
    ["declined", "brand", []],
    ["expired", "brand", []],
    ["cancelled", "brand", []],
  ] as const)("status=%s role=%s -> %o", (status, role, expected) => {
    expect(allowedActions(status, role)).toEqual(expected);
  });
});

describe("stepperIndex", () => {
  it("maps requested/quoted/confirmed directly", () => {
    expect(stepperIndex("requested")).toBe(0);
    expect(stepperIndex("quoted")).toBe(1);
    expect(stepperIndex("confirmed")).toBe(2);
  });

  it("folds approved into the quoted slot", () => {
    expect(stepperIndex("approved")).toBe(1);
  });

  it("falls back to 0 for terminal statuses not on the happy path", () => {
    expect(stepperIndex("declined")).toBe(0);
    expect(stepperIndex("cancelled")).toBe(0);
  });
});
