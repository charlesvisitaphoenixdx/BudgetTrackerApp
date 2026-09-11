import { formatAmount, formatDate } from "../utils/format.js";

export default function ExpenseList({ expenses, expenseTypes, onDelete, onSelect }) {
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // most recent date first
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  return (
    <section className="card">
      <h2>Logged Expenses</h2>
      <p className="sub">Most recent first.</p>

      {sorted.length === 0 ? (
        <p className="empty">No expenses logged yet.</p>
      ) : (
        <div className="expense-list">
          {sorted.map((exp) => {
            const type = expenseTypes.find((t) => t.id === exp.expenseTypeId);
            return (
              <div className="expense-row" key={exp.id}>
                <button
                  type="button"
                  className="expense-row-select"
                  onClick={() => onSelect?.(exp)}
                  aria-label={`Edit expense ${exp.name}`}
                >
                  <span
                    className="dot"
                    style={{ background: type ? type.color : "#9aa1af" }}
                    title={type ? type.name : "Deleted category"}
                  />
                  <div className="expense-main">
                    <div className="expense-title">
                      <strong>{exp.name}</strong>
                      <span className="expense-amount">{formatAmount(exp.amount)}</span>
                    </div>
                    <div className="expense-meta">
                      {formatDate(exp.date)} · {type ? type.name : "Deleted category"}
                    </div>
                    {exp.description && <div className="expense-desc">{exp.description}</div>}
                  </div>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Delete"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${exp.name}"? This can't be undone.`)) return;
                    await onDelete(exp.id);
                  }}
                  aria-label={`Delete expense ${exp.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
