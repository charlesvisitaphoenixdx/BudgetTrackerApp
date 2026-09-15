# BudgetTrackerApp — User Stories

Acceptance criteria for the features specified in `docs/requirements.md`.
Written to be buildable directly, without further clarification. Existing
user stories for the Configuration and Expense Entry modules are not
retroactively documented here (those modules are already implemented and
QA-passed — see `docs/qa/`); this file covers the **Budget Period Spending
Summary** feature only.

> **2026-09-11 consolidation note:** the standalone "Budget" screen
> described in Stories 2-8 below was merged into the Dashboard screen and
> then removed as its own nav item/page (`src/pages/BudgetPage.jsx` no
> longer exists). Every acceptance criterion in Stories 2-8 still holds —
> period navigation, the total/over/under indicator, and the per-category
> breakdown — it now lives in `src/pages/DashboardPage.jsx`'s "Selected
> Period" and "By Category" sections, alongside the Dashboard's own
> Spending Trend / Top Categories / type-filter features (Stories 13-18).
> Read "Budget screen" in Stories 2-8 as "Dashboard screen's Selected
> Period section."

> **2026-09-15 follow-up:** Stories 2-8's acceptance criteria are confirmed
> still accurate against shipped code, with one exception worth flagging:
> as shipped, applying the Dashboard's type filter (Story 16) also
> filtered the Selected Period total, hid "By Category," and suppressed
> the over/under indicator — something the original Budget screen never
> did. The new "Dashboard: Budget/Widgets section split" stories below
> (19-21) correct this and also give the Budget material its own visually
> distinct section, per direct product-owner feedback. Story 15 and Story
> 17 (the separate "current-period quick stat") are marked **superseded**
> below — see Story 19's note.

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

## Configuration: Per-Expense-Type Budget Limits

### Story 9 — Set a per-type budget limit

**As a** user, **I want to** cap an individual expense category
independently of the overall budget, **so that** I notice if one category
runs away even while my total spending looks fine.

- **Given** the Expense Types section of Configuration, **when** I view an
  existing type's row, **then** I see an optional "limit" input alongside
  its existing name and color controls, empty by default if no limit has
  ever been set for that type.
- **Given** a type's limit field, **when** I enter a positive number (e.g.
  `400` or `400.50`) and it commits (same commit-on-blur/Enter pattern as
  the name field), **then** it is saved to
  `config.budgetLimits.byType[String(type.id)]`, rounded to 2 decimal
  places.
- **Given** a type with a previously-set limit, **when** I clear the field
  entirely and it commits, **then** its key is removed from
  `config.budgetLimits.byType` (no limit), not set to `0` or `null`.
- **Given** a type's limit field, **when** I enter `0`, a negative number,
  or non-numeric text, **then** I see a validation error inline (e.g.
  "Enter a positive amount, or leave blank for no limit.") and the
  previous value is retained, same revert-on-invalid pattern as the name
  field's rename validation.
- **Given** a limit is already set for a type, **when** I reload the app,
  **then** that type's limit field shows the previously saved value.
- **Given** I add a brand-new expense type, **when** it's created, **then**
  it has no entry in `config.budgetLimits.byType` (same as every
  pre-existing type before this increment) until I explicitly set one.

## Budget screen: per-type indicators

### Story 10 — View a per-type over/under indicator in the category breakdown

**As a** user with a per-type limit set, **I want to** see whether that
specific category is over or under its own limit, **so that** I can spot
an overspending category even when my overall total still looks fine.

- **Given** "Groceries" has a limit of `150.00` and its spend for the
  current period is `120.00`, **when** I view the Budget screen's "By
  Category" breakdown, **then** the Groceries row shows an "under type
  limit" indicator (e.g. "of $150.00 — $30.00 remaining") alongside its
  existing dot/label/amount, visually distinct from the "over" state.
- **Given** Groceries' spend for the period is `160.00` instead, **when**
  I view the breakdown, **then** the Groceries row shows an "over type
  limit" indicator (e.g. "of $150.00 — $10.00 over"), visually distinct
  from the "under" state.
