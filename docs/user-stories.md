# BudgetTrackerApp — User Stories

Acceptance criteria for the features specified in `docs/requirements.md`.
Written to be buildable directly, without further clarification. Existing
user stories for the Configuration and Expense Entry modules are not
retroactively documented here (those modules are already implemented and
QA-passed — see `docs/qa/`); this file covers the **Budget Period Spending
Summary** feature only.

## Configuration: Monthly Budget Limit

### Story 1 — Set an overall monthly budget limit

**As a** user, **I want to** set an overall monthly budget limit in
Configuration, **so that** the Budget screen can tell me whether I'm over
or under it.

- **Given** the Configuration screen, **when** I open it, **then** I see a
  "Monthly Budget Limit" field (in addition to the existing Expense Types
  and Budget Period Start Day sections), empty by default if no limit has
  ever been set.
- **Given** the Monthly Budget Limit field, **when** I enter a positive
  number (e.g. `1200` or `1200.50`) and it commits (same
  commit-on-blur/Enter pattern as the Start Day field), **then** it is
  saved to `config.budgetLimits.overall`, rounded to 2 decimal places.
- **Given** a previously-set limit, **when** I clear the field entirely and
  it commits, **then** `config.budgetLimits.overall` becomes `null` (no
  budget set), not `0`.
- **Given** the Monthly Budget Limit field, **when** I enter `0`, a
  negative number, or non-numeric text, **then** I see a validation error
  inline (e.g. "Enter a positive amount, or leave blank for no limit.")
  and the previous value is retained (same revert-on-invalid pattern as
  `ExpenseTypesManager`'s rename validation).
- **Given** a limit is already set, **when** I reload the app, **then** the
  Monthly Budget Limit field shows the previously saved value (persisted
  via `localStorage`, same as other Configuration fields).

## Budget screen: viewing the active period

### Story 2 — View spending for the current period, no budget set

**As a** user who hasn't set a budget limit yet, **I want to** still see
what I've spent in the current period, **so that** I get value from the
feature before configuring a limit.

- **Given** `config.budgetLimits.overall` is `null`/unset, **when** I open
  the Budget screen, **then** I see the current period's date range, a
  total-spent figure (sum of all expenses dated within that range), the
  per-type breakdown, and a "No budget set for this period" message with a
  link/button to Configuration — no over/under language is shown.
- **Given** no expenses exist at all, **when** I open the Budget screen,
  **then** the total shows as `$0.00`-equivalent (via `formatAmount`) and
  the breakdown section shows an empty/placeholder state (e.g. "No
  expenses logged in this period yet.") rather than an error.

### Story 3 — View spending under budget

**As a** user with a budget limit set, **I want to** see that I'm under
budget, **so that** I know I have headroom.

- **Given** `config.budgetLimits.overall` is `1200.00` and the current
  period's total spent is `340.00`, **when** I open the Budget screen,
  **then** I see an "under budget" indicator showing the amount spent, the
  limit, and the remaining amount (`860.00`), visually distinct from the
  over-budget state (e.g. a different color/icon, consistent with the
  app's existing use of color for expense-type swatches).
- **Given** total spent exactly equals the limit (e.g. both `1200.00`),
  **when** I view the indicator, **then** it shows as "under budget" (with
  `0.00` remaining), not "over budget" — the boundary is inclusive of
  under.

### Story 4 — View spending over budget

**As a** user with a budget limit set, **I want to** clearly see when I've
gone over, **so that** I can adjust my spending.

- **Given** `config.budgetLimits.overall` is `1200.00` and the current
  period's total spent is `1340.00`, **when** I open the Budget screen,
  **then** I see an "over budget" indicator showing the amount spent, the
  limit, and the amount over (`140.00`), visually distinct from the
  under-budget state.

### Story 5 — Per-type spending breakdown

**As a** user, **I want to** see which categories I've spent on in the
current period, **so that** I understand where my money went, not just the
total.

- **Given** the current period has expenses in "Groceries" (total
  `120.00`) and "Transport" (total `45.00`), and no expenses in any other
  configured type, **when** I view the Budget screen, **then** I see two
  breakdown rows — Groceries `120.00` and Transport `45.00` — and no rows
  for types with zero spend in the period.
- **Given** an expense in the current period whose `expenseTypeId` no
  longer matches any entry in `config.expenseTypes` (its type was
  deleted), **when** I view the breakdown, **then** its amount is grouped
  under a "Deleted category" row, consistent with how `ExpenseList`
  displays such expenses on the Expenses screen.
- **Given** the breakdown rows, **when** I view them, **then** they are
  read-only (no click-to-edit) — editing happens on the Expenses screen.

## Budget screen: period navigation

### Story 6 — Navigate to the previous period

**As a** user, **I want to** look at a past budget period's spending,
**so that** I can review how I did.

- **Given** the Budget screen showing the current period, **when** I click
  "Previous", **then** the screen updates to show the immediately prior
  period (computed via `shiftPeriod(currentPeriod, startDay, -1)`) — its
  date range, total spent, breakdown, and indicator all recompute for that
  period's expenses.
- **Given** I've navigated to a past period, **when** I click "Previous"
  again, **then** it moves back one more period each time, with no lower
  bound (consistent with `shiftPeriod`'s existing behavior).

### Story 7 — Navigate to the next period

**As a** user, **I want to** check a future period (e.g. one that just
started or hasn't started yet), **so that** I can see it's empty or
confirm today's expenses landed in the right one.

- **Given** the Budget screen on any period, **when** I click "Next",
  **then** the screen updates to show the next period (`shiftPeriod(...,
  1)`), recomputing total/breakdown/indicator for it — a future period
  with no expenses yet shows the zero-state described in Story 2, not an
  error.
- **Given** I've navigated away from the current (today's) period, **when**
  I view the screen, **then** there is a clear way back to the current
  period (e.g. a "Today"/"Current period" button), so users aren't stuck
  clicking Previous/Next repeatedly to get back.

### Story 8 — Period navigation respects the configured start day

**As a** user who changes my Budget Period Start Day in Configuration,
**I want to** the Budget screen to reflect the new period boundaries,
**so that** the two settings stay consistent.

- **Given** I change `config.startDay` in Configuration, **when** I return
  to the Budget screen, **then** the "current period" and all navigation
  is recomputed using the new start day (via `periodFor`/`shiftPeriod`,
  same as `PeriodSettings`' own preview already does) — no stale period
  boundaries from before the change.
