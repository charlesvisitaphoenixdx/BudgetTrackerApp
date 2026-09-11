import { useCallback, useEffect, useState } from "react";
import {
  addExpense as dbAddExpense,
  deleteExpense as dbDeleteExpense,
  updateExpense as dbUpdateExpense,
  getAllExpenses,
} from "../utils/expensesDb.js";

/**
 * Loads expense records from IndexedDB and exposes add/update/remove
 * helpers that keep local React state in sync with storage.
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const all = await getAllExpenses();
      setExpenses(all);
      setError("");
    } catch {
      setError("Couldn't load expenses from local storage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addExpense = useCallback(async (data) => {
    const record = await dbAddExpense(data);
    setExpenses((prev) => [...prev, record]);
    return record;
  }, []);

  const editExpense = useCallback(async (id, data) => {
    const record = await dbUpdateExpense(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? record : e)));
    return record;
  }, []);

  const removeExpense = useCallback(async (id) => {
    await dbDeleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { expenses, loading, error, addExpense, editExpense, removeExpense };
}
