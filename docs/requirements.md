# BudgetTrackerApp — Requirements

This file specifies the next increment of work in concrete, buildable
detail. For standing architecture/scope decisions and their rationale, see
`claude/requirements.md`. For how the app is currently built, see
`docs/TECHNICAL.md`. User-facing acceptance criteria for this feature are
in `docs/user-stories.md`.

## Feature: Budget Period Spending Summary

### Problem

BudgetTrackerApp has two working modules — Configuration (expense types,
budget-period start day) and Expense Entry (add/edit/delete/view expenses)
— but nothing connects them. There is no view that shows how much has been
spent in the current (or any) budget period, broken down by category, or
whether that spending is over or under a budget. This is the core "budget
tracking" value proposition of the app, and it doesn't exist yet
(`docs/TECHNICAL.md` "Known limitations", `docs/USER_GUIDE.md` "What's
coming next").

### Scope decision: overall budget limit only (this increment)

There is currently no "budget limit/amount" concept anywhere in the app —
only the budget *period* start day (confirmed by search: no `limit` or
`budget` amount field in `src/`). This feature introduces one.

**In scope:** a single **overall monthly budget limit** — one optional
number, set in Configuration, compared against total spending across all
expense types for the active period.

**Out of scope (this increment):** per-expense-type budget limits (e.g.
capping "Groceries" at $400 independently of the overall limit). The
summary view **does** show spending broken down by type (read-only), just
not a limit per type. See rationale and trade-off in
`claude/requirements.md` ("Budget limit scope" decision, 2026-09-11) and
the backlog item below for the future per-type-limit story.

### In scope (this increment)

1. A new **Budget** screen, reachable via a third top-nav button alongside
   Expenses and Configuration.
2. For the currently-active budget period (computed from `config.startDay`
   and today's date via the existing `periodFor()`):
   - The period's date range (e.g. "Sep 5 – Oct 4, 2026").
   - Total amount spent (sum of expense amounts whose `date` falls within
     the period's `start`–`end` range, inclusive).
   - Spending broken down by expense type: for each expense type that has
     at least one expense in the period, its subtotal; types with zero
     spend in the period are omitted from the breakdown (not shown as
     $0.00 rows). Expenses whose `expenseTypeId` no longer matches any
     configured type are grouped under a "Deleted category" subtotal, same
     convention as `ExpenseList` (`src/utils/format.js`,
     `docs/TECHNICAL.md` "Data model").
   - An over/under/no-budget-set indicator (see states below).
3. **Period navigation:** "Previous" / "Next" controls that move to the
   adjacent period using the existing `shiftPeriod()` (`src/utils/period.js`)
   and re-run the same aggregation for the newly-selected period. No limit
   on how far back or forward a user can navigate (both are already
   supported by `shiftPeriod`); a period with zero expenses simply shows
   $0.00 total and an empty breakdown, not an error state.
4. A new **Monthly Budget Limit** setting in Configuration: an optional
   number input. Empty/unset means "no budget configured" (see indicator
   states). If set, it must be a positive number (up to 2 decimal places,
   same normalization as expense `amount` — round to 2 decimals on save).
   There is no upper bound.

### Out of scope (explicitly, this increment)

- Per-expense-type budget limits (see Scope decision above).
- Editing/deleting expenses from the Budget screen — it's read-only;
  users go to the Expenses screen to make changes (consistent with the
  existing two-screen model where each screen owns one job).
- Carrying over unspent budget between periods, or averaging spend across
  periods — each period is evaluated independently against the same flat
  limit.
- Currency formatting/locale (tracked separately — see backlog below;
  amounts continue to use `formatAmount()`'s plain fixed-point display).
- Charts/graphs (e.g. pie chart of category breakdown). This increment is
  a numeric summary list; visualization can be a later enhancement.
- Notifications/alerts when a period goes over budget. This is a
  passive, on-open indicator only.

### Data model additions

New `localStorage` key, alongside the existing `config.expenseTypes`,
`config.startDay`, `config.previewDate` (see `docs/TECHNICAL.md` "Data
model"):

- `config.budgetLimits` — object, shape:
  ```json
  { "overall": 1200.00 }
  ```
  An object (not a bare number) so a future per-type-limit story (see
  backlog) can add e.g. `"byType": { "1": 400.00 }` without a breaking
  format change or a `localStorage` key migration. `overall` is `null` or
  the key absent when no limit is configured (both must be treated as "no
  budget set" — don't rely on only one representation). When set, it's a
  number rounded to 2 decimal places, same convention as expense `amount`.
  Read/written via `useLocalStorageState("config.budgetLimits", { overall: null })`,
  consistent with how existing config state is managed.

No changes to the IndexedDB expense record shape or to `expensesDb.js`'s
CRUD functions are needed — this feature only *reads* existing expense
records (via `getAllExpenses()`) and filters/aggregates them in memory
against the active period's date range and `config.expenseTypes`. The
`by-date` index mentioned in `docs/TECHNICAL.md` exists for this purpose
but an in-memory filter over `getAllExpenses()` is sufficient at expected
data volumes for this increment; revisit only if performance becomes a
real issue with a large expense history.

### Indicator states

Given a period's total spent and `config.budgetLimits.overall`:

| State | Condition | Display (suggested wording) |
|---|---|---|
| No budget set | `overall` is `null`/absent | "No budget set for this period." + link/button to Configuration |
| Under budget | `overall` is set and `total spent <= overall` | e.g. "$340.00 of $1,200.00 — $860.00 remaining" |
| Over budget | `overall` is set and `total spent > overall` | e.g. "$1,340.00 of $1,200.00 — $140.00 over budget" |

"Under budget" includes the boundary case of spending exactly equal to the
limit (not treated as "over").

### Backlog pass — `docs/TECHNICAL.md` "Known limitations / open items"

| Item | Disposition | Reasoning |
|---|---|---|
| No cross-device sync | Out of scope (standing) | By design per the client-only architecture decision (`claude/requirements.md`); not a gap to close, a deliberate trade-off. |
| No automated component/UI test suite | Future story (not this increment) | Real gap, but orthogonal to the budget-summary feature; the existing pure-function unit test + scripted-browser-QA pattern (`docs/TECHNICAL.md` "Testing strategy") is adequate to ship this feature safely without blocking on new test infra. |
| No CI configured | Future story (not this increment) | Same reasoning as above — valuable but unrelated to unblocking the core budget-tracking gap; low urgency while the team is small and QA is manual-but-thorough. |
| Placeholder PWA icons | Future story, low priority | Cosmetic/branding only; no functional impact on budget tracking. |
| Expense Types: only `name` + `color` | Partially addressed by this increment, remainder queued | The overall budget limit doesn't live on the expense type itself, so this item isn't fully closed; a future "per-type limit" story would add a limit field to expense types, at which point this line item should be reconsidered together with that story. |
| Expenses not connected to budget period | **This increment** | This is the feature specified above. |
| No currency/locale handling | Future story (not this increment) | Real gap that will become more visible once totals/limits are shown side by side on the new Budget screen, but it's a formatting concern that's separable from the aggregation logic being built now — `formatAmount()` can be swapped out later without touching the aggregation. |
| No expense-type snapshot on expense records (renamed/deleted type changes past display) | Out of scope (standing MVP trade-off) | Explicit, already-documented trade-off (`claude/requirements.md`); the Budget Summary feature already accounts for it via the same "Deleted category" grouping used elsewhere, so it doesn't need to be solved to build this feature. |

### Future backlog item (new, raised by this feature)

- **Per-expense-type budget limits.** Extend `config.budgetLimits` with a
  `byType` map and show a per-type over/under indicator alongside the
  existing per-type spend breakdown. Deferred out of this increment — see
  `claude/requirements.md`'s "Budget limit scope" decision for the
  trade-off.
