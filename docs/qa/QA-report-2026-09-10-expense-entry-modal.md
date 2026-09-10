# QA Report — Expense Entry Modal Refactor

**Date:** 2026-09-10
**Change tested:** the Add Expense form moved off the main Expenses screen into a modal opened by a new "+ Add Expense" button, with explicit Add Expense / Cancel actions.
**Build tested:** production build (`npm run build` + `npm run preview`)
**Method:** automated browser testing (Playwright/Chromium) driving the real UI.
**Result:** 34/34 test cases passing. No application bugs found.

This supersedes the form-specific parts of `docs/qa/QA-report-2026-09-10-expense-entry.md` (same test cases, re-run against the new modal flow) and adds modal-mechanics coverage that didn't previously apply.

## Modal mechanics (new)

| ID | Test case | Result |
|---|---|---|
| TC-M1 | Modal is closed on initial page load | Pass |
| TC-M2 | Clicking "+ Add Expense" opens the modal with the form | Pass |
| TC-M3 | Cancel closes the modal without adding a row | Pass |
| TC-M4 | Reopening after Cancel shows a fresh, empty form — an abandoned draft isn't remembered | Pass |
| TC-M5 | Pressing Escape closes the modal | Pass |
| TC-M6 | Clicking the backdrop outside the panel closes the modal | Pass |
| TC-M7 | Clicking inside the panel does not close it | Pass |
| TC-M8 | Page scroll is locked while the modal is open and restored after closing | Pass |
| TC-M9 | The modal panel exposes `role="dialog"` and `aria-modal="true"` for assistive tech | Pass |

## Form validation (re-run inside the modal)

All 16 cases from the original Expense Entry pass (required fields, amount edge cases, name/description length limits and their `maxLength` interplay, multiple simultaneous errors, double-submit protection) were re-run against the modal version of the form and still pass. See the earlier report for the full list and the "native input already blocks this" observations, which still apply unchanged.

## List, deletion, sorting, persistence, and Configuration interplay

Also re-run unchanged: empty-state message, sort order, delete, IndexedDB persistence across reload, graceful "Deleted category" display, and — updated for this change — with zero expense types configured, the **"+ Add Expense" button itself is now replaced** by the fallback message and link to Configuration, rather than the old inline form showing that message in its place.

## Cross-cutting

All Expense Entry fields keep their accessible labels inside the modal; no console or runtime errors were observed across the full run.

## Not covered by this pass

Focus/tab order inside the modal (e.g. confirming focus moves into the dialog on open and returns to the trigger button on close) was not scripted — only Escape, backdrop click, and Cancel were verified as closing mechanisms. Screen-reader announcement behavior beyond the `role`/`aria-modal` attributes was not tested with an actual screen reader.
