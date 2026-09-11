import { useMemo, useState } from "react";
import { SEED_TYPES } from "../components/ExpenseTypesManager.jsx";
import { useExpenses } from "../hooks/useExpenses.js";
import { useLocalStorageState } from "../hooks/useLocalStorageState.js";
import { formatAmount } from "../utils/format.js";
import { periodFor, shiftPeriod } from "../utils/period.js";

const DEFAULT_BUDGET_LIMITS = { overall: null };

const fmt = (date) =>
  date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Read-only spending summary for a budget period: total spent, a per-type
 * breakdown, an over/under/no-budget indicator, and Previous/Next
 * navigation between periods. `currentPeriod` is derived from the live
 * `config.startDay` rather than fixed at mount, and since App.jsx unmounts
 * this page when navigating away, returning to it after changing the start
 * day in Configuration re-initializes `period` from the new value too - no
 * stale period boundaries.
 */
export default function BudgetPage({ onGoToConfiguration }) {
  const [expenseTypes] = useLocalStorageState("config.expenseTypes", SEED_TYPES);
  const [startDay] = useLocalStorageState("config.startDay", 1);
  const [budgetLimits] = useLocalStorageState("config.budgetLimits", DEFAULT_BUDGET_LIMITS);
  const { expenses, loading, error } = useExpenses();

  const currentPeriod = useMemo(() => periodFor(new Date(), startDay), [startDay]);
  const [period, setPeriod] = useState(currentPeriod);

  const isCurrentPeriod = period.start.getTime() === currentPeriod.start.getTime();

  function goPrevious() {
    setPeriod((p) => shiftPeriod(p, startDay, -1));
  }
  function goNext() {
    setPeriod((p) => shiftPeriod(p, startDay, 1));
  }
  function goToCurrentPeriod() {
    setPeriod(currentPeriod);
  }

  const periodExpenses = useMemo(() => {
    const startISO = isoDate(period.start);
    const endISO = isoDate(period.end);
    return expenses.filter((exp) => exp.date >= startISO && exp.date <= endISO);
  }, [expenses, period]);

  const totalSpent = useMemo(() => {
    const sum = periodExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    return Math.round(sum * 100) / 100;
  }, [periodExpenses]);

  const breakdown = useMemo(() => {
    const totals = new Map();
    for (const exp of periodExpenses) {
      const type = expenseTypes.find((t) => t.id === exp.expenseTypeId);
      const key = type ? type.id : "deleted";
      const existing = totals.get(key);
      if (existing) {
        existing.amount += Number(exp.amount);
      } else {
        totals.set(key, {
          key,
          label: type ? type.name : "Deleted category",
          color: type ? type.color : "#9aa1af",
          amount: Number(exp.amount),
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, expenseTypes]);

  const overall = budgetLimits?.overall ?? null;
  const budgetStatus = overall == null ? "none" : totalSpent <= overall ? "under" : "over";

  return (
    <div className="wrap">
      <header className="page">
        <h1>Budget</h1>
        <p>See how much you&apos;ve spent against your budget for any period.</p>
      </header>

      <section className="card">
        <div className="budget-nav-row">
          <button type="button" className="secondary" onClick={goPrevious}>
            ← Previous
          </button>
          <div className="period-preview budget-period-preview">
            <div className="label">Period</div>
            <div className="range">
              {fmt(period.start)} <span className="arrow">→</span> {fmt(period.end)}
            </div>
          </div>
          <button type="button" className="secondary" onClick={goNext}>
            Next →
          </button>
        </div>
        {!isCurrentPeriod && (
          <button type="button" className="link-btn budget-today-link" onClick={goToCurrentPeriod}>
            Back to current period
          </button>
        )}
      </section>

      {error && <p className="error-msg">{error}</p>}

      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        <>
          <section className="card">
            <h2>Total Spent</h2>
            <p className="budget-total">{formatAmount(totalSpent)}</p>

            {budgetStatus === "none" && (
              <p className="sub">
                No budget set for this period.{" "}
                <button type="button" className="link-btn" onClick={onGoToConfiguration}>
                  Set one in Configuration
                </button>
              </p>
            )}
            {budgetStatus === "under" && (
              <p className="budget-status budget-status-under">
                {formatAmount(totalSpent)} of {formatAmount(overall)} —{" "}
                {formatAmount(overall - totalSpent)} remaining
              </p>
            )}
            {budgetStatus === "over" && (
              <p className="budget-status budget-status-over">
                {formatAmount(totalSpent)} of {formatAmount(overall)} —{" "}
                {formatAmount(totalSpent - overall)} over budget
              </p>
            )}
          </section>

          <section className="card">
            <h2>By Category</h2>
            {breakdown.length === 0 ? (
              <p className="empty">No expenses logged in this period yet.</p>
            ) : (
              <div className="budget-breakdown">
                {breakdown.map((row) => (
                  <div className="budget-breakdown-row" key={row.key}>
                    <span className="dot" style={{ background: row.color }} title={row.label} />
                    <span className="budget-breakdown-label">{row.label}</span>
                    <span className="budget-breakdown-amount">{formatAmount(row.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
