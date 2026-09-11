// Small display-formatting helpers shared by expense-related components.
// No currency symbol/locale selection exists yet (see docs/TECHNICAL.md
// "known limitations"), but amounts are grouped with thousands separators
// (e.g. "9,999,999.99") for readability, applied consistently everywhere
// formatAmount() is used.

export function formatAmount(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
