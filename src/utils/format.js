// Small display-formatting helpers shared by expense-related components.
// No currency/locale selection exists yet (see docs/TECHNICAL.md "known
// limitations"), so amounts are shown as plain fixed-point numbers rather
// than assuming a currency symbol.

export function formatAmount(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(2);
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
