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
  An object (not a bare number) so a future per-type-limit story could have
  added e.g. `"byType": { "1": 400.00 }` without a breaking format change or
  a `localStorage` key migration — that per-type story was later proposed
  and then rejected (see `claude/requirements.md`'s 2026-09-23 decision), so
  this room-to-grow shape is now historical rationale only, not a sign of
  planned future extension. `overall` is `null` or the key absent when no
  limit is configured (both must be treated as "no budget set" — don't rely
  on only one representation). When set, it's a number rounded to 2 decimal
  places, same convention as expense `amount`. Read/written via
  `useLocalStorageState("config.budgetLimits", { overall: null })`,
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
| Expense Types: only `name` + `color` | Partially addressed by this increment, remainder rejected | The overall budget limit doesn't live on the expense type itself, so this item isn't fully closed by the overall limit alone; a per-type limit was later proposed (see the now-removed "Feature: Per-Expense-Type Budget Limits" below) and rejected on 2026-09-23 (`claude/requirements.md`), so `name` + `color` is expected to remain the type's full shape going forward, not a placeholder for a limit field. |
| Expenses not connected to budget period | **This increment** | This is the feature specified above. |
| No currency/locale handling | Future story (not this increment) | Real gap that will become more visible once totals/limits are shown side by side on the new Budget screen, but it's a formatting concern that's separable from the aggregation logic being built now — `formatAmount()` can be swapped out later without touching the aggregation. |
| No expense-type snapshot on expense records (renamed/deleted type changes past display) | Out of scope (standing MVP trade-off) | Explicit, already-documented trade-off (`claude/requirements.md`); the Budget Summary feature already accounts for it via the same "Deleted category" grouping used elsewhere, so it doesn't need to be solved to build this feature. |

### Future backlog item (new, raised by this feature) — since rejected

- **Per-expense-type budget limits.** Extend `config.budgetLimits` with a
  `byType` map and show a per-type over/under indicator alongside the
  existing per-type spend breakdown. Deferred out of this increment — see
  `claude/requirements.md`'s "Budget limit scope" decision for the
  trade-off. This was fully specified below, then rejected outright on
  2026-09-23 before ever being built — see "Feature: Per-Expense-Type
  Budget Limits (Removed)" and `claude/requirements.md`'s 2026-09-23
  decision log entry.

## Feature: Per-Expense-Type Budget Limits (Removed)

> **Status (2026-09-23): rejected outright, never built.** This feature was
> fully specified on 2026-09-11 (an optional per-type limit input in
> `ExpenseTypesManager`, a `config.budgetLimits.byType` map, a per-type
> over/under indicator on the Budget screen breakdown) and deprioritized in
> favor of the Spending Dashboard increment. On 2026-09-23 the product
> owner decided not to build it at all, rather than continue carrying it as
> deferred backlog — see `claude/requirements.md`'s 2026-09-23 decision log
> entry for the rationale and trade-off accepted. The detailed spec (scope
> decision, in/out-of-scope lists, `byType` data model, indicator-state
> table, and interaction rules) has been removed from this document rather
> than kept as a buildable increment; `docs/user-stories.md`'s Stories 9-12
> carry the equivalent "removed" marker. `config.budgetLimits` keeps its
> `{ overall }` shape only — no `byType` key exists or is planned.

## Feature: Spending Dashboard

> **2026-09-11 consolidation note:** the "Why a new screen, not more
> sections on Budget" decision directly below was superseded the same day —
> the user asked for Budget's functionality to move into Dashboard, after
> which the standalone Budget screen was deleted. `src/pages/BudgetPage.jsx`
> no longer exists; its period-navigation, total/over-under indicator, and
> per-category breakdown now live in `src/pages/DashboardPage.jsx`'s
> "Selected Period" and "By Category" sections (see the Dashboard's own
> Spending Trend / Top Categories sections below, which keep tracking the
> real current period regardless of which period "Selected Period" is
> browsing). The original one-job-per-screen rationale is kept below for
> its historical reasoning, not as the current architecture.

> **2026-09-15 follow-up:** re-verified directly against the shipped
> `src/pages/DashboardPage.jsx` — the period navigation (Previous/Next/Back
> to current period), the total/over-under indicator, and the full
> per-category breakdown described above are real and working today, not
> merely spec'd. The gap the product owner raised is UX/structural, not
> functional: the "Selected Period"/"By Category" material (the restored
> Budget job) and the "Spending Trend"/"Top Categories" material (the new
> Dashboard job) render as one undifferentiated stack of cards with no
> visual grouping, and today's expense-type filter also reaches into the
> Budget material — hiding "By Category" and nulling the indicator when a
> single type is selected — which the original Budget screen never did
> (it was never filterable). See "Feature: Dashboard/Budget Section Split"
> below for the fix.

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
   (there is no `byType` — see "Feature: Per-Expense-Type Budget Limits
   (Removed)" above). When a specific type is filtered, this stat shows the
   total only, no over/under badge (there is no per-type limit to compare
   against, and none planned — see above).

### Out of scope (explicitly, this increment)

- **A real charting library** (line charts, pie charts). This increment
  uses plain proportional-width CSS bars; revisit if that proves visually
  insufficient once built.
- **Per-expense-type budget limits/indicators anywhere on the Dashboard.**
  That feature was rejected outright (see "Feature: Per-Expense-Type Budget
  Limits (Removed)" above) — the Dashboard's quick stat and trend only ever
  compare against the single `overall` limit, never a per-type one.
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
  id) — same "don't silently keep referencing a deleted id" rationale used
  elsewhere in this project (e.g. the "Deleted category" convention), but
  here it must be handled live rather than left inert, since a dangling
  filter selection would otherwise leave every section showing a frozen,
  unexplained empty state.
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

## Feature: Dashboard/Budget Section Split

### Problem

The Spending Dashboard feature above successfully merged the old Budget
screen's job (period navigation, a total, an over/under indicator, a full
per-category breakdown) into `DashboardPage.jsx`, and it did so completely
— see the "2026-09-15 follow-up" note above the Spending Dashboard
feature's Problem section: nothing is missing functionally. But the
product owner's direct feedback (2026-09-15) is that the merged screen
isn't user-friendly: *"I wanted the dashboard ui to be more user friendly.
I think we should have separate section for the 'budget' section we moved
from the old 'Budget' module and the dashboard widgets."*

Two concrete problems, both structural rather than missing functionality:

1. **No visual grouping.** "Selected Period", "By Category", "Spending
   Trend", and "Top Categories" all render as same-weight `.card` sections
   in one undifferentiated stack. A user can't tell at a glance which
   cards answer "where do I stand right now" (the Budget job) versus
   "what's my pattern across periods" (the Dashboard-widgets job).
2. **The type filter over-reaches into the Budget material.** Today,
   selecting a specific expense type in the filter also filters the
   Selected Period total, hides the "By Category" card entirely, and nulls
   out the over/under indicator (`DashboardPage.jsx`'s `budgetStatus`
   becomes `null` whenever `filterId !== "all"`). The original standalone
   Budget screen (Stories 2-8) was **never** filterable by type — "how much
   have I spent, in total, this period, against my limit" shouldn't change
   meaning based on a filter meant for spotting cross-period trends in one
   category. This conflation is likely a contributor to the "not user
   friendly" feedback: applying the filter silently makes budget-status
   information disappear.

### Scope decision: two visually distinct groups on the same screen; Budget group ignores the type filter; retire the separate "current-period quick stat" concept

**One screen, two groups, not a new route.** Per the product owner's own
wording ("separate section," singular screen) and reconfirmed scope (no
new top-nav item), `DashboardPage.jsx` gets restructured internally into
two adjacent, clearly labeled groups — **not** a return to a standalone
Budget page. This preserves the "Dashboard" nav entry and the single-screen
architecture; only the internal layout and a few data dependencies change.

**Group contents:**

- **"Budget" group** — the restored-Budget-screen material: period
  navigation (Previous/Next/Back to current period), the selected period's
  total, its over/under/no-budget-set indicator, and its full per-category
  breakdown ("By Category"). Always computed against **all** expense types,
  regardless of the type filter — see next point.
- **"Dashboard Widgets" group** — the cross-period material: the
  expense-type filter control itself, "Spending Trend" (6 periods), and
  "Top Categories". The filter continues to drive these two sections
  exactly as it does today.

**Why the Budget group stops respecting the type filter:** the filter's
job (per the original Spending Dashboard spec) is to let a user "see that
category's trend on its own" across periods — a Dashboard-widgets concern.
Applying it to the Budget group's total/indicator/breakdown conflates two
different questions ("what's my overall status" vs. "how is this one
category trending") and was never how the pre-merge Budget screen behaved.
Moving the filter's effect to widgets-only both fixes problem 2 above and
gives the visual split in problem 1 a real behavioral basis — the two
groups aren't just styled differently, they now respond to different
controls, which reinforces that they answer different questions.

**Why the "current-period quick stat" (Spending Dashboard spec, "In scope"
item 5; Stories 15 and 17) is retired as a separate concept, not
relocated:** that quick stat's entire job — current period's total, plus
an over/under badge in "All types" mode — is already subsumed by the
Budget group's "Selected Period" card, which already defaults to the
current period on every mount (`DashboardPage.jsx`'s `period` state
initializes to `currentPeriod`) and already carries the identical
indicator. `DashboardPage.jsx` was in fact never built with a *separate*
quick-stat section distinct from "Selected Period" — the two concepts
already collapsed into one implementation during the original merge. This
feature makes that collapse explicit in the spec rather than continuing to
describe a second thing that doesn't exist in the code. No behavior is
removed for the user: "open Dashboard, immediately see current period's
total and budget status" still works exactly the same, via the Budget
group's default state.

### In scope (this increment)

1. Restructure `DashboardPage.jsx`'s render output into two wrapping
   groups, in this order (Budget first, since "where do I stand" is the
   more time-sensitive question on open):
   - `<section className="dashboard-group dashboard-group-budget">` with a
     `<h2 className="dashboard-group-title">Budget</h2>`, containing the
     existing period-nav `.card`, the existing Selected Period `.card`,
     and the existing By Category `.card` (unchanged internal markup other
     than the heading-level change in item 3 below).
   - A `<hr className="dashboard-divider" />` between the two groups.
   - `<section className="dashboard-group dashboard-group-widgets">` with
     a `<h2 className="dashboard-group-title">Dashboard Widgets</h2>`,
     containing the expense-type-filter `.card` (moved here from its
     current position above the period-nav card), the Spending Trend
     `.card`, and the Top Categories `.card`.
2. **Budget group stops depending on the type filter:**
   - `selectedTotal` is computed from the full `selectedPeriodExpenses`
     (drop the `filterTypeId` branch currently in its `useMemo`) — always
     the period's all-types total.
   - `budgetStatus` is computed from that unfiltered `selectedTotal`
     unconditionally — drop the `filterId !== "all" ? null : ...` branch;
     it's always `"none"`/`"under"`/`"over"` per the existing table in the
     Budget Period Spending Summary feature above, never `null`.
   - The "By Category" card (`selectedBreakdown`) always renders — drop
     the `{filterId === "all" && (...)}` guard around it. `groupByCategory`
     keeps running over the full `selectedPeriodExpenses`, not a
     filter-narrowed subset.
3. **Heading hierarchy:** promote the two new group headings to `<h2>`
   (see item 1) and demote each card's own existing title — "Selected
   Period", "By Category", "Spending Trend", "Top Categories" — from `<h2>`
   to `<h3>`, so there's one clear heading level per grouping tier. The
   period-nav card keeps its current no-heading layout (it's identified by
   the group title above it).
4. **Filter card relocates** to the top of the "Dashboard Widgets" group
   (immediately above "Spending Trend"), replacing its current position
   above the period-nav card. Its behavior is unchanged: it still drives
   `filterTypeId` for the Spending Trend computation (`periodTotals`) and
   still hides the Top Categories card when `filterId !== "all"`.
5. **New CSS** (`src/App.css`, under a new `/* Dashboard section groups */`
   comment near the existing `/* Dashboard screen */` block):
   - `.dashboard-group` — spacing wrapper only (e.g. `margin-bottom`
     consistent with the existing `.card` rhythm); no border/background of
     its own — the `.card`s inside keep their existing look.
   - `.dashboard-group-title` — reuse the existing small-caps-label
     treatment already established by `.period-preview .label` (`font-size:
     12px`, `font-weight: 600`, `color: var(--accent)`, `text-transform:
     uppercase`, `letter-spacing: 0.03em`), sized up slightly (e.g.
     `font-size: 13px`) since it's a higher heading tier than that label,
     with `margin-bottom` spacing before the first card in its group.
   - `.dashboard-divider` — a plain horizontal rule reusing the existing
     hairline convention from `.note` (`border-top: 1px solid
     var(--border)`), no visible `<hr>` default styling (reset `border:
     none; border-top: 1px solid var(--border);`), with vertical margin
     matching the existing `.card` gap (`margin: 4px 0 20px`, i.e. flush
     with the group spacing above/below it).
   - No new color tokens needed — everything above reuses `--accent`,
     `--border`, and existing spacing values already in `App.css`.

### Out of scope (explicitly, this increment)

- **A separate Budget page/route or a restored third top-nav item.** The
  product owner explicitly asked for a "section," not a page; "Dashboard"
  remains the only nav entry covering this material.
- **Changing what the period-nav, Selected Period, By Category, Spending
  Trend, or Top Categories cards compute or display**, beyond the type-
  filter decoupling in "In scope" item 2. No new fields, no new
  aggregation logic.
- **Persisting the type filter or the selected period** across navigation
  or reload — both remain ephemeral component state, same as today.
- **Making the two groups collapsible/expandable, tabs, or otherwise
  interactive beyond a static visual/structural split.** A plain heading +
  divider + card-grouping split is sufficient to answer the "not user
  friendly" feedback; collapsing/tabs is a future enhancement if the
  simpler split proves insufficient once used.
- **Any change to charting or the other deprioritized/future items already
  tracked** in the Spending Dashboard feature above (per-expense-type
  budget limits are rejected outright, not merely deprioritized — see
  "Feature: Per-Expense-Type Budget Limits (Removed)") — this increment
  only restructures and re-scopes what already exists.

### Data model additions

None. This feature makes no `localStorage` changes and adds no new keys —
it re-reads exactly the same state the Spending Dashboard feature already
reads (`config.expenseTypes`, `config.startDay`,
`config.budgetLimits.overall`, expense records via `useExpenses()`). The
type filter (`filterId`) and the browsed period (`period`) remain
component-local `useState`, non-persisted, exactly as today — this
increment only narrows *which* sections `filterId` affects.

### Edge cases

| Case | Behavior |
|---|---|
| Type filter has a type selected, user looks at the Budget group | Total, indicator, and By Category breakdown all show **all types**, unaffected by the filter — this is the point of the decoupling in "In scope" item 2, not an edge case to guard against, but called out here since it's a visible behavior change from what's shipped today. |
| Type filter has a type selected, user looks at the Dashboard Widgets group | Unchanged from the current Spending Dashboard behavior: Spending Trend narrows to that type, Top Categories is hidden. |
| The filtered type is deleted from Configuration while Dashboard is open | Unchanged from Story 18's existing behavior: the filter resets to "All types" (`DashboardPage.jsx`'s existing `useEffect` watching `expenseTypes`/`filterId`). Since the Budget group no longer reads the filter at all, this reset only visibly affects the Widgets group. |
| Zero expenses in the selected period (Budget group) | Unchanged from existing behavior: `$0.00` total, "No expenses logged in this period yet." in By Category, and the indicator still evaluates (`"none"`/`"under"` at `$0.00`). |
| Zero expenses across the whole 6-period trend window (Widgets group) | Unchanged: all 6 trend rows show `$0.00`/empty bars, Top Categories shows "No spending yet." |
| Fewer than 6 real periods of history | Unchanged: all 6 trend slots still render via `periodFor`/`shiftPeriod`. |
