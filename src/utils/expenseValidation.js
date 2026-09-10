// Pure validation for the Expense Entry form. Kept framework/storage free
// so it can be unit tested directly (see expenseValidation.test.js).

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

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
    }
  }

  if (!date) {
    errors.date = "Select a date.";
  } else if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    errors.date = "Enter a valid date.";
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
