---
name: Refresh a forecast and plan
tagline: Update assumptions and compare base, upside, and downside plans.
summary: Give ChatGPT an operating model, latest actuals, approved assumptions,
  owner inputs, and scenario rules, then ask it to refresh the forecast and
  compare scenarios with sensitivities, trigger points, and review notes.
skills:
  - token: $spreadsheets
    description: Refresh an editable forecast, preserve assumption controls, and
      build scenario and sensitivity tables with formula checks.
bestFor:
  - Operating-plan or forecast updates that incorporate recent actuals and
    approved assumptions.
  - Base, upside, and downside scenarios covering revenue, margin, hiring, and
    cash.
  - Planning reviews that need sensitivities, trigger points, and explicit
    approval items.
starterPrompt:
  title: Refresh the forecast and scenarios
  body: >-
    Use $spreadsheets to refresh the [forecast or operating plan] for
    [business].


    Use the attached operating model, revenue-driver model, headcount plan, cash
    forecast, latest actuals, approved planning assumptions, owner inputs, and
    prior forecast. Preserve the original model and make assumption changes
    visible.


    Create base, downside, and upside scenarios with the key revenue, margin,
    hiring, and cash drivers. Summarize cash impact, hiring implications,
    trigger points, key sensitivities, risks, and a recommendation. Include a
    sensitivity table and list every assumption that needs approval before the
    plan is shared. Do not overwrite business assumptions silently.
  suggestedEffort: high
relatedLinks:
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

A forecast refresh should show which assumptions changed and how those changes affect the plan. ChatGPT can update an editable model, build comparable scenarios, and summarize the sensitivities and trigger points leadership should review.

## Prepare the planning inputs

Attach the operating model, latest actuals, approved assumptions, owner inputs, and prior forecast. Include the planning calendar and scenario rules, and identify assumptions that ChatGPT may update only after approval.




1. Attach the operating model and supporting driver files.
2. Add the latest actuals, approved assumptions, owner inputs, and prior forecast.
3. Define base, upside, and downside rules along with protected assumptions.
4. Run the starter prompt and request an editable forecast workbook.
5. Review assumption changes, formula links, sensitivities, and approval items.
6. Continue in the same chat to tune one driver at a time.




## Compare the scenarios

Good scenario planning makes the differences easy to audit. Keep the base case visible and trace each scenario back to a small set of explicit driver changes.



**Prompt:**

```text
Compare the base, downside, and upside scenarios.

For each scenario, list:

- changed assumptions and their source
- revenue, margin, hiring, and cash impact
- the most sensitive drivers
- trigger points that would move us into this scenario
- risks and open assumptions
- approvals required before sharing the plan

Check formula links and keep the prior forecast available for comparison. Do not change any additional assumptions.
```