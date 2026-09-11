// Pure validation for the Expense Entry form. Kept framework/storage free
// so it can be unit tested directly (see expenseValidation.test.js).

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// Sanity bounds, not business rules: catch obvious typos (an extra digit on
// the amount, a transposed year on the date) rather than restrict legitimate
// entries.
export const MAX_AMOUNT = 1_000_000;
export const MAX_PAST_YEARS = 50;
export const MAX_FUTURE_YEARS = 1;

export function validateExpense({ expenseTypeId, amount, date, name, description }) {
  const errors = {};

  if (!expenseTypeId && expenseTypeId !== 0) {
    errors.expenseTypeId = "Select an expense type.";
  }

  const amountStr = String(amount ?? "").trim();
  if (!amountStr) {
    errors.amount = "Enter an amount.";
  } else {
    const num = Number(amountStr);
    if (Number.isNaN(num)) {
      errors.amount = "Amount must be a number.";
    } else if (num <= 0) {
      errors.amount = "Amount must be greater than 0.";
    } else if (!AMOUNT_PATTERN.test(amountStr)) {
      errors.amount = "Amount can have at most 2 decimal places.";
    } else if (num > MAX_AMOUNT) {
      errors.amount = `Amount must be ${MAX_AMOUNT.toLocaleString()} or less.`;
    }
  }

  if (!date) {
    errors.date = "Select a date.";
  } else {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors.date = "Enter a valid date.";
    } else {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - MAX_PAST_YEARS, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() + MAX_FUTURE_YEARS, now.getMonth(), now.getDate());
      if (parsed < minDate) {
        errors.date = `Date can't be more than ${MAX_PAST_YEARS} years in the past.`;
      } else if (parsed > maxDate) {
        errors.date = `Date can't be more than ${MAX_FUTURE_YEARS} year in the future.`;
      }
    }
  }

  const trimmedName = (name ?? "").trim();
  if (!trimmedName) {
    errors.name = "Enter a name for this expense.";
  } else if (trimmedName.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if ((description ?? "").length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
