# QA Report — Expense Entry Module

**Date:** 2026-09-10
**Build tested:** production build (`npm run build` + `npm run preview`)
**Method:** automated browser testing (Playwright/Chromium) driving the real UI, plus the Vitest unit suite for the pure `validateExpense()` logic.
**Result:** 25/25 test cases passing. No application bugs found in this pass.

## Test cases

### Form validation

| ID | Test case | Result |
|---|---|---|
| TC-01 | Form renders with the seeded expense types and today's date pre-filled | Pass |
| TC-02 | A fully valid submission adds the expense, shows a success message, and resets the form (keeping the date for quick consecutive entries) | Pass |
| TC-03 | Missing Expense Type is rejected with an inline error | Pass |
| TC-04 | Missing Amount is rejected with an inline error | Pass |
| TC-05 | Missing Date is rejected with an inline error | Pass |
| TC-06 | Missing Name is rejected with an inline error | Pass |
| TC-07 | Amount of exactly 0 is rejected | Pass |
| TC-08 | A negative amount is rejected | Pass |
| TC-09 | The Amount field's native `type="number"` already blocks non-numeric keystrokes at the browser level | Pass |
| TC-10 | An amount with more than 2 decimal places is rejected | Pass |
| TC-11 | A whole-number amount is accepted and displayed as `X.00` | Pass |
| TC-12 | A name over 80 characters: the field's `maxLength` truncates it while typing, and the app's own validation still rejects a value that bypasses that (e.g. a paste) | Pass |
| TC-13 | A name of exactly 80 characters is accepted (boundary) | Pass |
| TC-14 | A description over 500 characters: same `maxLength`-truncation-plus-validation-backstop story as TC-12 | Pass |
| TC-15 | Multiple invalid fields all show their own errors at once | Pass |
| TC-16 | Rapid double-clicking Submit does not create a duplicate record | Pass |

### List, deletion, sorting, persistence

| ID | Test case | Result |
|---|---|---|
| TC-17 | Empty-state message shown when no expenses have been logged yet | Pass |
| TC-18 | The list sorts by date, most recent first | Pass |
| TC-19 | Deleting an expense removes it from the list | Pass |
| TC-20 | Expenses persist across a page reload (IndexedDB) | Pass |

### Interplay with the Configuration module

| ID | Test case | Result |
|---|---|---|
| TC-21 | An expense whose category was later deleted in Configuration still displays gracefully, labeled "Deleted category," with no crash | Pass |
| TC-22 | With zero expense types configured, the Add Expense form shows a fallback message with a working link back to Configuration instead of a broken/empty dropdown | Pass |

### Cross-cutting

| ID | Test case | Result |
|---|---|---|
| TC-23 | Every form field (Expense Type, Amount, Date, Name, Description) has an associated `<label>` | Pass |
| TC-24 | No JavaScript console errors during the run | Pass |
| TC-25 | No uncaught runtime errors during the run | Pass |

## Notable findings (not bugs)

Two of the planned test cases turned out to be testing something the browser already guarantees, which is worth recording since it shaped how the tests above are written:

- The **Amount** field is a native `<input type="number">`, which already refuses non-numeric keystrokes (you cannot type "abc" into it at all). The app's own "Amount must be a number" check in `validateExpense()` is therefore unreachable through normal typing — it remains as a defense-in-depth guard (relevant for a pasted value or a future change to the field type) and is verified directly by the unit tests.
- The **Name** (80) and **Description** (500) fields use the HTML `maxLength` attribute, which truncates text while typing before it ever gets long enough to trip the app's own length check. Both test cases were adjusted to first confirm the `maxLength` protection, then deliberately bypass it (simulating a pasted or programmatically-set value) to confirm `validateExpense()` still catches an over-length value as a second line of defense.

Neither is a defect — both are two independent layers of protection working as intended — but a reviewer reading only "TC-09/TC-12/TC-14 test whether X is rejected" might expect the rejection to come from an on-screen error message rather than from the browser silently preventing the input in the first place. Recorded here for that reason.

## Regression check

This suite exercises the whole Expense Entry module fresh each run, plus the parts of the Configuration module it touches (deleting an expense type, deleting all expense types). The full 26-test Vitest unit suite (`period.js` + `expenseValidation.js`) and the 34-test Configuration-module QA suite from the previous pass were not re-run as part of this session, since this module's code doesn't modify `period.js`, `ExpenseTypesManager.jsx`'s validation, or `useLocalStorageState` — see `docs/qa/QA-report-2026-09-10.md` for that pass. Re-running the Configuration suite is recommended before any release that also touches Configuration code.

## Not covered by this pass

Editing an existing expense (not built — only add/delete), any reporting or filtering of expenses against the configured budget period (not built yet), cross-browser testing (Chromium only), and behavior under IndexedDB storage-quota pressure.
