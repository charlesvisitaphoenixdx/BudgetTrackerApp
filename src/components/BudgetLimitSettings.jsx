import { useEffect, useState } from "react";

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function draftFromOverall(overall) {
  return overall == null ? "" : String(overall);
}

/**
 * Optional overall monthly budget limit, compared against total spending
 * across all expense types for the active period (see BudgetPage). Commits
 * on blur/Enter, same pattern as PeriodSettings' start-day field; reverts to
 * the last saved value on an invalid entry, same pattern as
 * ExpenseTypesManager's TypeRow rename validation.
 */
export default function BudgetLimitSettings({ budgetLimits, setBudgetLimits }) {
  const overall = budgetLimits?.overall ?? null;
  const [draft, setDraft] = useState(() => draftFromOverall(overall));
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(draftFromOverall(overall));
  }, [overall]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("");
      setBudgetLimits({ ...(budgetLimits ?? {}), overall: null });
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num) || num <= 0) {
      setError("Enter a positive amount, or leave blank for no limit.");
      setDraft(draftFromOverall(overall));
      return;
    }
    if (!AMOUNT_PATTERN.test(trimmed)) {
      setError("Enter an amount with at most 2 decimal places.");
      setDraft(draftFromOverall(overall));
      return;
    }
    setError("");
    setBudgetLimits({ ...(budgetLimits ?? {}), overall: Math.round(num * 100) / 100 });
  }

  return (
    <section className="card">
      <h2>Monthly Budget Limit</h2>
      <p className="sub">
        Optional overall spending limit for each budget period, checked against total spending
        across all expense types. Leave blank for no limit.
      </p>

      <div className="field">
        <label htmlFor="budgetLimit">Monthly budget limit</label>
        <input
          id="budgetLimit"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 1200.00"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "budgetLimit-error" : undefined}
        />
      </div>
      {error && (
        <div className="row-error" id="budgetLimit-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
