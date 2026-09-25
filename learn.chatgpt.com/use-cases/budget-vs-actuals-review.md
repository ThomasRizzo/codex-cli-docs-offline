---
name: Review budget vs. actuals
tagline: Turn plan, actuals, and close notes into a variance workbook.
summary: Give ChatGPT a budget, actuals export, and close notes, then ask it to
  map actuals to plan, calculate variances, flag reconciliation issues, and
  separate supported explanations from open finance questions.
skills:
  - token: $spreadsheets
    description: Inspect spreadsheet inputs, clean and map rows, create variance
      tables, and produce reviewable workbook outputs.
bestFor:
  - Month-end reviews that compare budget plans with actual spend exports.
  - Finance teams preparing leadership commentary from GL, spend, or department
    actuals.
  - Workbooks where category mapping, tie-outs, and unsupported explanations
    need review.
starterPrompt:
  title: Review budget vs. actuals
  body: >-
    Use $spreadsheets to update the budget vs. actuals review from the attached
    files.


    Compare actuals to plan, map actuals to the right budget categories,
    summarize the major variances, and prepare a clean review view as an
    editable .xlsx workbook.


    Preserve the raw inputs, use formulas for dollar and percentage variance
    calculations, and flag categories that do not map cleanly instead of forcing
    a match. Use account type to determine favorable or unfavorable variance:
    revenue above plan is favorable, while expense above plan is unfavorable.
  suggestedEffort: medium
relatedLinks:
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

If you're working on a budget and want to review the variances or inspect any issues, ChatGPT can help you create a fully functional review workbook you can work with.

Attach the budget plan, actuals export, and close notes, then ask ChatGPT for an editable review workbook. ChatGPT can preserve the raw inputs, map actuals to plan, calculate variances, and create a summary view you can inspect in the chat.

## Create the review workbook




1. Attach the budget plan, actuals export, and close notes, or provide exact file references along with the source.
2. Run the starter prompt and ask for an editable `.xlsx` workbook.
3. Open the workbook in ChatGPT. Expand it into the full-screen view to inspect the raw inputs, mappings, variance formulas, and summary tab.
4. Continue in the same chat to fix category mappings, add department cuts, or draft the finance summary.




If the source files are in a connected plugin, mention the exact files or folder. Avoid asking ChatGPT to search a broad Drive or workspace when the review should use specific finance sources. When the workbook appears in the chat, open it and expand it full-screen to review the raw inputs, mappings, variance formulas, and summary tab before asking for revisions.

## Check the variances

Before sharing the workbook, ask ChatGPT to audit the categories, formulas, and variance explanations.



**Prompt:**

```text
Check the budget vs. actuals review before I share it.

List:

- the most material unfavorable variances by dollar impact
- the most material favorable variances by dollar impact
- categories that may be mapped incorrectly
- accounts where the favorable or unfavorable sign convention is unclear
- explanations supported by the close notes
- explanations that need human review
- formula or tie-out issues in the workbook

Fix safe formatting or formula issues, then list anything finance should resolve before leadership review.
```