- **Given** Groceries' spend exactly equals its limit (both `150.00`),
  **when** I view the row, **then** it shows as "under type limit" (with
  `$0.00 remaining`), not "over" — same inclusive-boundary rule as the
  overall indicator.
- **Given** a type with no limit ever set (e.g. "Transport"), **when** I
  view its breakdown row, **then** it shows exactly as it did before this
  increment — dot, label, amount — with no indicator.

### Story 11 — Overall and per-type limits coexist independently

**As a** user, **I want to** the overall budget indicator and any per-type
indicators to reflect their own limits only, **so that** one category
running over doesn't misrepresent my overall standing (or vice versa).

- **Given** an overall limit of `1200.00` and a Groceries limit of
  `150.00`, and the current period's total spend is `800.00` (under
  overall) while Groceries alone is `160.00` (over its own limit),
  **when** I view the Budget screen, **then** the top-of-screen overall
  indicator shows "under budget" while the Groceries breakdown row
  simultaneously shows "over type limit" — neither indicator is
  suppressed or adjusted because of the other.
- **Given** the same setup, **when** I check whether anything warns that
  the per-type limit and overall limit could conflict, **then** nothing
  does — there is no cross-validation between them (by design; see
  `docs/requirements.md` "Out of scope" for this feature).

### Story 12 — Edge cases: a limit on a deleted type, and a type with no limit

**As a** user, **I want to** the per-type limit feature to behave
predictably around expense types that no longer exist or were never
limited, **so that** the Budget screen never shows confusing or stale
indicator state.

- **Given** a limit was previously set for an expense type that I've since
  deleted in Configuration, **when** I view the Budget screen, **then**
  expenses previously tagged with that type still group under the
  existing "Deleted category" row (same convention as the Budget Period
  Spending Summary feature), and that row shows **no** per-type indicator
  — there's no current type id to look up a limit against.
