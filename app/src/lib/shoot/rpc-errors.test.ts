import { describe, expect, it } from "vitest";
import { isRpcNotFoundError } from "./rpc-errors";

describe("isRpcNotFoundError", () => {
  it("returns true for Postgres P0002", () => {
    expect(isRpcNotFoundError({ code: "P0002", message: "anything" })).toBe(true);
  });

  it("ignores not_found substring without P0002", () => {
    expect(isRpcNotFoundError({ code: "XX000", message: "not_found" })).toBe(false);
  });
});
