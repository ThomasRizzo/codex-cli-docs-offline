---
name: Clean and review a financial model
tagline: Check formulas, links, tie-outs, and assumptions before a high-stakes review.
summary: Give ChatGPT a financial model and its supporting sources, then ask it
  to make safe cleanup changes and return a severity-ranked QA memo covering
  formula risks, broken links, source tie-outs, and assumptions that need an
  owner.
skills:
  - token: $spreadsheets
    description: Inspect workbook structure and formulas, make safe edits, and
      render the cleaned model for review.
bestFor:
  - Financial models that need formula and source QA before leadership,
    investor, or board review.
  - Workbooks with hardcodes, broken links, inconsistent periods, or unclear
    checks.
  - Teams that want safe cleanup separated from business-assumption changes.
starterPrompt:
  title: Clean and review the model
  body: >-
    Use $spreadsheets to clean and review [model name] before it goes to
    [audience].


    Inspect workbook structure, formulas, hardcodes, broken links, circular
    references, sign conventions, period labels, source tie-outs, model checks,
    and output tabs. Pay special attention to [priority tabs or outputs].


    Make safe cleanup and formula fixes where the intended behavior is clear. Do
    not change business assumptions without approval. Return an editable cleaned
    workbook plus a severity-ranked QA memo with issues found, fixes made,
    remaining assumptions, and the exact cells or tabs that need finance-owner
    review. Preserve the original file as a separate input.
  suggestedEffort: high
relatedLinks:
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

Financial models often accumulate hidden hardcodes, stale links, inconsistent periods, and checks that no longer tie. ChatGPT can inspect the workbook systematically, make narrowly scoped fixes, and produce a QA memo that tells a finance owner where judgment is still required.

## Define the review boundary

Attach the model and the source files it should tie to. Name the audience, priority tabs, expected outputs, and any assumptions ChatGPT must leave unchanged. Keep the original workbook available so you can compare every edit.




1. Attach the model and its supporting source files.
2. Identify priority tabs, expected checks, and protected assumptions.
3. Run the starter prompt and request a cleaned copy plus a QA memo.
4. Open the workbook in ChatGPT and inspect changed formulas, links, and output tabs.
5. Resolve finance-owner questions before accepting assumption changes.




## Check the cleanup

The QA memo should rank issues by severity and point to exact cells or tabs. Safe formatting, labeling, and clear formula repairs can be applied directly; ambiguous business logic should remain flagged for review.



**Prompt:**

```text
Compare the cleaned model with the original.

List:

- formulas, links, or checks that changed
- source tie-outs that now pass or still fail
- hardcodes and assumptions that remain
- circular references or sign issues
- output tabs affected by the changes
- items that require finance-owner approval

Do not make additional assumption changes. Return a concise change log with exact cell or tab references.
```