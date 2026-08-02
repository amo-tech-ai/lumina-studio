// IPI-579 · PLN-S1B — the one named, UTC-safe date-only parser all Planner
// view positioning math routes through. No raw `new Date("YYYY-MM-DD")`
// arithmetic anywhere else in the Timeline, and no date library — this file
// is deliberately tiny and fully deterministic:
//
//  - Accepts valid `YYYY-MM-DD` values only
//  - Rejects malformed strings AND impossible calendar dates (`2026-02-31`)
//  - Produces identical day offsets across timezones and DST boundaries
//    (all math is done on UTC epoch-days via Date.UTC — never local time)
//  - Guarantees round-trip integrity: daysToPlanDate(planDateToDays(d)) === d
//
// Contract: every date entering the Timeline (task start/end, `today`,
// week headers) must first pass parsePlanDate. A `null` from the parser is
// the signal for the "unscheduled / needs correction" states — callers must
// never coerce null dates silently (see planner-view-model.ts).

export interface PlanDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–daysInMonth
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

// Year floor is 100, not 1: JS's Date.UTC maps years 0–99 to 1900–1999
// (new Date(1, 0, 1) === 1901-01-01), which would silently break the
// round-trip guarantee. No real Planner date is older than year 100.
export function isValidPlanDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 100 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

// Strict `YYYY-MM-DD` parser. Rejects: non-strings, malformed strings
// (wrong separators, out-of-range widths), and impossible dates such as
// `2026-02-31`. Validation happens BEFORE any Date conversion — Date.UTC
// would otherwise silently normalize `2026-02-31` to `2026-03-03`.
export function parsePlanDate(value: string | null | undefined): PlanDate | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE_RE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidPlanDate(year, month, day)) return null;

  return { year, month, day };
}

export function planDateToISO(date: PlanDate): string {
  const y = String(date.year).padStart(4, "0");
  const m = String(date.month).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Days since the UTC epoch (1970-01-01). Date.UTC is pure calendar math on
// the UTC timeline — the result is identical regardless of the host
// timezone or DST rules, so `2026-03-08` (US DST start) still offsets by
// exactly 1 day from `2026-03-07` on every machine.
export function planDateToDays(date: PlanDate): number {
  return Math.round(Date.UTC(date.year, date.month - 1, date.day) / DAY_MS);
}

export function daysToPlanDate(days: number): PlanDate {
  const utc = new Date(days * DAY_MS);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

// Round-trip guard: number of days from `start` to `end` (end - start).
// Negative when `end` precedes `start` — callers use the sign to flag
// reversed ranges instead of silently normalizing.
export function daysBetween(start: PlanDate, end: PlanDate): number {
  return planDateToDays(end) - planDateToDays(start);
}

export function addPlanDays(date: PlanDate, delta: number): PlanDate {
  return daysToPlanDate(planDateToDays(date) + delta);
}

// Monday of `date`'s week — the Timeline's week columns always start Monday
// (matches the SCR-32 `W1 Mon Mar 2 …` header and the calendar's dow order).
export function startOfWeekMonday(date: PlanDate): PlanDate {
  const dayOfWeek = utcDayOfWeek(date); // 0 = Sunday … 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addPlanDays(date, -daysSinceMonday);
}

export function endOfWeekSunday(date: PlanDate): PlanDate {
  return addPlanDays(startOfWeekMonday(date), 6);
}

// 0 = Sunday … 6 = Saturday — but computed from the UTC date-only value,
// never from a Date object that could carry local-time offset.
export function utcDayOfWeek(date: PlanDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

// "Mar 2" — deterministic short label for week headers and range chips.
// Manual month table instead of Intl so output is stable across runtimes
// and locales; the Timeline never localizes these labels.
export function formatPlanDateShort(date: PlanDate): string {
  return `${MONTH_ABBREVIATIONS[date.month - 1]} ${date.day}`;
}

/** Canonical YYYY-MM-DD for Detail panels and tests. */
export function formatPlanDateIso(date: PlanDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

// The current UTC date as PlanDate — the single source for the TODAY
// marker. The app has no org-timezone contract yet (see IPI-579 date
// behavior); UTC is the documented default, consistent with queries.ts's
// utcDate() convention.
export function utcToday(now: Date = new Date()): PlanDate {
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}