- **Given** that same now-deleted type's old limit entry, **when** I
  inspect `config.budgetLimits.byType` in storage, **then** the orphaned
  entry is still present (it is not scrubbed on type deletion — see
  `docs/requirements.md`'s "Edge case: a limit set on a since-deleted
  type") but has no visible effect anywhere in the app.
- **Given** a type with a limit set but zero expenses in the current
  period, **when** I view the breakdown, **then** that type's row is
  omitted entirely (same as any zero-spend type, limited or not) — it
  does not appear as a "$0.00 of $150.00" row. This is an explicit,
  documented deferral, not a bug (see `docs/requirements.md` "Out of
  scope").

## Dashboard: viewing spending trends and top categories

### Story 13 — View the spending trend across recent periods

**As a** user, **I want to** see how my spending has moved over the last
several budget periods, **so that** I can spot whether I'm trending up or
down, not just how one period looks in isolation.

- **Given** the Dashboard screen with the filter set to "All types",
  **when** I open it, **then** I see 6 period rows, oldest to newest,
  ending with the current period — each showing its date range, its total
  spend, and a bar whose width is proportional to that period's spend
  relative to the largest of the 6.
- **Given** one of those periods has no expenses at all, **when** I view
  the trend, **then** that period still appears as its own row, showing
  `$0.00` and an empty/zero-width bar — it is not skipped or collapsed.
- **Given** I've used the app for less than 6 budget periods, **when** I
  view the trend, **then** all 6 slots still render (computed from
  `periodFor`/`shiftPeriod` regardless of whether real expenses exist),
  with the earlier, pre-history periods simply showing `$0.00`.

### Story 14 — View top spending categories

**As a** user, **I want to** see which categories make up most of my
recent spending, **so that** I know where to focus if I want to cut back.

- **Given** the filter is "All types" and the last 6 periods include
  spending in Groceries, Transport, and Rent, **when** I view the
  Dashboard's Top Categories section, **then** I see them ranked by total
  spend (descending) across that same 6-period window, each with its
  color dot, name, total, and share of the 6-period grand total as a
  percentage.
- **Given** some of those expenses have an `expenseTypeId` that no longer
  matches any configured type, **when** I view Top Categories, **then**
  they're grouped into a "Deleted category" row, same convention as the
  Budget screen's breakdown.
- **Given** no expenses exist across the whole 6-period window, **when** I
  view Top Categories, **then** I see an empty-state message (e.g. "No
  spending yet.") rather than an empty list with no explanation.

### Story 15 — View the current period's quick stat, with or without a budget set (superseded)

> **Superseded 2026-09-15:** this story described a stat separate from
> "Selected Period," but `DashboardPage.jsx` was shipped without a
> separate quick-stat section — "Selected Period" already defaults to the
> current period on mount and already carries this exact indicator. See
> Story 19 in "Dashboard: Budget/Widgets section split" below, which makes
> this collapse explicit rather than continuing to spec a second section
> that was never built. The acceptance criteria below still describe real,
> working behavior — they're just criteria of the Budget group's Selected
> Period card now, not of a distinct quick stat.

**As a** user, **I want to** see an at-a-glance total (and budget status,
if I've set one) for the current period right on the Dashboard, **so
that** I don't have to switch to the Budget screen just to check where I
stand right now.

- **Given** the filter is "All types" and `config.budgetLimits.overall` is
  unset, **when** I view the Dashboard's quick stat, **then** I see the
  current period's total spend and a "No budget set for this period"
  message with a link to Configuration — same wording as the Budget
  screen's equivalent state.
- **Given** the filter is "All types", `overall` is `1200.00`, and the
  current period's total is `860.00`, **when** I view the quick stat,
  **then** I see an "under budget" indicator, visually consistent with the
  Budget screen's under-budget styling.
- **Given** the same setup but the current period's total is `1340.00`,
  **when** I view the quick stat, **then** I see an "over budget"
  indicator instead.

## Dashboard: filtering by expense type

### Story 16 — Filter the dashboard down to one expense type

**As a** user, **I want to** narrow the Dashboard Widgets to a single
category, **so that** I can see that category's trend on its own, without
mentally subtracting everything else.

> **Updated 2026-09-15:** the filter now scopes to the "Dashboard Widgets"
> group only (Spending Trend, Top Categories) — it no longer reaches into
> the "Budget" group (Selected Period / By Category). See Story 20.

- **Given** the Dashboard screen, **when** I open the type filter
  dropdown (now located at the top of the "Dashboard Widgets" section),
  **then** I see "All types" (selected by default) followed by one entry
  per configured expense type.
- **Given** I select "Groceries", **when** the filter applies, **then**
  the spending trend recomputes to show only Groceries' spend per period,
  and the Top Categories section is hidden entirely (there's only one
  category to rank once a single type is selected). The "Budget" group
  (Selected Period total, indicator, and By Category breakdown) is
  unaffected — see Story 20.
- **Given** a type is selected, **when** I switch the filter back to "All
  types", **then** the Spending Trend and Top Categories sections return
  to their unfiltered view, including Top Categories reappearing.
- **Given** I navigate away from the Dashboard (e.g. to Expenses) and
  back, **when** the Dashboard remounts, **then** the filter has reset to
  "All types" — the selection is not persisted across navigation or
  reload.

### Story 17 — A per-type quick stat never shows an over/under badge (superseded)

> **Superseded 2026-09-15:** along with Story 15, this described the
> never-separately-built quick stat. It's moot now for a second reason
> too: the type filter no longer applies to the Budget group's indicator
> at all (Story 20), so the scenario this story describes ("filtered to
> one type, indicator suppressed") can no longer occur in the Budget
> group — the indicator there always evaluates against all types,
> filter or no filter.

### Story 18 — Edge cases: a filtered type gets deleted, and deleted-category expenses

**As a** user, **I want to** the Dashboard to behave predictably if the
category I'm filtering on disappears, or when looking at expenses whose
category was already deleted, **so that** I never see a stuck or
unexplained view.

- **Given** I have "Groceries" selected in the filter, **when** I go to
  Configuration and delete the "Groceries" type, then return to the
  Dashboard, **then** the filter has reset to "All types" (its dropdown no
  longer has a "Groceries" option to show as selected) rather than
  silently continuing to filter by a type id that no longer exists.
- **Given** some expenses' `expenseTypeId` no longer matches any
  configured type, **when** the filter is "All types", **then** those
  expenses are included in the trend totals and appear under "Deleted
  category" in Top Categories (and, regardless of filter state, always in
  the Budget group's total/breakdown — see Story 20); **when** I open the
  type filter dropdown, **then** there is no "Deleted category" option to
  select — those expenses can only be viewed in aggregate via "All
  types", not isolated on their own.

## Dashboard: Budget/Widgets section split

### Story 19 — See the Budget material and the Dashboard widgets as two distinct sections

**As a** user, **I want to** clearly tell apart "my current budget status"
from "my spending trends and top categories," **so that** the Dashboard
screen feels organized instead of one long undifferentiated scroll.

- **Given** the Dashboard screen, **when** I open it, **then** I see two
  clearly labeled groups, in order: a **"Budget"** section (containing
  period navigation, the selected period's total, its over/under
  indicator, and its full "By Category" breakdown) and a **"Dashboard
  Widgets"** section (containing the expense-type filter, "Spending
  Trend", and "Top Categories"), visually separated by a heading for each
  group and a divider between them.
- **Given** the Budget section, **when** I open the Dashboard, **then** it
  shows the current period by default (same as before this change) — this
  is the single place that answers "where do I stand right now," replacing
  the separately-specified "current-period quick stat" (Story 15,
  superseded) which was never built as a distinct section in the first
  place.
- **Given** the two sections, **when** I compare their headings, **then**
  "Budget" and "Dashboard Widgets" are a visually larger/more prominent
  heading tier than the individual card titles within them ("Selected
  Period", "By Category", "Spending Trend", "Top Categories"), so the
  grouping is legible at a glance.

### Story 20 — The Budget section ignores the expense-type filter

**As a** user, **I want to** my overall budget total, indicator, and
category breakdown to always reflect all my spending, **so that** turning
on a category filter (meant for spotting trends) never silently hides my
real budget status.

- **Given** the type filter (in the "Dashboard Widgets" section) is set to
  a specific type, e.g. "Groceries", **when** I look at the "Budget"
  section, **then** the selected period's total, its over/under/no-budget
  indicator, and its "By Category" breakdown all reflect **all** expense
  types for that period — none of them change based on the filter.
- **Given** the same filter state, **when** I switch the filter back to
  "All types", **then** the Budget section's display is unchanged (it was
  never affected in the first place).
- **Given** a period with expenses in multiple categories, **when** I view
  "By Category" in the Budget section, **then** it always renders (it's no
  longer hidden when a specific type is selected in the filter, as it was
  before this change).

### Story 21 — Period navigation and indicator states are unchanged by the restructure

**As a** user, **I want to** the existing Previous/Next/current-period
navigation, the over/under indicator states, and the per-category
breakdown rules to keep working exactly as before, **so that** this is a
layout change, not a behavior regression.

- **Given** the Budget section, **when** I click "Previous" or "Next",
  **then** it navigates periods exactly as it did before this change
  (Stories 6-7), independent of the type filter and of the Dashboard
  Widgets section's 6-period trend window (which always tracks the real
  current period, per the Spending Dashboard feature).
- **Given** the over/under/no-budget-set indicator, **when** I evaluate it
  for any period, **then** it uses the same inclusive-boundary rule as
  before (spend exactly equal to the limit is "under") — see Story 3.
- **Given** the "By Category" breakdown, **when** I view it, **then** it
  still omits zero-spend types and groups unresolved `expenseTypeId`s
  under "Deleted category", exactly as specified in Story 5.
