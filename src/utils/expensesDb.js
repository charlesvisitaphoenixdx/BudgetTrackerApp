import { openDB } from "idb";

// IndexedDB storage for expense transaction records. Configuration data
// (expense types, start day) intentionally stays in localStorage — see
// claude/requirements.md for the rationale (small/simple vs. potentially
// large/queryable data).

const DB_NAME = "budget-tracker-db";
const DB_VERSION = 1;
const STORE_EXPENSES = "expenses";

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
          const store = db.createObjectStore(STORE_EXPENSES, { keyPath: "id" });
          store.createIndex("by-date", "date");
          store.createIndex("by-expenseTypeId", "expenseTypeId");
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Adds a new expense record. `expense` should already be validated
 * (see utils/expenseValidation.js) and have numeric `expenseTypeId`/`amount`.
 * Returns the stored record, including its generated `id` and `createdAt`.
 */
export async function addExpense(expense) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const record = { ...expense, id, createdAt: new Date().toISOString() };
  await db.add(STORE_EXPENSES, record);
  return record;
}

/** Returns all expense records, in no particular order (sort in the UI). */
export async function getAllExpenses() {
  const db = await getDb();
  return db.getAll(STORE_EXPENSES);
}

/** Deletes a single expense record by id. */
export async function deleteExpense(id) {
  const db = await getDb();
  await db.delete(STORE_EXPENSES, id);
}

/**
 * Updates an existing expense record. `updates` is the same shape as
 * addExpense's input (expenseTypeId, amount, date, name, description) -
 * `id` and `createdAt` are preserved from the existing record, and an
 * `updatedAt` timestamp is set. Returns the updated record, or throws if
 * no record with that id exists.
 */
export async function updateExpense(id, updates) {
  const db = await getDb();
  const existing = await db.get(STORE_EXPENSES, id);
  if (!existing) {
    throw new Error(`No expense found with id ${id}`);
  }
  const record = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
  await db.put(STORE_EXPENSES, record);
  return record;
}

// Exposed for tests/tooling that need to reset state between runs.
export function _resetDbConnectionForTests() {
  dbPromise = undefined;
}
