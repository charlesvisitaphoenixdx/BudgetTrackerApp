# QA Report — 2026-09-11 — Post-Audit Fixes (F1–F7)

## Scope

Seven findings from the prior Business Analyst audit, all reported by the
Developer as fixed:

- F1: unhandled promise rejection / no user feedback on failed expense delete
- F2: no confirmation before deleting an expense
- F3: Modal doesn't manage focus (no focus trap, no focus restore)
- F4: form field errors not wired for assistive tech (no aria-invalid/describedby/role=alert)
- F5: delete button nested inside a `role="button"` div (ARIA anti-pattern)
- F6: no upper bound on expense amount
- F7: no bounds on expense date (far past / far future)

This report covers:

- Unit tests (Vitest)
- Production build
- Dynamic verification against the built app served via `vite preview`,
  driven headlessly with Chromium via Playwright (the globally installed
  `playwright` package, since `playwright-core` isn't a project
  dependency), plus targeted code reading for the parts that aren't
  practically triggerable through the real UI.

## Method

Same methodology as prior QA passes: run `npm run test` and `npm run
build`, then serve the production bundle with `vite preview` and drive the
real UI with Playwright rather than only reading code. Script:
`qa_fixes.js` + a small follow-up `qa_f4_date.js` (session scratchpad).
For each finding, code was also read directly against the Developer's
description to confirm the diff actually does what's claimed.

One finding (F1) has a code path — a genuine `dbDeleteExpense` storage
failure — that IndexedDB's real `delete()` doesn't produce for an
ordinary UI-driven scenario (deleting a non-existent key still resolves
successfully per the IDB spec), so that half of F1 is verified by code
reading only; everything else was exercised live.

## Results

**Unit tests:** 32/32 passed (`src/utils/period.test.js` — 9,
`src/utils/expenseValidation.test.js` — 23, including 6 new cases for
F6/F7). **Build:** succeeded, production bundle + PWA precache generated
with no errors. **Dynamic pass:** 19/19 scripted assertions passed across
F1–F7 (plus 1 follow-up assertion for F4's date field), with zero browser
console errors or uncaught exceptions during the whole run.

| Finding | Verified | Method |
|---|---|---|
| F1 — delete error handling | Yes | Code + live (no unhandled rejections observed; storage-failure branch verified by code only) |
| F2 — delete confirmation | Yes | Live: `window.confirm` dialog shown with exact wording, cancel/accept both behave correctly |
| F3 — modal focus management | Yes | Live: focus moves in, Tab trap wraps at both ends, Escape closes and restores focus to trigger |
| F4 — field-level ARIA wiring | Yes | Live: all 5 fields' aria-invalid/aria-describedby/role=alert confirmed, including date field with a real date error |
| F5 — row markup / nested interactive controls | Yes | Live + code: 0 nested `button` inside `div[role=button]` app-wide; row is a plain div with two sibling buttons |
| F6 — amount ceiling | Yes | Unit tests + live: 1,000,000 accepted, 1,000,001 rejected with clear message |
| F7 — date bounds | Yes | Unit tests + live: `min`/`max` set on the date input; 5-years-future and 60-years-past both rejected with correct messages |

### Notes on method

- The initial dynamic script submitted a fully empty form to probe F4 for
  all fields at once. The date field never showed as invalid this way —
  not a bug, but because the form initializes `date` to today's date, so
  an empty-form submit never leaves that field blank. A follow-up script
  forced an actual date-range validation error (far-future date) and
  confirmed the same aria-invalid/aria-describedby/role="alert" wiring
  applies there too.
- `errors.form` (the top-level submit-failure message) was deliberately
  left untouched per F4's stated scope, and still renders as plain text —
  confirmed by reading `ExpenseForm.jsx`; this is expected, not a gap.
- Docs (`README.md`, `docs/USER_GUIDE.md`, `docs/TECHNICAL.md`) were
  checked against the corresponding code changes for F2, F3, F5, F6, F7
  and accurately describe the new behavior in each case.
- `git diff --stat` matches the file list the Developer reported for every
  finding, with no unexplained changes elsewhere.

## Bugs found

None. All seven findings behave as described, both in code and when
driving the real, built app. No regressions were observed in the existing
add/edit/delete/validation flows during the pass.

## Conclusion

All seven findings (F1–F7) are confirmed fixed. Unit tests and the
production build both pass. Safe to ship.
