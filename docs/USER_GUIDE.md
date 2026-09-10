# BudgetTrackerApp — User Guide

BudgetTrackerApp helps you track your spending against a budget period that
you define — not necessarily the calendar month. This guide covers what's
available today: the **Configuration** screen.

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

## Where is my data stored?

Everything on the Configuration screen — your expense types and your start
day setting — is stored locally on your device (in the browser's storage).
It is not uploaded to a server. This means:

- Your data stays private to the device you're using.
- If you use the app on a different device or browser, you'll need to set
  up your Expense Types and Start Day again there (there is currently no
  syncing between devices).
- Clearing your browser's site data for this app, or uninstalling it, will
  remove your saved configuration.

## What's coming next

The Configuration screen is the first part of BudgetTrackerApp. Expense
entry and tracking — actually logging what you spend against these
categories and periods — is planned next and isn't available yet.
