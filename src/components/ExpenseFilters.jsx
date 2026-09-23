/**
 * Presentational filter controls for the Expenses screen. Takes the current
 * filter values and two callbacks - onChange(field, value) for a single
 * field, onClear() to reset all of them at once. All matching logic lives in
 * utils/expenseFilter.js; this component only renders controlled inputs,
 * same composition-root/presentational split as the rest of the app.
 *
 * Unlike ExpenseForm/BudgetLimitSettings, these inputs have no
 * commit-on-blur/revert-on-invalid validation - they narrow a read-only
 * view rather than write data, so an unparseable value is simply ignored by
 * filterExpenses() rather than blocked with an inline error.
 */
export default function ExpenseFilters({ filters, onChange, onClear }) {
  return (
    <section className="card">
      <h2>Filters</h2>
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
    </section>
  );
}
