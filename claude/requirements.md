# BudgetTrackerApp — Requirements & Decision Record

> **Reconstruction note (2026-09-11):** This file is referenced from
> `docs/TECHNICAL.md` ("See `claude/requirements.md` in the project for the
> decision record") and from a comment in `src/utils/expensesDb.js`, but it
> did not exist anywhere in the repository (not present, not gitignored —
> confirmed by search). It has been reconstructed from `docs/TECHNICAL.md`,
> `docs/USER_GUIDE.md`, `docs/qa/*.md`, and source comments, which is the
> only record of these decisions that survived. Where a rationale below is
> inferred rather than quoting an original explicit decision, it's marked
> "inferred." Going forward, **this file is the source of truth for product
> requirements and decisions** — keep it updated when a new scope or
> architecture decision is made, rather than letting decisions live only in
> code comments or `docs/TECHNICAL.md`.

## Purpose

This document tracks the "why" behind BudgetTrackerApp's product and
architecture decisions. `docs/TECHNICAL.md` documents "how it's built";
this file documents why it's built that way and what was deliberately left
out. `docs/requirements.md` holds the current/next feature's detailed,
buildable spec — this file holds the standing decisions that constrain it.

## Architecture decisions

- **Client-only, no backend.** BudgetTrackerApp is a Progressive Web App
  with no server component. All data is created, read, updated, and
  persisted directly in the browser. This is a deliberate, standing
  architectural decision (per `docs/TECHNICAL.md`'s Overview), not a
  temporary MVP shortcut — do not propose a backend/API as part of any
  future feature without first revisiting this decision explicitly with
  the project owner.
- **No state-management library, no routing library, no CSS framework.**
  With two (soon three) screens and modest local state, plain
  `useState`/custom hooks, hand-written CSS, and a `useState`-driven screen
  switch in `App.jsx` are sufficient. Revisit if/when the app grows enough
  screens or shared state to make this unwieldy (e.g. needing
  deep-linkable URLs).
- **Vitest for unit tests.** Chosen for its Jest-like API and native Vite
  integration — no separate test bundler config needed (inferred from
  `docs/TECHNICAL.md`).

## Persistence decisions

- **`localStorage` for configuration data, IndexedDB for expense
  transaction records.** (See `src/utils/expensesDb.js` comment and
  `docs/TECHNICAL.md` "Data model".) Rationale: configuration data
  (expense types, start day) is small, simple, and read/written as a
  whole; expense records are potentially large in number and need to be
  queryable (by date, by type) as the app grows — IndexedDB supports
  indexed queries and scales better for that, whereas `localStorage` is a
  flat string-keyed store better suited to small config blobs.
- **Two IndexedDB indexes (`by-date`, `by-expenseTypeId`) were created
  up front**, before anything queried them, specifically to avoid a schema
  migration (a version bump + `upgrade()` path) later once period-based
  filtering or reporting needed them. That reporting need has now arrived
  — see the Budget Period Spending Summary feature in
  `docs/requirements.md`, which is the first consumer of this design
  decision.
- **Expense records don't denormalize expense-type name/color.** An
  expense stores only `expenseTypeId`, looked up against the current
  `config.expenseTypes` at render time (falling back to "Deleted category"
  if the id no longer resolves). This was an explicit MVP simplicity
  trade-off, accepting that renaming or deleting a type changes how past
  expenses display. Revisit if historical accuracy (preserving the
  name/color as of entry time) turns out to matter to users.

## Scope decisions

- **Expense Types have only `name` + `color`.** No icon, spend limit, or
  active/inactive flag. This keeps the Configuration module's first
  version small. (Note: a *budget limit* concept has since been introduced
  at the overall-budget level, not per-expense-type — see the "Budget
  limit scope" decision below and `docs/requirements.md`.)
- **Budget period is a start-day-of-month, not a full custom calendar.**
  One integer (1–31, clamped to short months) defines a repeating period
  boundary. No support for weekly periods, multiple concurrent periods, or
  per-expense-type periods.

## Decision log

Newest first. Each entry: date, decision, rationale, and what it rules
out for now.

### 2026-09-11 — Budget limit scope: overall only, no per-type limits (v1)

**Decision:** The first version of budget-limit tracking supports a single
**overall monthly budget limit** (one number, applies to total spend across
all expense types for the active period). It does **not** support
per-expense-type limits in this increment.

**Rationale:** The core unmet need (per `docs/TECHNICAL.md`'s "Known
limitations" and `docs/USER_GUIDE.md`'s "What's coming next") is simply
*some* connection between configured spending and the budget period — right
now there's none at all. An overall limit delivers the primary "am I over
or under budget" value with one input field and no new UI list to manage.
Per-type limits would roughly double the Configuration UI surface (a
limit input per expense type, its own validation, its own over/under
display per category) for a increment where even the simplest version
doesn't exist yet.

**Trade-off accepted:** Users who want to cap spending on a specific
category (e.g. "no more than $200 on Entertainment") can't do that yet —
they can only see the per-type *breakdown* of what they've spent, not set a
per-type ceiling. This is flagged as a likely fast-follow, not a rejected
idea — see the backlog item in `docs/requirements.md`.

**What this doesn't rule out:** The chosen data model
(`config.budgetLimits`, an object rather than a single scalar — see
`docs/requirements.md`) can hold a per-type limit map alongside the overall
limit later without a breaking migration.

### (undated, pre-existing) — Expense Types: name + color only

See "Scope decisions" above. Reconstructed from `docs/TECHNICAL.md`'s
"Known limitations" list, which explicitly called this out as a scope
decision but didn't record the reasoning. Inferred rationale: keep the
first version of Expense Types CRUD minimal to ship the Configuration
module quickly; icon/limit/active-inactive were deferred rather than
rejected.

### (undated, pre-existing) — Client-only architecture

See "Architecture decisions" above. Reconstructed from `docs/TECHNICAL.md`'s
Overview, which states this as a "deliberate architectural choice" without
elaborating further on the reasoning. Treated here as a standing decision
that any future feature proposal must respect unless explicitly revisited.
