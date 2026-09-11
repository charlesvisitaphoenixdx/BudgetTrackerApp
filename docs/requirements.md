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
  trade-off. **Now specified below** — see "Feature: Per-Expense-Type
  Budget Limits".

## Feature: Per-Expense-Type Budget Limits

> **Status (2026-09-11): spec'd, then deprioritized before implementation.**
> The spec below is retained as a buildable increment for whenever it's
> picked back up, but it is not the next scheduled increment — the
> **Feature: Spending Dashboard** section further down is.

### Problem

The Budget screen shows an overall monthly limit and a read-only per-type
spend breakdown, but no way to cap an individual category (e.g. keep
"Groceries" under $400 regardless of whether the household is still under
its overall limit). This was explicitly deferred out of the Budget Period
Spending Summary increment (see "Scope decision: overall budget limit
only" above) and flagged as a backlog item at the time. This increment
delivers it.

### Scope decision: extend `config.budgetLimits.byType`; edit limits inline in Expense Types

`config.budgetLimits` was already shaped as an object (not a bare number)
specifically so this feature could add a sibling key without a breaking
format change (see "Data model additions" in the Budget Period Spending
Summary feature above). This increment adds `byType` alongside the
existing `overall` key.

For where a per-type limit is *set*: `ExpenseTypesManager`'s `TypeRow`
already owns one editable row per expense type (name + color, with
commit-on-blur/Enter and revert-on-invalid patterns). Adding an optional
"limit" input to that same row is the smallest change that fits the
existing model — it avoids a new Configuration subsection and reuses a
validation/commit pattern already proven in this codebase (same one
`BudgetLimitSettings` uses for the overall limit). The limit is **not**
stored on the expense type object itself (`config.expenseTypes`) — it
stays in `config.budgetLimits.byType`, keyed by expense type id, exactly
like the future-proofing note already on record for this data model.
Keeping it off the type object avoids growing `expenseTypes`' shape for a
value that's really budget configuration, not identity, and sidesteps any
need to reconcile the two if a type is renamed/recolored independently of
its limit.

### In scope (this increment)

1. An optional **limit** input added to each existing row in
   `ExpenseTypesManager` (Configuration screen), alongside the current
   name and color controls. Empty means "no limit for this type" (the
   default, and the state for every type that existed before this
   increment). If set, it must be a positive number (up to 2 decimal
   places, same normalization as the overall limit and expense `amount`).
   Same commit-on-blur/Enter and revert-on-invalid-with-inline-error
   pattern as the name field and the overall limit field.
2. On the Budget screen, each **breakdown row that already shows spend for
   a type with a limit set** additionally shows an over/under indicator
   for that type (see "Indicator states" below), alongside the existing
   dot/label/amount — same visual language as the overall indicator
   (distinct styling for over vs. under), scaled down to fit a row.
3. The overall limit and per-type limits are independent and both can be
   shown at once: the overall indicator at the top of the screen, and any
   per-type indicators in the rows below it. See "Interaction with the
   overall limit" below.

### Out of scope (explicitly, this increment)

- **Cross-validation between the overall limit and the sum of per-type
  limits.** A user can set per-type limits that individually or in total
  exceed (or fall well under) the overall limit; nothing warns about or
  prevents this. The two are evaluated independently against the same
  period's spend — see "Interaction with the overall limit" below.
- **Showing a breakdown row for a type that has a limit but zero spend in
  the period.** The existing breakdown rule (Budget Period Spending
  Summary feature, "In scope" item 2) omits zero-spend types entirely
  rather than showing a $0.00 row, and this increment doesn't change that
  — even though a $0-of-$400 "you're on track" row has real value for a
  type with a limit, changing the omission rule is a separate, broader
  decision (it would also affect types with no limit) and isn't needed to
  deliver per-type limits. Flagged as a future enhancement, not solved
  here.
- **Scrubbing `byType` entries when their expense type is deleted.** See
  "Edge case: a limit set on a since-deleted type" under Data model
  additions — the orphaned entry is left in place rather than cleaned up,
  consistent with how the app already leaves `expenseTypeId` references on
  deleted-type expenses unresolved rather than rewriting history.
- **Editing per-type limits from the Budget screen.** Same rationale as
  the overall limit and as expense editing generally — Configuration owns
  settings, Budget is read-only.
- Notifications/alerts on going over a per-type limit (same as the overall
  limit — passive, on-open indicator only).
- Currency/locale formatting (same standing deferral as the overall
  limit).

### Data model additions

Extends `config.budgetLimits` (introduced by the Budget Period Spending
Summary feature) with a new `byType` key:

```json
{ "overall": 1200.00, "byType": { "1": 400.00, "3": 150.00 } }
```

- `byType` is an object whose keys are expense type ids **as strings**
  (JSON/`localStorage` serialization coerces object keys to strings even
  though `config.expenseTypes[].id` is a `number`) and whose values are
  positive numbers rounded to 2 decimal places, same convention as
  `overall` and expense `amount`. Look up a type's limit with
  `budgetLimits?.byType?.[String(type.id)]`. Unlike `overall` (which can
  be explicitly `null`), "no limit" for a type is represented only by the
  key being **absent** from `byType` — clearing a previously-set limit
  deletes the key rather than setting it to `null` or `0`, so a present
  key always means an active limit.
- Default value for the whole `config.budgetLimits` object becomes
  `{ overall: null, byType: {} }` (was `{ overall: null }`); existing
  stored values that predate this increment and lack a `byType` key are
  read as if it were `{}` (same "absent means default" convention already
  used for `overall`), so no migration step is needed.
- **Edge case: a limit set on a since-deleted type.** If an expense type
  is removed via `ExpenseTypesManager`'s remove button, its entry in
  `budgetLimits.byType` (keyed by that type's id) is **not** removed —
  it's simply never looked up again, because nothing in `config.expenseTypes`
  matches that id anymore. This mirrors the app's existing stance on
  `expenseTypeId` referential integrity (expense records aren't scrubbed
  or rewritten when their type is deleted either — see
  `docs/TECHNICAL.md` "Data model"). The orphaned entry is inert dead
  data, not a bug; it would only resurface if a future feature reused
  numeric type ids after deletion, which `ExpenseTypesManager`'s
  `nextId` calculation (`max existing id + 1`) does not do.
- **Edge case: a type with no limit set.** The common case (and the
  default for every type prior to this increment) — its breakdown row on
  the Budget screen renders exactly as it does today, amount only, no
  indicator.

### Indicator states (per type, Budget screen breakdown row)

Given a breakdown row's type-specific spend for the period and
`budgetLimits.byType[String(type.id)]`:

| State | Condition | Display (suggested wording) |
|---|---|---|
| No limit set for this type | key absent from `byType` | Row unchanged from the existing Budget Period Spending Summary behavior — dot, label, amount only, no indicator. |
| Under type limit | limit set and `type spend <= limit` | Amount plus e.g. "of $400.00 — $280.00 remaining", styled like the overall "under" state but row-scaled. |
| Over type limit | limit set and `type spend > limit` | Amount plus e.g. "of $400.00 — $40.00 over", styled like the overall "over" state. |

Same inclusive boundary rule as the overall indicator: spend exactly equal
to the limit is "under" (with `$0.00 remaining`), not "over". The
"Deleted category" row never shows a per-type indicator — it's a grouping
of expenses whose original type id no longer resolves to anything, so
there's no type id to look up a limit for.

### Interaction with the overall limit

The overall limit and per-type limits are two independent checks against
the same period's expense data — there's no arithmetic relationship
enforced between them (see "Out of scope" above). Concretely: a period can
show "under budget" overall while one specific category simultaneously
shows "over" its own type limit (e.g. total spend well under the $1,200
overall limit, but Groceries alone over its $400 type limit) — both
indicators display as computed, with no suppression or reconciliation
logic. This is consistent with the existing structure of the Budget
screen, where the overall indicator and the breakdown are already two
separate sections computed from the same `periodExpenses` but never cross
each other's results.

## Feature: Spending Dashboard

### Problem

Expenses gives a raw list of transactions; Budget gives a single period's
total, breakdown, and limit status. Neither helps a user spot a *pattern*
— is spending trending up, which category dominates, how does this period
compare to recent ones — and neither lets a user narrow the view down to
one category's history specifically. The user asked directly for "a
dashboard that shows valuable information that makes the user easily
track spending," filterable by expense type. This is now the next
scheduled increment (the previously-queued Per-Expense-Type Budget Limits
feature above is spec'd but deprioritized).

### Scope decision: a new Dashboard screen (not an extension of Budget); period trend + top categories; plain-CSS visualization, no charting library; filter is ephemeral

**Why a new screen, not more sections on Budget:** `docs/TECHNICAL.md`
("Component notes") already establishes a one-job-per-screen convention —
Expenses owns transaction CRUD, Budget owns "this one period, all
categories, against the limit." A dashboard's job is different in kind:
it looks *across* periods and supports narrowing to *one* category, which
would overload Budget's existing single-period/all-categories contract
rather than extend it cleanly. A fourth top-nav button keeps each screen's
job legible, consistent with how Budget itself was added as a third button
rather than folded into Expenses.

**Why no charting library:** the project deliberately carries no
state-management or CSS framework dependency, adding one only when
justified (`docs/TECHNICAL.md` "Stack"). A trend and a top-categories list
are both expressible as plain, proportional-width `<div>` bars styled with
existing CSS custom properties (same technique as the color swatches
already in `ExpenseTypesManager`/`BudgetPage`), so this increment adds no
new dependency. A real charting library (line/pie charts) is called out
below as a future enhancement if the plain-bar version proves
insufficient.

**Why the type filter is ephemeral (not persisted):** consistent with how
`BudgetPage`'s period navigation isn't persisted either — `App.jsx`
unmounts pages on nav, so "the dashboard always opens on today's period /
all types" is the simplest predictable behavior, with no new
`localStorage` key needed just to remember a filter selection.

### In scope (this increment)

1. A new **Dashboard** screen, reachable via a fourth top-nav button,
   positioned between Budget and Configuration (Expenses / Budget /
   Dashboard / Configuration).
2. An **expense-type filter** control at the top of the screen: a
   dropdown listing "All types" (default, selected on every mount) plus
   one entry per `config.expenseTypes` entry. Selecting a specific type
   narrows every section below to that type's expenses only; selecting
   "All types" returns to the unfiltered view. (No "Deleted category"
   entry in the filter itself — see Edge cases below for how
   already-orphaned expenses interact with the filter.)
3. **Spending trend**: the current budget period plus the 5 preceding
   ones (6 periods total, oldest to newest, left to right), computed by
   walking `shiftPeriod()` backward from the current period (same
   function `BudgetPage` already uses for navigation). Each period is one
   row/column showing its date range, its total spend (all types, or just
   the filtered type), and a bar whose width is proportional to that
   period's spend relative to the largest spend among the 6 visible
   periods (a period with the max spend renders a full-width bar; `$0.00`
   periods render a zero-width/empty bar, not an omitted row — see Edge
   cases).
4. **Top categories**: shown only when the filter is "All types" (with a
   single type selected there is only one category to rank, so the
   section is hidden rather than showing a trivial one-row list). Ranks
   expense types by total spend summed across the same 6-period window
   used by the trend section, descending, each row showing the type's
   color dot, name, total, and % of the 6-period grand total. Same
   "Deleted category" grouping convention as the Budget screen's
   breakdown for expenses whose `expenseTypeId` no longer resolves.
5. **Current-period quick stat**: total spend for the current period only
   (all types, or the filtered type), plus — **only when the filter is
   "All types"** — the same over/under/no-budget-set indicator already
   computed on the Budget screen, reusing `config.budgetLimits.overall`
   (not `byType`, since that field's UI is deprioritized — see below).
   When a specific type is filtered, this stat shows the total only, no
   over/under badge (there is currently no per-type limit to compare
   against; the Per-Expense-Type Budget Limits spec above would be the
   natural way to add one later).

### Out of scope (explicitly, this increment)

- **A real charting library** (line charts, pie charts). This increment
  uses plain proportional-width CSS bars; revisit if that proves visually
  insufficient once built.
- **Per-expense-type budget limits/indicators anywhere on the Dashboard.**
  That feature is spec'd (see above) but deprioritized — the Dashboard's
  quick stat and trend only ever compare against the single `overall`
  limit, never a per-type one.
- **Persisting the selected filter** across a screen change or reload —
  it always resets to "All types" on mount, same non-persistence as
  Budget's period navigation.
- **A user-adjustable trend window.** Fixed at 6 periods (current + 5
  prior) this increment; a custom range/date-picker is a natural future
  enhancement, not required to deliver "valuable at-a-glance information."
- **Editing/deleting expenses from the Dashboard** — read-only, same
  two-screen-ownership convention as Budget.
- **Exporting or printing** the dashboard view.
- **Multi-select filtering** (more than one type at once) — the filter is
  single-select (or "All types"); comparing two specific categories
  side-by-side is a future enhancement, not this increment.

### Data model additions

None. This feature introduces no new `localStorage` keys — it only reads
existing state already used by `BudgetPage`: `config.expenseTypes`,
`config.startDay`, `config.budgetLimits.overall`, and expense records via
`getAllExpenses()`/`useExpenses()`. The 6-period trend window and the
type filter are both computed in memory / held in local component state,
not persisted.

### Filter interaction (quick-stat section)

| Filter | Condition | Quick-stat display |
|---|---|---|
| All types | `budgetLimits.overall` unset | Current-period total only, plus "No budget set for this period" + link to Configuration (same wording as Budget screen). |
| All types | `overall` set, `total <= overall` | Current-period total plus "under budget" indicator (same wording/styling as Budget screen). |
| All types | `overall` set, `total > overall` | Current-period total plus "over budget" indicator. |
| One type selected | any | That type's current-period total only — no indicator, regardless of `overall` (an overall limit isn't meaningful to compare against a single category's spend). |

### Edge cases

- **Trend periods with zero spend are always shown, never omitted.** This
  differs deliberately from the Budget screen's category-breakdown rule
  (which omits zero-spend *categories*): omitting a *period* from a
  timeline would break the left-to-right continuity that makes a trend
  readable at a glance. All 6 period slots always render, some possibly
  at `$0.00`/an empty bar.
- **Fewer than 6 periods of real history** (a new user): all 6 slots
  still render (`periodFor`/`shiftPeriod` compute a period regardless of
  whether any expense falls in it) — earlier slots simply show `$0.00`
  and an empty bar, not an error or a truncated set.
- **The selected filter type is deleted from Configuration while the
  Dashboard is showing it.** Since `config.expenseTypes` is read live via
  `useLocalStorageState` (same pattern as `ExpensesPage`), the filter
  dropdown's own list updates immediately and the previously-selected
  type's `<option>` disappears. The filter resets to "All types" in this
  case (rather than silently continuing to filter by a now-nonexistent
  id) — same rationale as the equivalent edge case called out for
  `byType` limits above, but here it must be handled live rather than
  left inert, since a dangling filter selection would otherwise leave
  every section showing a frozen, unexplained empty state.
- **Expenses whose `expenseTypeId` no longer matches any configured type
  ("Deleted category")** are included in "All types" totals (trend
  and current-period quick stat) exactly as they are on the Budget
  screen, and appear as a "Deleted category" row in Top Categories. They
  are **not selectable** in the type filter dropdown (there's no
  concrete type to select), so the only way to see just those expenses
  in isolation is via "All types" plus reading the "Deleted category"
  row in Top Categories — there's no dedicated "Deleted category" filter
  option this increment.
- **No expenses at all** (brand-new user, no history): trend shows all 6
  periods at `$0.00`, Top Categories shows an empty-state message (e.g.
  "No spending yet."), and the quick stat shows `$0.00` plus whatever the
  `overall`-limit state dictates (no-budget-set / under / over per the
  table above) — consistent with how Budget already handles a
  zero-expense period.
