import { useState } from "react";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import Modal from "../components/Modal.jsx";
import { SEED_TYPES } from "../components/ExpenseTypesManager.jsx";
import { useExpenses } from "../hooks/useExpenses.js";
import { useLocalStorageState } from "../hooks/useLocalStorageState.js";

export default function ExpensesPage({ onGoToConfiguration }) {
  const [expenseTypes] = useLocalStorageState("config.expenseTypes", SEED_TYPES);
  const { expenses, loading, error, addExpense, editExpense, removeExpense } = useExpenses();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const isModalOpen = showAddModal || Boolean(editingExpense);

  function closeModal() {
    setShowAddModal(false);
    setEditingExpense(null);
  }

  async function handleSubmit(data) {
    if (editingExpense) {
      await editExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    closeModal();
  }

  return (
    <div className="wrap">
      <header className="page">
        <h1>Expenses</h1>
        <p>Log what you spend against your configured expense types.</p>
      </header>

      {expenseTypes.length === 0 ? (
        <section className="card">
          <h2>Add Expense</h2>
          <p className="sub">
            You don&apos;t have any expense types set up yet.{" "}
            <button type="button" className="link-btn" onClick={onGoToConfiguration}>
              Add one in Configuration
            </button>{" "}
            before logging an expense.
          </p>
        </section>
      ) : (
        <button type="button" className="primary add-expense-trigger" onClick={() => setShowAddModal(true)}>
          + Add Expense
        </button>
      )}

      {isModalOpen && (
        <Modal title={editingExpense ? "Edit Expense" : "Add Expense"} onClose={closeModal}>
          <ExpenseForm
            expenseTypes={expenseTypes}
            initialValue={editingExpense}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {error && <p className="error-msg">{error}</p>}
      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        <ExpenseList
          expenses={expenses}
          expenseTypes={expenseTypes}
          onDelete={removeExpense}
          onSelect={setEditingExpense}
        />
      )}
    </div>
  );
}
