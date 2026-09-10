import { describe, it, expect } from "vitest";
import { periodFor, shiftPeriod, daysInMonth, clampDay } from "./period.js";

function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

describe("periodFor", () => {
  it("matches the spec example: start day 5, Sep 10 2026 -> Sep 5 - Oct 4", () => {
    const { start, end } = periodFor(new Date(2026, 8, 10), 5);
    expect(ymd(start)).toBe("2026-09-05");
    expect(ymd(end)).toBe("2026-10-04");
  });

  it("a date just before the start day belongs to the previous period", () => {
    const { start, end } = periodFor(new Date(2026, 8, 4), 5);
    expect(ymd(start)).toBe("2026-08-05");
    expect(ymd(end)).toBe("2026-09-04");
  });

  it("a date exactly on the start day begins the new period", () => {
    const { start, end } = periodFor(new Date(2026, 8, 5), 5);
    expect(ymd(start)).toBe("2026-09-05");
    expect(ymd(end)).toBe("2026-10-04");
  });

  it("start day 1 behaves like a normal calendar month", () => {
    const { start, end } = periodFor(new Date(2026, 8, 15), 1);
    expect(ymd(start)).toBe("2026-09-01");
    expect(ymd(end)).toBe("2026-09-30");
  });

  it("clamps a start day that doesn't exist in a short month (Feb, non-leap)", () => {
    const { start, end } = periodFor(new Date(2027, 1, 15), 31);
    expect(ymd(start)).toBe("2027-01-31");
    expect(ymd(end)).toBe("2027-02-27");
  });

  it("clamps correctly across a leap-year February", () => {
    const { start, end } = periodFor(new Date(2028, 1, 29), 31);
    expect(ymd(start)).toBe("2028-02-29");
    expect(ymd(end)).toBe("2028-03-30");
  });
});

describe("shiftPeriod", () => {
  it("moves to the next and previous period", () => {
    const current = periodFor(new Date(2026, 8, 10), 5);
    const next = shiftPeriod(current, 5, 1);
    const prev = shiftPeriod(current, 5, -1);
    expect(ymd(next.start)).toBe("2026-10-05");
    expect(ymd(next.end)).toBe("2026-11-04");
    expect(ymd(prev.start)).toBe("2026-08-05");
    expect(ymd(prev.end)).toBe("2026-09-04");
  });
});

describe("daysInMonth / clampDay", () => {
  it("reports correct day counts", () => {
    expect(daysInMonth(2026, 8)).toBe(30); // September
    expect(daysInMonth(2027, 1)).toBe(28); // Feb non-leap
    expect(daysInMonth(2028, 1)).toBe(29); // Feb leap
  });

  it("clamps a day beyond the month length", () => {
    expect(clampDay(2027, 1, 31)).toBe(28);
    expect(clampDay(2026, 8, 5)).toBe(5);
  });
});
