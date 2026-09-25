---
name: Forecast cash flow
tagline: Find the liquidity low point in an editable forecast workbook.
summary: Give ChatGPT cash-flow inputs and model constraints, then ask it to
  create an editable workbook that preserves the source cadence, flags
  safety-balance breaches, and shows which assumptions drive cash pressure.
skills:
  - token: $spreadsheets
    description: Build editable forecast workbooks, wire formulas to assumptions,
      and add checks for scenarios and input gaps.
bestFor:
  - Finance and operations teams building a 13-week or monthly cash forecast.
  - Forecasts that need receipts, payroll, vendor payments, and working-capital
    assumptions in one workbook.
  - Teams reviewing runway, safety-balance breaches, and scenario drivers before
    a planning meeting.
starterPrompt:
  title: Forecast cash flow
  body: >-
    Use $spreadsheets to build an editable cash-flow forecast workbook from the
    attached source files.


    Use beginning cash, expected receipts, payroll, vendor payments, debt, tax,
    capex, working-capital items, and timing assumptions where available.
    Preserve the source cadence, whether weekly or monthly.


    Include a summary view that flags the liquidity low point, the minimum
    ending cash balance, and any breach of the safety cash threshold. Use
    formulas so I can change assumptions later, and call out missing timing
    assumptions before using placeholders.
  suggestedModel: gpt-6-luna
  suggestedEffort: medium
relatedLinks:
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

When you are building a cash-flow forecast, you want to make sure it is accurate and reflects the reality of your business. You can use ChatGPT to help you create a forecast workbook that you can inspect and revise in ChatGPT. Attach the cash-flow inputs, operating assumptions, and model constraints. You can also use file references when the inputs live in Google Drive or another connected source.

## Make the forecast




1. Attach the cash-flow inputs, operating assumptions, and model constraints.
2. Run the starter prompt and ask for an editable `.xlsx` workbook.
3. Open the workbook in ChatGPT. Expand it into the full-screen view to inspect assumptions, formulas, scenarios, and the summary tab.
4. Continue in the same chat to change collections, payroll, vendor payment, growth, or safety-balance assumptions.




When the workbook appears in the chat, open it and expand it full-screen. Review the timing assumptions, formulas, scenarios, and summary tab, then ask ChatGPT to revise the same workbook from there.

## Review cash pressure

Before using the forecast, ask ChatGPT to identify the low point, tie the workbook back to the source inputs, and list assumptions that need review.



**Prompt:**

```text
Review the cash-flow forecast.

Tell me:

- the first week or month cash drops below the safety balance
- the liquidity low point
- the main drivers of cash pressure
- formulas or tabs that do not tie to the source inputs
- assumptions that need human review
- which scenario I should review before using this with the team

Fix safe formatting or formula issues, then list anything I should review manually.
```

## Run a scenario

After reviewing the workbook in ChatGPT, use follow-up prompts to change one scenario driver at a time.



**Prompt:**

```text
Add a scenario where [collections slow by X days, payroll increases by X%, vendor payments move earlier, or bookings increase by X% with collection timing of N days].

Keep the base case visible, update dependent formulas, and tell me how ending cash and the liquidity low point change.
```