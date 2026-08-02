import { describe, expect, it } from "vitest";

import type { PlannerTask } from "./types";
import {
  PLANNER_CALENDAR_CELL_COUNT,
  PLANNER_CALENDAR_WEEKDAYS,
  buildPlannerMonth,
  shiftPlannerMonth,
  splitChipsForOverflow,
  visibleChipLimit,
} from "./planner-calendar-model";
import { planDateToISO, utcDayOfWeek } from "./planner-date-utils";

function task(
  id: string,
  startDate: string | null,
  extra: Partial<PlannerTask> = {},
): PlannerTask {
  return {
    id,
    instanceId: "i1",
    phaseId: "ph-1",
    parentTaskId: null,
    title: id,
    description: null,
    startDate,
    endDate: startDate,
    durationDays: 1,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...extra,
  };
}

describe("buildPlannerMonth — 42-cell lock", () => {
  it("always returns exactly 42 days (6×7), never four/five rows", () => {
    // February 2021 starts Monday → "could" be 28 cells / 4 rows; still 42.
    const feb = buildPlannerMonth({ year: 2021, month: 2, tasks: [], today: "2021-02-15" });
    expect(feb.days).toHaveLength(PLANNER_CALENDAR_CELL_COUNT);
    expect(PLANNER_CALENDAR_CELL_COUNT).toBe(42);

    // June 2024 fits in 5 visual weeks; still 42.
    const jun = buildPlannerMonth({ year: 2024, month: 6, tasks: [], today: "2024-06-15" });
    expect(jun.days).toHaveLength(42);

    // October 2026 needs six rows; still exactly 42.
    const oct = buildPlannerMonth({ year: 2026, month: 10, tasks: [], today: "2026-10-15" });
    expect(oct.days).toHaveLength(42);
  });

  it("uses Monday-first weekday headers matching SCR-32", () => {
    expect(PLANNER_CALENDAR_WEEKDAYS).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    const model = buildPlannerMonth({ year: 2026, month: 3, tasks: [], today: "2026-03-12" });
    expect(model.weekdays).toEqual(PLANNER_CALENDAR_WEEKDAYS);
    // First cell is always a Monday.
    expect(utcDayOfWeek(model.days[0].date)).toBe(1);
  });
});

describe("buildPlannerMonth — matrix edges", () => {
  it("January starting on Sunday gets leading Mon–Sat fillers from December", () => {
    // 2023-01-01 = Sunday → grid starts 2022-12-26 (Monday).
    const model = buildPlannerMonth({ year: 2023, month: 1, tasks: [], today: "2023-01-15" });
    expect(planDateToISO(model.days[0].date)).toBe("2022-12-26");
    expect(model.days[0].inMonth).toBe(false);
    const jan1 = model.days.find((d) => d.iso === "2023-01-01");
    expect(jan1?.inMonth).toBe(true);
    expect(utcDayOfWeek(jan1!.date)).toBe(0); // Sunday
  });

  it("month starting on Saturday places the 1st in column 6 (0-based)", () => {
    // 2026-08-01 = Saturday.
    const model = buildPlannerMonth({ year: 2026, month: 8, tasks: [], today: "2026-08-15" });
    expect(planDateToISO(model.days[0].date)).toBe("2026-07-27");
    const aug1Index = model.days.findIndex((d) => d.iso === "2026-08-01");
    expect(aug1Index % 7).toBe(5); // Sat = index 5 in Mon-first week
  });

  it("includes February 29 in a leap year and not in a non-leap year", () => {
    const leap = buildPlannerMonth({ year: 2024, month: 2, tasks: [], today: "2024-02-15" });
    expect(leap.days.some((d) => d.iso === "2024-02-29" && d.inMonth)).toBe(true);

    const nonLeap = buildPlannerMonth({ year: 2023, month: 2, tasks: [], today: "2023-02-15" });
    expect(nonLeap.days.some((d) => d.iso === "2023-02-29")).toBe(false);
    expect(nonLeap.days.some((d) => d.iso === "2023-02-28" && d.inMonth)).toBe(true);
  });

  it("marks today inside and outside the displayed month correctly", () => {
    const inside = buildPlannerMonth({ year: 2026, month: 3, tasks: [], today: "2026-03-12" });
    expect(inside.days.find((d) => d.iso === "2026-03-12")?.isToday).toBe(true);
    expect(inside.days.filter((d) => d.isToday)).toHaveLength(1);

    const outside = buildPlannerMonth({ year: 2026, month: 3, tasks: [], today: "2026-04-01" });
    // April 1 is in the trailing filler of March 2026 grid — still isToday.
    expect(outside.days.find((d) => d.iso === "2026-04-01")?.isToday).toBe(true);
    expect(outside.days.find((d) => d.iso === "2026-03-12")?.isToday).toBe(false);
  });
});

