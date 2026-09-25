---
name: Plan a budget and schedule
tagline: See time conflicts, workload clusters, bills, and budget together.
summary: Use ChatGPT with course calendars, work shifts, recurring commitments,
  income, expenses, and bills to create a weekly planning dashboard, conflict
  view, budget tracker, and adjustable action plan.
skills:
  - token: $spreadsheets
    description: Build an editable budget, schedule, and upcoming-payments dashboard.
  - token: google-calendar
    description: Read approved course, work, and recurring calendar commitments.
bestFor:
  - Students balancing classes, work shifts, commitments, and bills.
  - Weekly plans that need both time and money constraints.
  - Dashboards that suggest options without changing events or making
    transactions.
starterPrompt:
  title: Build My Budget and Schedule Dashboard
  body: >-
    Build a personal planning dashboard from my course calendar, work shifts,
    recurring commitments, income, expense categories, and bills.


    Show:

    - weekly time conflicts

    - major workload clusters

    - upcoming payments

    - an adjustable budget view

    - practical options for the next week


    Do not change calendar events, send messages, make financial transactions,
    or assume missing income or expenses.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Combine only the planning data you need

Provide the course calendar, work shifts, recurring commitments, bills, income, and expense categories that belong in the planning window. Remove account numbers and other sensitive financial details.

Confirm the date range, currency, pay schedule, and which commitments are fixed or flexible.

## Build an adjustable dashboard

Use the starter prompt to create:

1. A weekly schedule with overlapping commitments highlighted.
2. A workload view for clustered deadlines and shifts.
3. A simple income and expense plan.
4. An upcoming-bills list with verified dates.
5. Scenarios for changing discretionary time or spending.

Keep source values, assumptions, and suggestions visibly separate.

## Review before acting

Check every bill and calendar entry against its original source. Make sure the dashboard does not treat estimated costs or unconfirmed shifts as fixed.

Use the plan to compare options, not to automate decisions. ChatGPT should not change events, contact anyone, move money, or make purchases.