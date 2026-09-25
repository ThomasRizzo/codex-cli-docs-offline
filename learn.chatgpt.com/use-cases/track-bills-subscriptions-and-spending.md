---
name: Track bills, subscriptions, and spending
tagline: Review the last 30 days and stay ahead of anything unusual.
summary: Use ChatGPT Work on the web to review connected accounts, understand
  your spending and savings, and get notified when something needs attention.
skills:
  - token: finances
    url: https://help.openai.com/en/articles/20001222
    description: Review connected spending, upcoming payments, recurring bills, and
      subscriptions in ChatGPT.
bestFor:
  - Understanding spending, savings, account growth, and upcoming bills.
  - Read-only daily monitoring with a short report every two weeks.
starterPrompt:
  title: Check your finances
  body: "@Finances Check my finances for the last 30 days. Show me my spending,
    savings, account balances and growth, and anything unusual."
  suggestedEffort: low
relatedLinks:
  - label: Finances in ChatGPT
    url: https://help.openai.com/en/articles/20001222
  - label: Scheduled tasks in ChatGPT
    url: https://help.openai.com/en/articles/10291617
  - label: Plan a budget and schedule
    url: /codex/use-cases/plan-budget-and-schedule
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

In ChatGPT Work on the web, open **Finances** in the sidebar, add the Finances plugin, and connect your financial accounts. You can then use `@Finances` to check your accounts. Finances is not available in the desktop app.

Finances is read-only: it can review your connected accounts, but it cannot move money, pay bills, cancel subscriptions, make trades, or change your account settings. Financial data can be incomplete or categorized incorrectly, so verify anything that needs your attention.

## What to expect

Start by asking for a review of the last 30 days, including changes to your spending and savings and anything unusual. Then ask for a daily check and a short report every two weeks.

### Example result

In the last 30 days, spending totaled $4,280, savings increased by $820, and combined cash and investment balances grew by $930. Dining increased compared with the previous month. An unfamiliar $42 charge and a possible duplicate subscription renewal need review.

As a follow-up, ask for daily alerts when something needs attention and a short report every two weeks. Connected financial accounts are read-only.




## Take it further

**Set up daily monitoring**



**Prompt:**

```text
Check every day and only notify me when something needs my attention. Every two weeks, send me a short report.
```

**Find subscriptions you forgot about**



**Prompt:**

```text
@Finances Find recurring charges across my accounts and flag any subscriptions that increased in price or that I may no longer use.
```

**See where your money went**



**Prompt:**

```text
@Finances Break down my spending over the last 30 days and show me which categories changed most from the previous month.
```

**Check upcoming bills**



**Prompt:**

```text
@Finances Show me which bills and subscriptions are coming up in the next two weeks and flag anything unusual.
```

**Track your savings progress**



**Prompt:**

```text
@Finances Show me how my savings and account balances have changed over the last 30 days and flag anything that may affect my progress.
```

**Investigate an unfamiliar charge**



**Prompt:**

```text
@Finances Help me understand this charge, check whether it has appeared before, and tell me what I should verify.
```