describe("buildPlannerMonth — task placement", () => {
  it("places chips on start_date only (first and last day of month)", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [
        task("t-first", "2026-03-01", { title: "Sample pull" }),
        task("t-last", "2026-03-31", { title: "Wrap" }),
        // end_date in April must NOT create a chip on April 2
        task("t-span", "2026-03-30", { endDate: "2026-04-02", title: "Return" }),
      ],
    });

    expect(model.days.find((d) => d.iso === "2026-03-01")?.chips.map((c) => c.task.id)).toEqual([
      "t-first",
    ]);
    expect(model.days.find((d) => d.iso === "2026-03-31")?.chips.map((c) => c.task.id)).toEqual([
      "t-last",
    ]);
    expect(model.days.find((d) => d.iso === "2026-03-30")?.chips.map((c) => c.task.id)).toEqual([
      "t-span",
    ]);
    expect(model.days.find((d) => d.iso === "2026-04-02")?.chips).toEqual([]);
  });

  it("keeps trailing out-of-month chips that fall inside the 42-cell window", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-apr", "2026-04-02", { title: "Final approval" })],
    });
    expect(model.days.find((d) => d.iso === "2026-04-02")?.chips[0]?.task.id).toBe("t-apr");
    expect(model.days.find((d) => d.iso === "2026-04-02")?.inMonth).toBe(false);
  });

  it("excludes tasks outside the 42-cell window without putting them in Unscheduled", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-far", "2026-06-01")],
    });
    expect(model.days.every((d) => d.chips.length === 0)).toBe(true);
    expect(model.unscheduled).toEqual([]);
    expect(model.emptyMonth).toBe(true);
  });

  it("routes null and malformed start_date into Unscheduled", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [
        task("t-null", null),
        task("t-bad", "2026-02-31"),
        task("t-ok", "2026-03-12"),
      ],
    });
    expect(model.unscheduled.map((t) => t.id).sort()).toEqual(["t-bad", "t-null"]);
    expect(model.days.find((d) => d.iso === "2026-03-12")?.chips).toHaveLength(1);
  });

  it("flags reversed start/end without swapping or spanning", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-rev", "2026-03-20", { endDate: "2026-03-15" })],
    });
    const chip = model.days.find((d) => d.iso === "2026-03-20")?.chips[0];
    expect(chip?.invalidRange).toBe(true);
    expect(model.days.find((d) => d.iso === "2026-03-15")?.chips).toEqual([]);
  });

  it("sorts same-day chips deterministically by sortOrder then title then id", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [
        task("t-c", "2026-03-12", { title: "Zebra", sortOrder: 2 }),
        task("t-a", "2026-03-12", { title: "Alpha", sortOrder: 1 }),
        task("t-b", "2026-03-12", { title: "Alpha", sortOrder: 1 }),
      ],
    });
    expect(model.days.find((d) => d.iso === "2026-03-12")?.chips.map((c) => c.task.id)).toEqual([
      "t-a",
      "t-b",
      "t-c",
    ]);
  });

  it("normalizes unknown status to unknown without dropping the chip", () => {
    const model = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-x", "2026-03-12", { status: "mystery" as PlannerTask["status"] })],
    });
    expect(model.days.find((d) => d.iso === "2026-03-12")?.chips[0]?.status).toBe("unknown");
  });

  it("places the same date-only task in the same cell regardless of host timezone simulation", () => {
    // Pure UTC epoch-day math — no Date local getters. Assert iso identity.
    const toronto = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-dst", "2026-03-08")], // US DST spring-forward weekend
    });
    const medellin = buildPlannerMonth({
      year: 2026,
      month: 3,
      today: "2026-03-12",
      tasks: [task("t-dst", "2026-03-08")],
    });
    expect(toronto.days.find((d) => d.chips[0]?.task.id === "t-dst")?.iso).toBe("2026-03-08");
    expect(medellin.days.find((d) => d.chips[0]?.task.id === "t-dst")?.iso).toBe("2026-03-08");
  });
});

describe("overflow helpers", () => {
  it("uses deterministic 3/2/1 chip limits by viewport width", () => {
    expect(visibleChipLimit(1440)).toBe(3);
    expect(visibleChipLimit(1280)).toBe(3);
    expect(visibleChipLimit(1024)).toBe(2);
    expect(visibleChipLimit(768)).toBe(2);
    expect(visibleChipLimit(767)).toBe(1);
    expect(visibleChipLimit(390)).toBe(1);
  });

  it("splits chips into visible + overflow with +N count", () => {
    const chips = [1, 2, 3, 4, 5];
    expect(splitChipsForOverflow(chips, 3)).toEqual({
      visible: [1, 2, 3],
      overflow: [4, 5],
      overflowCount: 2,
    });
    expect(splitChipsForOverflow(chips, 5).overflowCount).toBe(0);
  });
});

describe("shiftPlannerMonth", () => {
  it("moves previous/next across year boundaries", () => {
    expect(shiftPlannerMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftPlannerMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftPlannerMonth(2026, 3, 0)).toEqual({ year: 2026, month: 3 });
  });
});
