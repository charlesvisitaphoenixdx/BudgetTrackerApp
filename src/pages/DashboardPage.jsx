import { useEffect, useMemo, useState } from "react";
import { SEED_TYPES } from "../components/ExpenseTypesManager.jsx";
import { useExpenses } from "../hooks/useExpenses.js";
import { useLocalStorageState } from "../hooks/useLocalStorageState.js";
import { formatAmount } from "../utils/format.js";
import { periodFor, shiftPeriod } from "../utils/period.js";

const DEFAULT_BUDGET_LIMITS = { overall: null };
const TREND_PERIOD_COUNT = 6;

const fmt = (date) =>
  date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function groupByCategory(expenses, expenseTypes) {
  const totals = new Map();
  for (const exp of expenses) {
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
}

/**
 * Single screen combining what used to be the separate Budget screen (a
 * navigable period's total/over-under status and category breakdown) with
 * the Dashboard's own cross-period view (a fixed 6-period trend and top
 * categories), plus an optional expense-type filter that narrows all of it.
 * The trend/top-categories window always tracks the real current period,
 * independent of whichever period the Selected Period section is browsing.
 */
export default function DashboardPage({ onGoToConfiguration }) {
  const [expenseTypes] = useLocalStorageState("config.expenseTypes", SEED_TYPES);
  const [startDay] = useLocalStorageState("config.startDay", 1);
  const [budgetLimits] = useLocalStorageState("config.budgetLimits", DEFAULT_BUDGET_LIMITS);
  const { expenses, loading, error } = useExpenses();

  const [filterId, setFilterId] = useState("all");

  // If the selected type is deleted from Configuration while showing, fall
  // back to "All types" rather than silently filtering by a stale id.
  useEffect(() => {
    if (filterId !== "all" && !expenseTypes.some((t) => String(t.id) === filterId)) {
      setFilterId("all");
    }
  }, [expenseTypes, filterId]);

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

  const filterTypeId = filterId === "all" ? null : Number(filterId);

  const selectedPeriodExpenses = useMemo(() => {
    const startISO = isoDate(period.start);
    const endISO = isoDate(period.end);
    return expenses.filter((exp) => exp.date >= startISO && exp.date <= endISO);
  }, [expenses, period]);

  const selectedTotal = useMemo(() => {
    const filtered =
      filterTypeId != null
        ? selectedPeriodExpenses.filter((exp) => exp.expenseTypeId === filterTypeId)
        : selectedPeriodExpenses;
    const sum = filtered.reduce((acc, exp) => acc + Number(exp.amount), 0);
    return Math.round(sum * 100) / 100;
  }, [selectedPeriodExpenses, filterTypeId]);

  const selectedBreakdown = useMemo(() => {
    if (filterId !== "all") return [];
    return groupByCategory(selectedPeriodExpenses, expenseTypes);
  }, [filterId, selectedPeriodExpenses, expenseTypes]);

  const overall = budgetLimits?.overall ?? null;
  const budgetStatus =
    filterId !== "all"
      ? null
      : overall == null
        ? "none"
        : selectedTotal <= overall
          ? "under"
          : "over";

  const periods = useMemo(() => {
    const list = [currentPeriod];
    let p = currentPeriod;
    for (let i = 1; i < TREND_PERIOD_COUNT; i++) {
      p = shiftPeriod(p, startDay, -1);
      list.unshift(p);
    }
    return list;
  }, [currentPeriod, startDay]);

  const periodTotals = useMemo(
    () =>
      periods.map((p) => {
        const startISO = isoDate(p.start);
        const endISO = isoDate(p.end);
        const sum = expenses.reduce((acc, exp) => {
          if (exp.date < startISO || exp.date > endISO) return acc;
          if (filterTypeId != null && exp.expenseTypeId !== filterTypeId) return acc;
          return acc + Number(exp.amount);
        }, 0);
        return Math.round(sum * 100) / 100;
      }),
    [periods, expenses, filterTypeId]
  );

  const maxPeriodTotal = Math.max(...periodTotals);

  const topCategories = useMemo(() => {
    if (filterId !== "all") return [];
    const startISO = isoDate(periods[0].start);
    const endISO = isoDate(periods[periods.length - 1].end);
    const windowExpenses = expenses.filter((exp) => exp.date >= startISO && exp.date <= endISO);
    const rows = groupByCategory(windowExpenses, expenseTypes);
    const grandTotal = rows.reduce((acc, r) => acc + r.amount, 0);
    return rows
      .map((r) => ({ ...r, pct: grandTotal > 0 ? (r.amount / grandTotal) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [filterId, periods, expenses, expenseTypes]);

  return (
    <div className="wrap">
      <header className="page">
        <h1>Dashboard</h1>
        <p>Browse any budget period, and spot spending trends across recent ones.</p>
      </header>

      <section className="card">
        <div className="field">
          <label htmlFor="dashboardFilter">Expense type</label>
          <select id="dashboardFilter" value={filterId} onChange={(e) => setFilterId(e.target.value)}>
            <option value="all">All types</option>
            {expenseTypes.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </section>

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
            <h2>Selected Period</h2>
            <p className="budget-total">{formatAmount(selectedTotal)}</p>

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
                {formatAmount(selectedTotal)} of {formatAmount(overall)} —{" "}
                {formatAmount(overall - selectedTotal)} remaining
              </p>
            )}
            {budgetStatus === "over" && (
              <p className="budget-status budget-status-over">
                {formatAmount(selectedTotal)} of {formatAmount(overall)} —{" "}
                {formatAmount(selectedTotal - overall)} over budget
              </p>
            )}
          </section>

          {filterId === "all" && (
            <section className="card">
              <h2>By Category</h2>
              {selectedBreakdown.length === 0 ? (
                <p className="empty">No expenses logged in this period yet.</p>
              ) : (
                <div className="budget-breakdown">
                  {selectedBreakdown.map((row) => (
                    <div className="budget-breakdown-row" key={row.key}>
                      <span className="dot" style={{ background: row.color }} title={row.label} />
                      <span className="budget-breakdown-label">{row.label}</span>
                      <span className="budget-breakdown-amount">{formatAmount(row.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="card">
            <h2>Spending Trend</h2>
            <p className="sub">Current period and the 5 before it.</p>
            <div className="trend-list">
              {periods.map((p, i) => {
                const total = periodTotals[i];
                const width = maxPeriodTotal > 0 ? (total / maxPeriodTotal) * 100 : 0;
                return (
                  <div className="trend-row" key={p.start.getTime()}>
                    <div className="trend-range">
                      {fmt(p.start)} → {fmt(p.end)}
                    </div>
                    <div className="trend-bar-row">
                      <div className="trend-bar-track">
                        <div className="trend-bar-fill" style={{ width: `${width}%` }} />
                      </div>
                      <div className="trend-amount">{formatAmount(total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {filterId === "all" && (
            <section className="card">
              <h2>Top Categories</h2>
              {topCategories.length === 0 ? (
                <p className="empty">No spending yet.</p>
              ) : (
                <div className="budget-breakdown">
                  {topCategories.map((row) => (
                    <div className="budget-breakdown-row" key={row.key}>
                      <span className="dot" style={{ background: row.color }} title={row.label} />
                      <span className="budget-breakdown-label">{row.label}</span>
                      <span className="budget-breakdown-pct">{row.pct.toFixed(1)}%</span>
                      <span className="budget-breakdown-amount">{formatAmount(row.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
