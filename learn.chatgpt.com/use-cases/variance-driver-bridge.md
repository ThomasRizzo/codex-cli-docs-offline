---
name: Build a variance driver bridge
tagline: Explain movements across actuals, budget, and forecast with
  source-backed drivers.
summary: Give ChatGPT actuals, budget, forecasts, KPI data, thresholds, and
  owner notes, then ask it to rank the drivers behind material movements and
  produce an editable bridge with reconciliations, questions, and source
  citations.
skills:
  - token: $spreadsheets
    description: Reconcile finance inputs, calculate material movements, and create
      an editable driver bridge with formulas and checks.
  - token: $documents
    description: Package source-backed driver commentary and owner questions into a
      reviewable memo when needed.
bestFor:
  - Forecast-to-actual, budget-to-actual, and forecast-to-forecast reviews.
  - Analyses spanning revenue, margin, operating expense, cash, or balance-sheet
    drivers.
  - Teams that need ranked drivers, reconciliations, and owner questions in one
    deliverable.
starterPrompt:
  title: Build the variance bridge
  body: >-
    Use $spreadsheets to explain the [period] movement between [actuals, budget,
    forecast, or prior forecast].


    Use the attached close workbook, budget file, prior forecast, KPI dashboard,
    operating-expense tracker, cash view, and finance-owner notes. Build an
    editable variance bridge across the relevant revenue, margin,
    operating-expense, EBITDA, free-cash-flow, and balance-sheet lines.


    Rank material drivers by impact, reconcile source breaks, draft owner
    questions, and cite the workbook tab, dashboard, tracker, or note behind
    each driver. Flag movements that are below [threshold] separately. Do not
    write a definitive explanation when the sources only support a hypothesis.
  suggestedEffort: medium
relatedLinks:
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

A variance bridge connects a reported movement to the operational drivers behind it. ChatGPT can reconcile actuals, budget, forecasts, KPI data, and owner notes, then rank the drivers and separate supported explanations from questions that still need an owner.

## Choose the comparison

Define the periods and versions you want to compare, such as forecast to actual, budget to actual, or current forecast to prior forecast. Provide the materiality threshold, sign conventions, and the finance lines that matter for this review.




1. Attach the actuals, budget, forecasts, KPI data, and owner notes.
2. Define the comparison, materiality threshold, and required finance lines.
3. Run the starter prompt and ask for an editable bridge workbook.
4. Review source breaks, sign conventions, and driver rankings.
5. Continue in the same chat to resolve owner questions and prepare commentary.




## Challenge the explanations

Driver commentary should follow the evidence. Ask ChatGPT to label hypotheses clearly when the source files show a movement but do not establish its cause.



**Prompt:**

```text
Challenge the explanations in the variance bridge.

For each material driver, show:

- the calculated impact and sign
- the source file, tab, dashboard, tracker, or note
- whether the explanation is supported, inferred, or still open
- any reconciliation break
- the owner question needed to close the gap

Re-rank the bridge by absolute impact and keep unsupported explanations out of the executive summary.
```