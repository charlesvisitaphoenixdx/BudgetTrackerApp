import { describe, it, expect } from "vitest";
import { validateExpense, MAX_AMOUNT, MAX_PAST_YEARS, MAX_FUTURE_YEARS } from "./expenseValidation.js";

const VALID = {
  expenseTypeId: "1",
  amount: "12.50",
  date: "2026-09-10",
  name: "Weekly groceries",
  description: "Optional notes",
};

describe("validateExpense", () => {
  it("accepts a fully valid expense", () => {
    const { valid, errors } = validateExpense(VALID);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it("accepts a valid expense with no description (optional field)", () => {
    const { valid } = validateExpense({ ...VALID, description: "" });
    expect(valid).toBe(true);
  });

  it("requires an expense type", () => {
    const { valid, errors } = validateExpense({ ...VALID, expenseTypeId: "" });
    expect(valid).toBe(false);
    expect(errors.expenseTypeId).toMatch(/select/i);
  });

  it("requires an amount", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/enter an amount/i);
  });

  it("rejects a non-numeric amount", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "abc" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/number/i);
  });

  it("rejects a zero amount", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "0" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/greater than 0/i);
  });

  it("rejects a negative amount", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "-5" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/greater than 0/i);
  });

  it("rejects an amount with more than 2 decimal places", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "12.345" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/2 decimal/i);
  });

  it("accepts a whole-number amount", () => {
    const { valid } = validateExpense({ ...VALID, amount: "20" });
    expect(valid).toBe(true);
  });

  it("accepts an amount right at the maximum", () => {
    const { valid } = validateExpense({ ...VALID, amount: String(MAX_AMOUNT) });
    expect(valid).toBe(true);
  });

  it("rejects an amount over the maximum", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: String(MAX_AMOUNT + 0.01) });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/or less/i);
  });

  it("rejects an absurdly large amount", () => {
    const { valid, errors } = validateExpense({ ...VALID, amount: "99999999999999999999.99" });
    expect(valid).toBe(false);
    expect(errors.amount).toMatch(/or less/i);
  });

  it("requires a date", () => {
    const { valid, errors } = validateExpense({ ...VALID, date: "" });
    expect(valid).toBe(false);
    expect(errors.date).toMatch(/select a date/i);
  });

  it("rejects an invalid date string", () => {
    const { valid, errors } = validateExpense({ ...VALID, date: "not-a-date" });
    expect(valid).toBe(false);
    expect(errors.date).toMatch(/valid date/i);
  });

  it("rejects a date far in the past", () => {
    const year = new Date().getFullYear() - MAX_PAST_YEARS - 1;
    const { valid, errors } = validateExpense({ ...VALID, date: `${year}-01-01` });
    expect(valid).toBe(false);
    expect(errors.date).toMatch(/past/i);
  });

  it("rejects a date far in the future", () => {
    const year = new Date().getFullYear() + MAX_FUTURE_YEARS + 1;
    const { valid, errors } = validateExpense({ ...VALID, date: `${year}-01-01` });
    expect(valid).toBe(false);
    expect(errors.date).toMatch(/future/i);
  });

  it("accepts today's date", () => {
    const { valid } = validateExpense({ ...VALID, date: new Date().toISOString().slice(0, 10) });
    expect(valid).toBe(true);
  });

  it("requires a name", () => {
    const { valid, errors } = validateExpense({ ...VALID, name: "" });
    expect(valid).toBe(false);
    expect(errors.name).toMatch(/enter a name/i);
  });

  it("rejects a whitespace-only name", () => {
    const { valid, errors } = validateExpense({ ...VALID, name: "   " });
    expect(valid).toBe(false);
    expect(errors.name).toMatch(/enter a name/i);
  });

  it("rejects a name longer than 80 characters", () => {
    const { valid, errors } = validateExpense({ ...VALID, name: "a".repeat(81) });
    expect(valid).toBe(false);
    expect(errors.name).toMatch(/80 characters/i);
  });

  it("accepts a name exactly 80 characters long", () => {
    const { valid } = validateExpense({ ...VALID, name: "a".repeat(80) });
    expect(valid).toBe(true);
  });

  it("rejects a description longer than 500 characters", () => {
    const { valid, errors } = validateExpense({ ...VALID, description: "a".repeat(501) });
    expect(valid).toBe(false);
    expect(errors.description).toMatch(/500 characters/i);
  });

  it("reports multiple errors at once when several fields are invalid", () => {
    const { valid, errors } = validateExpense({
      expenseTypeId: "",
      amount: "",
      date: "",
      name: "",
      description: "",
    });
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(["amount", "date", "expenseTypeId", "name"]);
  });
});
