import { useState } from "react";
import { MAX_PAST_YEARS, MAX_FUTURE_YEARS, validateExpense } from "../utils/expenseValidation.js";

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayISO() {
  return toISODate(new Date());
}

function minAllowedDateISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_PAST_YEARS);
  return toISODate(d);
}

function maxAllowedDateISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + MAX_FUTURE_YEARS);
  return toISODate(d);
}

function emptyForm() {
  return { expenseTypeId: "", amount: "", date: todayISO(), name: "", description: "" };
}

function formFromExpense(expense) {
  return {
    expenseTypeId: String(expense.expenseTypeId),
    amount: String(expense.amount),
    date: expense.date,
    name: expense.name,
    description: expense.description || "",
  };
}

/**
 * The Add/Edit Expense form. Rendered inside a Modal by ExpensesPage;
 * `onCancel` closes it without saving, `onSubmit` (async) is awaited and, on
 * success, the parent closes the modal - this component doesn't manage its
 * own open/closed state.
 *
 * When `initialValue` (an existing expense record) is passed, the form
 * pre-fills from it and switches into "edit" mode (heading + button label).
 */
export default function ExpenseForm({ expenseTypes, initialValue, onSubmit, onCancel }) {
  const isEditing = Boolean(initialValue);
  const [form, setForm] = useState(() => (initialValue ? formFromExpense(initialValue) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateExpense(form);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        expenseTypeId: Number(form.expenseTypeId),
        amount: Math.round(Number(form.amount) * 100) / 100,
        date: form.date,
        name: form.name.trim(),
        description: form.description.trim(),
      });
      // Success: the parent closes the modal, which unmounts this form.
    } catch {
      setErrors({ form: "Couldn't save this expense. Please try again." });
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2>{isEditing ? "Edit Expense" : "Add Expense"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="expenseType">Expense Type *</label>
            <select
              id="expenseType"
              value={form.expenseTypeId}
              onChange={(e) => update("expenseTypeId", e.target.value)}
              aria-invalid={Boolean(errors.expenseTypeId)}
              aria-describedby={errors.expenseTypeId ? "expenseType-error" : undefined}
            >
              <option value="">Select…</option>
              {expenseTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.expenseTypeId && (
              <div className="row-error" id="expenseType-error" role="alert">
                {errors.expenseTypeId}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="amount">Amount *</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
            {errors.amount && (
              <div className="row-error" id="amount-error" role="alert">
                {errors.amount}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              min={minAllowedDateISO()}
              max={maxAllowedDateISO()}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "date-error" : undefined}
            />
            {errors.date && (
              <div className="row-error" id="date-error" role="alert">
                {errors.date}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              maxLength={80}
              placeholder="e.g. Weekly grocery run"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <div className="row-error" id="name-error" role="alert">
                {errors.name}
              </div>
            )}
          </div>
        </div>

        <div className="field field-wide">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={3}
            maxLength={500}
            placeholder="Optional notes"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && (
            <div className="row-error" id="description-error" role="alert">
              {errors.description}
            </div>
          )}
        </div>

        {errors.form && <div className="error-msg">{errors.form}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={submitting}>
            {isEditing ? (submitting ? "Saving…" : "Update Expense") : submitting ? "Adding…" : "Add Expense"}
          </button>
        </div>
      </form>
    </>
  );
}
