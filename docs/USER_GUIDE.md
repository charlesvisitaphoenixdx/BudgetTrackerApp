# BudgetTrackerApp — User Guide

BudgetTrackerApp helps you track your spending against a budget period that
you define — not necessarily the calendar month. This guide covers what's
available today: the **Expenses**, **Dashboard**, and **Configuration**
screens, which you can switch between using the three buttons at the top
of the app.

## Installing the app

BudgetTrackerApp is a Progressive Web App (PWA), which means you can install
it like a regular app on your phone, tablet, or computer, and it will work
even without an internet connection:

- **On a phone (iOS/Android):** open the app in your browser, then use the
  browser's "Add to Home Screen" (iOS Safari) or "Install app" (Android
  Chrome) option.
- **On a computer:** open the app in Chrome, Edge, or another
  Chromium-based browser. Click the install icon in the address bar (it
  looks like a small monitor with a down arrow), or use the browser menu →
  "Install BudgetTrackerApp".

Once installed, the app opens in its own window, gets its own icon, and
keeps working offline.

## Expenses

The Expenses screen is where you log what you spend. It opens by default
when you start the app.

### Adding an expense

Click the **+ Add Expense** button to open the entry form in a pop-up.
Fill in:

- **Expense Type** (required) — pick from the categories you've set up in
  Configuration.
- **Amount** (required) — the amount you spent. Enter a positive number
  with up to two decimal places (e.g. `12.50`).
