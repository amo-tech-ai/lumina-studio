import { describe, expect, it } from "vitest";

import {
  addPlanDays,
  daysBetween,
  daysToPlanDate,
  endOfWeekSunday,
  formatPlanDateShort,
  isLeapYear,
  isValidPlanDate,
  parsePlanDate,
  planDateToDays,
  planDateToISO,
  startOfWeekMonday,
  utcDayOfWeek,
} from "./planner-date-utils";

describe("parsePlanDate", () => {
  it("accepts valid YYYY-MM-DD values", () => {
    expect(parsePlanDate("2026-03-02")).toEqual({ year: 2026, month: 3, day: 2 });
    expect(parsePlanDate("2026-12-31")).toEqual({ year: 2026, month: 12, day: 31 });
    expect(parsePlanDate("0100-01-01")).toEqual({ year: 100, month: 1, day: 1 });
  });

  it("rejects missing and malformed values", () => {
    expect(parsePlanDate(null)).toBeNull();
    expect(parsePlanDate(undefined)).toBeNull();
    expect(parsePlanDate("")).toBeNull();
    expect(parsePlanDate("2026-3-2")).toBeNull();
    expect(parsePlanDate("2026/03/02")).toBeNull();
    expect(parsePlanDate("2026-03-02T00:00:00Z")).toBeNull();
    expect(parsePlanDate("Mar 2 2026")).toBeNull();
    expect(parsePlanDate("2026-03-")).toBeNull();
    expect(parsePlanDate(123 as unknown as string)).toBeNull();
    // JS Date years 0–99 would map to 1900–1999 — rejected for round-trip safety.
    expect(parsePlanDate("0001-01-01")).toBeNull();
  });

  it("rejects impossible calendar dates", () => {
    expect(parsePlanDate("2026-02-31")).toBeNull();
    expect(parsePlanDate("2026-04-31")).toBeNull();
    expect(parsePlanDate("2026-13-01")).toBeNull();
    expect(parsePlanDate("2026-00-10")).toBeNull();
    expect(parsePlanDate("2026-02-30")).toBeNull();
    expect(parsePlanDate("2026-00-00")).toBeNull();
  });

  it("handles leap years exactly", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(parsePlanDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parsePlanDate("2026-02-29")).toBeNull();
  });

  it("round-trips through planDateToDays/daysToPlanDate losslessly", () => {
    for (const iso of ["2026-01-01", "2026-03-02", "2026-12-31", "2024-02-29", "2000-02-29", "1970-01-01", "0100-01-01"]) {
      const parsed = parsePlanDate(iso)!;
      expect(planDateToISO(daysToPlanDate(planDateToDays(parsed)))).toBe(iso);
      expect(planDateToISO(parsed)).toBe(iso);
    }
  });
});

describe("day offset math across DST boundaries", () => {
  // US DST starts 2026-03-08 (second Sunday of March). Offsets must be
  // timezone-independent, so the difference across that boundary is still
  // exactly 1 day per calendar day.
  it("keeps consecutive day offsets identical across DST start", () => {
    const before = parsePlanDate("2026-03-07")!;
    const after = parsePlanDate("2026-03-08")!;
    expect(daysBetween(before, after)).toBe(1);
    expect(planDateToDays(after) - planDateToDays(before)).toBe(1);
  });

  it("keeps consecutive day offsets identical across DST end", () => {
    // US DST ends 2026-11-01 (first Sunday of November).
    const before = parsePlanDate("2026-10-31")!;
    const after = parsePlanDate("2026-11-01")!;
    expect(daysBetween(before, after)).toBe(1);
  });

  it("computes a full range span identically across DST boundaries", () => {
    const start = parsePlanDate("2026-03-02")!;
    const end = parsePlanDate("2026-11-08")!;
    expect(daysBetween(start, end)).toBe(251);
  });

  it("is negative for reversed ranges instead of normalizing", () => {
    expect(daysBetween(parsePlanDate("2026-03-10")!, parsePlanDate("2026-03-02")!)).toBe(-8);
  });
});

describe("addPlanDays / week boundaries", () => {
  it("adds days across month and year boundaries", () => {
    expect(planDateToISO(addPlanDays(parsePlanDate("2026-03-31")!, 1))).toBe("2026-04-01");
    expect(planDateToISO(addPlanDays(parsePlanDate("2026-12-31")!, 1))).toBe("2027-01-01");
    expect(planDateToISO(addPlanDays(parsePlanDate("2026-03-02")!, -2))).toBe("2026-02-28");
  });

  it("startOfWeekMonday returns the Monday of the containing week", () => {
    // 2026-03-02 is a Monday.
    expect(planDateToISO(startOfWeekMonday(parsePlanDate("2026-03-02")!))).toBe("2026-03-02");
    expect(planDateToISO(startOfWeekMonday(parsePlanDate("2026-03-08")!))).toBe("2026-03-02");
    expect(planDateToISO(startOfWeekMonday(parsePlanDate("2026-03-14")!))).toBe("2026-03-09");
    // Sunday belongs to the week that started the previous Monday.
    expect(planDateToISO(startOfWeekMonday(parsePlanDate("2026-03-08")!))).toBe("2026-03-02");
  });

  it("endOfWeekSunday returns the Sunday after startOfWeekMonday", () => {
    expect(planDateToISO(endOfWeekSunday(parsePlanDate("2026-03-02")!))).toBe("2026-03-08");
    expect(planDateToISO(endOfWeekSunday(parsePlanDate("2026-03-09")!))).toBe("2026-03-15");
  });

  it("utcDayOfWeek maps 2026-03-02 (Monday) to 1", () => {
    expect(utcDayOfWeek(parsePlanDate("2026-03-02")!)).toBe(1);
    expect(utcDayOfWeek(parsePlanDate("2026-03-08")!)).toBe(0);
    expect(utcDayOfWeek(parsePlanDate("2026-03-07")!)).toBe(6);
  });
});

describe("formatPlanDateShort", () => {
  it("formats as 'Mon d' with no zero padding", () => {
    expect(formatPlanDateShort(parsePlanDate("2026-03-02")!)).toBe("Mar 2");
    expect(formatPlanDateShort(parsePlanDate("2026-03-31")!)).toBe("Mar 31");
    expect(formatPlanDateShort(parsePlanDate("2026-12-01")!)).toBe("Dec 1");
  });
});

describe("planDateToISO", () => {
  it("zero-pads years below 1000 for YYYY-MM-DD round-trip", () => {
    expect(planDateToISO({ year: 100, month: 1, day: 2 })).toBe("0100-01-02");
    expect(parsePlanDate(planDateToISO({ year: 100, month: 1, day: 2 }))).toEqual({
      year: 100,
      month: 1,
      day: 2,
    });
  });
});

describe("isValidPlanDate", () => {
  it("validates component-wise bounds", () => {
    expect(isValidPlanDate(2026, 3, 2)).toBe(true);
    expect(isValidPlanDate(2026, 0, 2)).toBe(false);
    expect(isValidPlanDate(2026, 13, 2)).toBe(false);
    expect(isValidPlanDate(2026, 3, 0)).toBe(false);
    expect(isValidPlanDate(2026, 3, 32)).toBe(false);
    expect(isValidPlanDate(2026.5, 3, 2)).toBe(false);
    expect(isValidPlanDate(0, 3, 2)).toBe(false);
  });
});
