# QA Report — 2026-09-25 — Filters Search Field Width Fix

## Scope

Bug fix, reported by the user from manual testing: on the Expenses screen's
Filters accordion, the "Search (name or description)" field rendered small
and visually misaligned with "Max amount" above it. No requirements/story
change — this is a CSS-only fix to the rendering of the Filters section
already covered by `docs/requirements.md`'s "Feature: Expense List
Filtering" (+ its 2026-09-23 expense-type addendum) and Stories 22-26 in
`docs/user-stories.md`; those stories' acceptance criteria are about
filtering behavior, not this field's pixel width, so nothing there needed
updating. New/changed source: `src/App.css` only.

## Root cause

`.field input[type="text"]` (added for `PeriodSettings`, `App.css` ~line
218) hard-codes `width: 160px`. Fields inside `.form-grid` (the four
grid-laid-out filter fields) get overridden back to `width: 100%` by a
same-specificity, later-declared rule (`.form-grid .field input`). The
Search field, however, lives in a `.field.field-wide` wrapper *outside*
`.form-grid` (full-width single-row layout, same wrapper class
`ExpenseForm`'s Description textarea uses) — and the existing "make
`.field-wide` full width" rule only listed `.field-wide textarea`, not
`.field-wide input`. So the Search `<input>` fell through to the 160px
default with nothing overriding it: same left edge as the grid above it,
but far short on the right — exactly "small and not aligned with Max
amount." This was a gap left over from when `.field-wide` was only ever
used for a `<textarea>`, before the Filters feature (2026-09-23) reused it
for a text `<input>` without extending that selector.

**Fix:** added `.field-wide input[type="text"]` alongside `.field-wide
textarea` in that rule (`App.css`). Matched on `input[type="text"]`
specifically (specificity equal to the original 160px rule, so the later
declaration wins) rather than a bare `.field-wide input`, which would lose
that specificity contest and have no effect — confirmed by live
measurement below; a first attempt using the bare selector was tried and
measured to have made no visible difference before landing on this fix.

## Method

`npm test`, then `npm run build && npm run preview`, driven headlessly
with Chromium via Playwright against the served production build.
Playwright (not a project dependency) obtained the same way as prior
passes: cached locally, required by an absolute path into the npx cache
(`playwright` v1.63.0, `ms-playwright/chromium-1243`). The run started
from a clean slate (`localStorage.clear()` + `indexedDB.deleteDatabase
("budget-tracker-db")`).

**Live measurement (`getBoundingClientRect`/computed style), before and
after:**

| | `#filterMaxAmount` width | `#filterSearch` width | Aligned? |
|---|---|---|---|
| Before | 331px | 160px | No — same left edge (x=301), right edge 171px short |
| After | 331px | 678px (full card content width) | Yes — spans the full row, same left/right edges as the grid above |

A full-page screenshot at 900px confirmed the fix visually: the Search
field now spans edge-to-edge, aligned with the fields above it.

**Regression:** re-ran the full 32-case Playwright suite from
`QA-report-2026-09-23-expense-type-filter.md` (date range, amount range,
search, expense-type filter, AND-combination, clear/reset, accordion
behavior, deleted-type edge case, Dashboard-isolation criticals, expense
CRUD) against the rebuilt bundle. Also re-checked the existing "no
horizontal overflow at 390px phone width" case (TC-27 in
`QA-report-2026-09-10.md`) at the new full-width Search field's mobile
breakpoint, since widening an element is exactly the kind of change that
could reintroduce that class of bug.

## Results

**Unit tests:** 55/55 passed — no change (this is a CSS-only fix; no
`src/utils/` logic touched).

**Production build:** succeeded with no errors both before and after the
fix (50 modules).

**Regression: 32/32 passed**, identical to `QA-report-2026-09-23-expense-
type-filter.md`'s full case list (SETUP-1, TC-1 through TC-30, CONSOLE) —
not reproduced as a table here to avoid duplicating that report; see it
directly for the full case-by-case list. Re-run confirms this CSS change
didn't regress any filtering, accordion, Dashboard-isolation, or CRUD
behavior.

| ID | Case | Result |
|---|---|---|
| BUG-1 | `#filterSearch` renders at 160px, 171px short of `#filterMaxAmount`'s 331px, both sharing the same left edge | **Confirmed (before fix)** |
| FIX-1 | After the `App.css` change, `#filterSearch` renders at 678px, spanning the same left-to-right edges as the grid above it | **PASS (after fix)** |
| FIX-2 | No horizontal overflow at 390px phone width with the now-full-width Search field | PASS |
| REGR | Full 32-case suite from the 2026-09-23 expense-type-filter pass | 32/32 PASS |

## Bugs found

1. **Application bug (this report's subject):** the Filters section's
   Search field rendered at a fixed 160px instead of the full row width,
   visually small and misaligned with the fields above it — as reported by
   the user from manual testing. Root cause and fix above. Confirmed fixed
   by direct measurement, not just visual impression.
2. No new bugs found during regression.

## Conclusion (original fix, superseded — see Follow-up below)

The reported UI issue was real, reproduced with an exact pixel
measurement, and is fixed with a single, narrowly-scoped CSS rule addition
that doesn't affect any other `.field-wide` usage (`ExpenseForm`'s
Description textarea, unaffected — confirmed the selector only targets
`input[type="text"]`, not `textarea`, and no other `.field-wide` input
exists in the codebase). Full existing regression suite (32 cases) plus
the mobile-overflow check pass cleanly. Safe to ship.

## Follow-up (same day, 2026-09-25): "in line with" meant same row, not matching edges

After the fix above shipped, the user clarified the actual ask: "free text
search should be in line with the max amount field" — i.e. Search
belongs *beside* Max amount in the same grid row, not on its own full-width
row underneath it (even a correctly-edge-aligned one). The original fix
satisfied the letter of "not aligned with Max amount" (matching left/right
edges) but not what was actually meant.

**Corrected fix:** moved the Search field out of its standalone
`.field.field-wide` wrapper and into `.form-grid` itself, as the sixth
item right after Max amount — the grid is exactly 3 rows × 2 columns now
(Expense type/From, To/Min amount, Max amount/Search), so Search lands in
the same row as Max amount with no leftover empty cell. Since it's now a
plain `.form-grid .field input`, it automatically gets the existing
`width: 100%` grid-cell rule — no new CSS needed. The `.field-wide
input[type="text"]` rule added by the original fix became dead code (no
`.field-wide` input exists anymore, only `ExpenseForm`'s Description
`textarea`) and was removed.

**Re-verification:**
- Live measurement: `#filterMaxAmount` and `#filterSearch` now report the
  identical `y` position (478.5) and equal widths (331px each), confirmed
  side-by-side in the same grid row.
- Screenshots at 900px (desktop) and 390px (mobile) confirm the same
  visually: side-by-side on desktop, stacked single-column with no
  horizontal overflow on mobile (`document.documentElement.scrollWidth >
  clientWidth` is `false`), same as every other grid field pair.
- Full 32-case regression suite from
  `QA-report-2026-09-23-expense-type-filter.md` re-run against the
  corrected build: 32/32 passed.
- `npm test`: 55/55 passed (unchanged — no logic touched).

**Corrected conclusion:** Search now sits inline with Max amount, matching
the user's actual request, verified live (not just visually assumed) with
matching row position, equal cell width, and no mobile-overflow
regression. Full regression suite and unit tests remain clean. Safe to
ship.