- **Date** (required) — the date of the expense. Defaults to today.
- **Name** (required) — a short label for the expense (e.g. "Weekly
  grocery run"), up to 80 characters.
- **Description** (optional) — any extra notes, up to 500 characters.

Click **Add Expense** to save it, or **Cancel** to close the pop-up without
saving anything you've typed. You can also close it by pressing **Esc** or
clicking outside the pop-up. If anything required is missing or invalid
when you click Add Expense, you'll see an error message next to that field
and the pop-up stays open. On success, the pop-up closes and the expense
appears in the list below.

If you haven't set up any expense types yet, the **+ Add Expense** button
is replaced with a message and a link that takes you straight to
Configuration so you can add one first.

### Viewing, editing, and removing expenses

Everything you've logged appears under **Logged Expenses**, most recent
first, with its category color, name, amount, date, category, and any
description.

**To edit an expense:** click anywhere on its row (other than the ✕ button).
The same pop-up you used to add it opens back up, titled **Edit Expense**
and pre-filled with everything you entered before. Change whatever you
need and click **Update Expense** to save, or **Cancel** to close the
pop-up without changing anything. The same required-field and format
checks apply as when adding.

**To remove an expense:** click the **✕** button on its row, then confirm
the deletion. This can't be undone.

If an expense's category is later removed in Configuration, the entry
isn't deleted or broken — it's shown with "Deleted category" in its place,
and you can still open it to edit it (for example, to assign it a
different category).

## Dashboard

The Dashboard screen answers two questions: "where do I stand right now,"
and "what's my spending pattern been lately." It's split into two sections.

### Budget

Shows the budget period you're currently viewing — by default, the one
containing today's date — with:

- The period's date range (e.g. Sep 1 – Sep 30).
- Your total spend for that period.
- If you've set a Monthly Budget Limit in Configuration, whether you're
  under or over it, and by how much. If you haven't set one yet, you'll
  see a message and a link to Configuration instead.
- **By Category** — a breakdown of that period's spend by expense type. A
  category with no spend in the period simply doesn't appear in the list.
  Expenses whose category was later deleted are grouped under "Deleted
  category."

Use **← Previous** / **Next →** to browse other periods; a **Back to
current period** link appears whenever you've navigated away from today's
period. The Budget section always reflects **all** your expense types,
regardless of any filter set in Dashboard Widgets below it — it answers
"how am I doing overall," so it isn't narrowed by a category filter.

### Dashboard Widgets

Shows patterns across the current period and the 5 before it (6 periods
total):

- **Expense type filter** — narrow the widgets below to a single category,
  or leave it on "All types." (This filter only affects the two sections
  below it, not the Budget section above.)
- **Spending Trend** — each of the 6 periods, its date range, its total
  spend, and a bar sized relative to the highest-spending period in the
  window, so you can spot whether spending is trending up or down at a
  glance. A period with no spending still shows its own $0.00 row rather
  than being skipped.
- **Top Categories** — your categories ranked by total spend across that
  same 6-period window, with each one's share of the total as a
  percentage. Only shown when the filter is "All types" (with a single
  category selected, there's nothing left to rank).

The filter resets to "All types" every time you leave and come back to the
Dashboard — it's not remembered across navigation or a reload.

## Configuration

The Configuration screen is where you set up how the app organizes your
budget. Everything you enter here is saved automatically to your device as
you go — there's no separate "Save" button, and nothing is sent anywhere
else.

### Expense Types

Expense Types are the categories you'll use to tag your spending — things
like Groceries, Transport, or Rent. The app comes with a few common ones
already set up, and you can fully customize them.

**To add a new expense type:**
1. Pick a color using the color swatch next to the "New expense type name"
   box (this color will help you visually tell categories apart later).
2. Type a name (up to 40 characters).
3. Click **Add**, or just press **Enter**.

If you leave the name blank, or try to add a name that already exists
(matching is not case-sensitive — "groceries" and "Groceries" count as the
same), you'll see an error message and nothing will be added.

**To rename an expense type:** click into its name field, type the new
name, and click elsewhere (or press Enter) to save it. If the new name is
blank or already used by another type, you'll see an error message directly
under that row, and the name will revert to what it was before.

**To change an expense type's color:** click its color swatch and pick a
new color — it updates immediately.

**To remove an expense type:** click the **✕** button on its row. If you
remove every expense type, you'll see a message reminding you to add at
least one.

### Budget Period Start Day

By default, most budgeting tools use the calendar month (the 1st to the
last day of the month). BudgetTrackerApp lets you instead pick any day of
the month as your budget period's start day — useful if, say, your paycheck
or rent due date doesn't line up with the 1st.

**Start day of month:** enter a number from 1 to 31. For example, setting
this to `5` means your budget period for September runs from **September 5
through October 4** — the day before the start day comes around again in
October.

If you pick a day that doesn't exist in every month (like 31, which
February never has), the app will use that month's last actual day instead,
and will show you a note explaining when this happens.

**Preview a date:** use this date picker to check which budget period any
particular day falls into — handy for confirming the setting behaves the
way you expect before you rely on it. The screen also shows you the
previous and next periods for context, so you can see the pattern.

### Monthly Budget Limit

An optional overall spending limit for each budget period, checked against
your total spending across all expense types (not per-category). Leave it
blank if you don't want to track against a limit — the Dashboard will just
show your total with no over/under status. Enter a positive amount (e.g.
`1200` or `1200.50`) to turn tracking on; clear the field to turn it back
off. If you enter `0`, a negative number, or something that isn't a valid
amount, you'll see an inline error and the field will keep its last valid
value.

## Where is my data stored?

Everything you enter — expense types, your start day setting, and every
expense you log — is stored locally on your device (in the browser's
storage). It is not uploaded to a server. This means:

- Your data stays private to the device you're using.
- If you use the app on a different device or browser, you'll need to set
  everything up again there (there is currently no syncing between
  devices).
- Clearing your browser's site data for this app, or uninstalling it, will
  remove everything you've entered, including logged expenses.

## What's coming next

- **Currency and locale.** Amounts don't show a currency symbol and always
  group digits the US way (e.g. `9,999,999.99`), regardless of your
  device's own locale settings.
- **Cross-device sync.** Your data stays on the device/browser you entered
  it on — there's currently no way to see the same data on a second device
  without setting everything up again there.
