import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import { SEED_TYPES } from "../components/ExpenseTypesManager.jsx";
import { useExpenses } from "../hooks/useExpenses.js";
import { useLocalStorageState } from "../hooks/useLocalStorageState.js";

export default function ExpensesPage({ onGoToConfiguration }) {
  const [expenseTypes] = useLocalStorageState("config.expenseTypes", SEED_TYPES);
  const { expenses, loading, error, addExpense, removeExpense } = useExpenses();

  return (
    <div className="wrap">
      <header className="page">
        <h1>Expenses</h1>
        <p>Log what you spend against your configured expense types.</p>
      </header>

      <ExpenseForm expenseTypes={expenseTypes} onSubmit={addExpense} onGoToConfiguration={onGoToConfiguration} />

      {error && <p className="error-msg">{error}</p>}
      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        <ExpenseList expenses={expenses} expenseTypes={expenseTypes} onDelete={removeExpense} />
      )}
    </div>
  );
}
