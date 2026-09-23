import { describe, it, expect } from "vitest";
import { filterExpenses, emptyExpenseFilters, hasActiveExpenseFilters } from "./expenseFilter.js";

const expenses = [
  { id: "1", name: "Coffee run", description: "", amount: 4.5, date: "2026-09-10" },
  { id: "2", name: "Groceries", description: "Weekly shop, bought coffee beans", amount: 82.3, date: "2026-09-05" },
  { id: "3", name: "Rent", description: "", amount: 1200, date: "2026-09-01" },
  { id: "4", name: "Movie night", description: "popcorn and tickets", amount: 25, date: "2026-08-20" },
];

describe("filterExpenses", () => {
  it("returns every expense when no filters are set", () => {
    expect(filterExpenses(expenses, emptyExpenseFilters())).toHaveLength(4);
  });

  describe("date range", () => {
    it("applies only the From bound when To is blank", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), fromDate: "2026-09-05" });
      expect(result.map((e) => e.id)).toEqual(["1", "2"]);
    });

    it("applies only the To bound when From is blank", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), toDate: "2026-09-05" });
      expect(result.map((e) => e.id)).toEqual(["2", "3", "4"]);
    });

    it("applies both bounds inclusively", () => {
      const result = filterExpenses(expenses, {
        ...emptyExpenseFilters(),
        fromDate: "2026-09-01",
        toDate: "2026-09-05",
      });
      expect(result.map((e) => e.id)).toEqual(["2", "3"]);
    });

    it("an inverted range (From after To) matches nothing, without erroring", () => {
      const result = filterExpenses(expenses, {
        ...emptyExpenseFilters(),
        fromDate: "2026-09-10",
        toDate: "2026-09-01",
      });
      expect(result).toEqual([]);
    });
  });

  describe("amount range", () => {
    it("applies only Min when Max is blank", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), minAmount: "80" });
      expect(result.map((e) => e.id)).toEqual(["2", "3"]);
    });

    it("applies only Max when Min is blank", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), maxAmount: "25" });
      expect(result.map((e) => e.id)).toEqual(["1", "4"]);
    });

    it("applies both bounds inclusively", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), minAmount: "25", maxAmount: "82.3" });
      expect(result.map((e) => e.id)).toEqual(["2", "4"]);
    });

    it("an inverted range (Min above Max) matches nothing", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), minAmount: "100", maxAmount: "10" });
      expect(result).toEqual([]);
    });

    it("an unparseable amount value is ignored, not treated as an error", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), minAmount: "not-a-number" });
      expect(result).toHaveLength(4);
    });
  });

  describe("search", () => {
    it("matches against name, case-insensitively", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), searchText: "COFFEE" });
      expect(result.map((e) => e.id)).toEqual(["1", "2"]);
    });

    it("matches against description even when name doesn't match", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), searchText: "popcorn" });
      expect(result.map((e) => e.id)).toEqual(["4"]);
    });

    it("blank/whitespace-only search applies no constraint", () => {
      expect(filterExpenses(expenses, { ...emptyExpenseFilters(), searchText: "   " })).toHaveLength(4);
    });

    it("an empty description never produces a false match", () => {
      const result = filterExpenses(expenses, { ...emptyExpenseFilters(), searchText: "zzz-no-match" });
      expect(result).toEqual([]);
    });

    it("literal * or ? are treated as plain characters, not glob wildcards", () => {
      const withGlob = [
        ...expenses,
        { id: "5", name: "Wildcard *test*", description: "", amount: 1, date: "2026-09-01" },
      ];
      const result = filterExpenses(withGlob, { ...emptyExpenseFilters(), searchText: "*test*" });
      expect(result.map((e) => e.id)).toEqual(["5"]);
    });
  });

  describe("combined filters (AND logic)", () => {
    it("requires every active dimension to match", () => {
      const result = filterExpenses(expenses, {
        fromDate: "2026-09-01",
        toDate: "2026-09-30",
        minAmount: "50",
        maxAmount: "",
        searchText: "coffee",
      });
      expect(result.map((e) => e.id)).toEqual(["2"]);
    });
  });
});

describe("hasActiveExpenseFilters", () => {
  it("is false when every field is empty", () => {
    expect(hasActiveExpenseFilters(emptyExpenseFilters())).toBe(false);
  });

  it("is true when any field has a value", () => {
    expect(hasActiveExpenseFilters({ ...emptyExpenseFilters(), searchText: "x" })).toBe(true);
  });
});
