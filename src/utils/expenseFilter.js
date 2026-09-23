// Pure filtering logic for the Expenses screen's "Filters" section. Kept
// framework/storage free so it can be unit tested directly (see
// expenseFilter.test.js). Filters combine with AND: an expense must satisfy
// every dimension that currently has a value to appear in the result; a
// dimension left blank applies no constraint at all. Unlike ExpenseForm's
// validated fields, an unparseable amount is simply ignored (not an error) -
// these fields narrow a read-only view, they never write data.

export function emptyExpenseFilters() {
  return { fromDate: "", toDate: "", minAmount: "", maxAmount: "", searchText: "" };
}

export function hasActiveExpenseFilters(filters) {
  return Object.values(filters).some((v) => String(v ?? "").trim() !== "");
}

export function filterExpenses(expenses, filters) {
  const fromDate = filters.fromDate || "";
  const toDate = filters.toDate || "";
  const minAmount = filters.minAmount === "" || filters.minAmount == null ? null : Number(filters.minAmount);
  const maxAmount = filters.maxAmount === "" || filters.maxAmount == null ? null : Number(filters.maxAmount);
  const search = (filters.searchText || "").trim().toLowerCase();

  return expenses.filter((exp) => {
    if (fromDate && exp.date < fromDate) return false;
    if (toDate && exp.date > toDate) return false;
    if (minAmount != null && !Number.isNaN(minAmount) && Number(exp.amount) < minAmount) return false;
    if (maxAmount != null && !Number.isNaN(maxAmount) && Number(exp.amount) > maxAmount) return false;
    if (search) {
      const name = (exp.name || "").toLowerCase();
      const description = (exp.description || "").toLowerCase();
      if (!name.includes(search) && !description.includes(search)) return false;
    }
    return true;
  });
}
