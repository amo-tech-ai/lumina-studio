import { describe, expect, it } from "vitest";
import {
  DAM_ROOT,
  DELIVERY_TYPE,
  ENVIRONMENTS,
  METADATA_SCHEMA_VERSION,
  WORK_TYPES,
} from "./taxonomy";
import {
  DAM_ROOT as AUDIT_DAM_ROOT,
  DELIVERY_TYPE as AUDIT_DELIVERY_TYPE,
  ENVIRONMENTS as AUDIT_ENVIRONMENTS,
  METADATA_SCHEMA_VERSION as AUDIT_METADATA_SCHEMA_VERSION,
  WORK_TYPES as AUDIT_WORK_TYPES,
} from "../../../../scripts/lib/cloudinary-dry-run-audit-lib.mjs";

// scripts/cloudinary-dry-run-audit.mjs runs outside the Next.js build (plain
// Node, no "@/" alias), so it keeps its own copy of the taxonomy contract in
// scripts/lib/cloudinary-dry-run-audit-lib.mjs. This test is the tripwire
// that catches the two copies drifting apart.
describe("dry-run audit taxonomy parity", () => {
  it("DAM_ROOT matches", () => {
    expect(AUDIT_DAM_ROOT).toBe(DAM_ROOT);
  });

  it("ENVIRONMENTS matches", () => {
    expect(AUDIT_ENVIRONMENTS).toEqual([...ENVIRONMENTS]);
  });

  it("WORK_TYPES matches", () => {
    expect(AUDIT_WORK_TYPES).toEqual([...WORK_TYPES]);
  });

  it("DELIVERY_TYPE matches", () => {
    expect(AUDIT_DELIVERY_TYPE).toBe(DELIVERY_TYPE);
  });

  it("METADATA_SCHEMA_VERSION matches", () => {
    expect(AUDIT_METADATA_SCHEMA_VERSION).toBe(METADATA_SCHEMA_VERSION);
  });
});
