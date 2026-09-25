---
name: Consolidate spreadsheets
tagline: Join spreadsheet exports into one refreshable workbook.
summary: Give ChatGPT spreadsheet exports, join keys, targets, segment
  definitions, and reporting rules, then ask it to create a consolidated
  workbook with cleaned joins, charts, insights, assumptions, refresh
  instructions, and mismatch review.
skills:
  - token: $spreadsheets
    description: Inspect exports, clean joins, build formulas, and validate the
      resulting workbook.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read approved spreadsheet sources and reporting templates from Drive.
  - token: $documents
    description: Add clear assumptions, refresh instructions, and a review summary.
bestFor:
  - Reporting workflows that combine multiple exports into one updateable
    workbook.
  - Pipeline, account, operations, or performance analysis with explicit join
    keys and targets.
  - Teams that need mismatched records and refresh assumptions isolated for
    review.
starterPrompt:
  title: Consolidate these exports
  body: >-
    Consolidate the attached spreadsheet exports into one updateable workbook.


    Join on [record or account key]. Clean duplicate records, calculate [metrics
    or views], compare [actuals or pipeline] with [target], and create a
    dashboard with charts and plain-English insights.


    Include:

    - assumptions and refresh instructions

    - a review section for mismatched keys or records that did not join cleanly

    - a short change log


    Do not invent join keys or silently merge conflicting records. Preserve the
    original files and return the consolidated workbook for review.
  suggestedModel: gpt-6-sol
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: Spreadsheet skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Establish the join and reporting rules

Consolidation is safest when the key, field definitions, target calculations, and duplicate rules are explicit. Give ChatGPT the source exports and ask it to surface records that do not join cleanly instead of guessing.




1. Attach the exports, mapping notes, targets, and reporting requirements.
2. Confirm the join key, duplicate rule, period definitions, and required output views.
3. Run the starter prompt and request an editable workbook with a review section.
4. Inspect formulas, joins, mismatches, assumptions, and refresh instructions.
5. Re-run the checks after any change to the source files or reporting rules.




Keep the original exports unchanged. A useful consolidated workbook makes it easy to tell which rows joined, which were excluded, and which assumptions a future refresh depends on.

## Validate the refresh path

After the first workbook is ready, ask ChatGPT to simulate the next refresh and report which steps are repeatable and which still need a human decision.



**Prompt:**

```text
Test the refresh process for this consolidated workbook.

Report:

- inputs that can be replaced without changing the workflow
- formulas, joins, and charts that update correctly
- duplicate or mismatched keys
- assumptions that are not documented
- rows that need manual review
- steps that should become a reusable skill or automation

Do not overwrite the source exports or change business definitions.
```