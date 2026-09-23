import { useId, useState } from "react";
import { hasActiveExpenseFilters } from "../utils/expenseFilter.js";

/**
 * Presentational filter controls for the Expenses screen, collapsed into an
 * accordion so the section stays out of the way until it's needed. Takes
 * the current filter values and two callbacks - onChange(field, value) for
 * a single field, onClear() to reset all of them at once. All matching
 * logic lives in utils/expenseFilter.js; this component only renders
 * controlled inputs, same composition-root/presentational split as the
 * rest of the app.
 *
 * The open/closed state is local UI state (not lifted to ExpensesPage)
 * since it's display-only and doesn't affect filtering; the filter values
 * themselves stay with the page and survive a collapse/expand. When
 * filters are active, a badge stays visible on the header even while
 * collapsed, so a filtered list is never shown with no visible reason why.
 *
 * Unlike ExpenseForm/BudgetLimitSettings, these inputs have no
 * commit-on-blur/revert-on-invalid validation - they narrow a read-only
 * view rather than write data, so an unparseable value is simply ignored by
 * filterExpenses() rather than blocked with an inline error.
 */
export default function ExpenseFilters({ filters, onChange, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const filtersActive = hasActiveExpenseFilters(filters);

  return (
    <section className="card">
      <div className="accordion-header">
        <button
          type="button"
          className="accordion-toggle"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="accordion-chevron" aria-hidden="true">
            {isOpen ? "▾" : "▸"}
          </span>
          <h2>Filters</h2>
          {filtersActive && <span className="filter-badge">Active</span>}
        </button>
        {filtersActive && (
          <button type="button" className="link-btn" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>

      {isOpen && (
        <div id={panelId}>
          <p className="sub">Narrow the list below by date, amount, or a name/description search.</p>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="filterFromDate">From</label>
              <input
                id="filterFromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => onChange("fromDate", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="filterToDate">To</label>
              <input
                id="filterToDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => onChange("toDate", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="filterMinAmount">Min amount</label>
              <input
                id="filterMinAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => onChange("minAmount", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="filterMaxAmount">Max amount</label>
              <input
                id="filterMaxAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.maxAmount}
                onChange={(e) => onChange("maxAmount", e.target.value)}
              />
            </div>
          </div>

          <div className="field field-wide">
            <label htmlFor="filterSearch">Search (name or description)</label>
            <input
              id="filterSearch"
              type="text"
              placeholder="e.g. coffee"
              value={filters.searchText}
              onChange={(e) => onChange("searchText", e.target.value)}
            />
          </div>

          <button type="button" className="secondary" onClick={onClear}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
