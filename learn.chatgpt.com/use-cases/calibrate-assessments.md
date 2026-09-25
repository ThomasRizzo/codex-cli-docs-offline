---
name: Calibrate assessments
tagline: Review scoring patterns without assigning or changing grades.
summary: Use ChatGPT with de-identified submissions, rubrics, grading exports,
  and sample feedback to create a calibration workbook with evidence flags,
  scoring-pattern checks, and rubric clarification recommendations.
skills:
  - token: $spreadsheets
    description: Compare rubric criteria, score patterns, and evidence in a
      reviewable workbook.
  - token: $documents
    description: Synthesize feedback themes and draft rubric clarification recommendations.
bestFor:
  - Faculty calibrating grading across sections or reviewers.
  - De-identified assessment reviews that need evidence for every flag.
  - Rubrics that may need clearer criteria or examples.
starterPrompt:
  title: Create an Assessment Calibration Workbook
  body: >-
    Review the de-identified submissions, rubric, grading export, sample
    feedback, course outcomes, and calibration rules I provide.


    Create a calibration workbook that:

    - flags possible scoring inconsistencies

    - summarizes common strengths and gaps

    - identifies feedback themes

    - suggests rubric clarifications

    - cites evidence for every flag


    Do not assign or change grades. Route every scoring judgment to faculty
    review.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## De-identify and define the review

Remove direct identifiers before sharing submissions or grading exports. Provide the rubric, course outcomes, calibration rules, and representative feedback so ChatGPT can compare evidence against the intended criteria.

State what the review may flag and what must remain a faculty decision.

## Create the calibration workbook

Use the starter prompt to produce a workbook that separates:

- rubric criteria and expected evidence
- score distributions and possible inconsistencies
- representative examples
- common strengths and learning gaps
- feedback themes
- cases that need joint review

Treat every flag as a review lead, not a grading decision.

## Validate the findings

Faculty reviewers should check the source evidence, confirm that comparisons are like-for-like, and look for missing context such as accommodations or assignment variants. Do not use the workbook to assign, alter, or automate final grades.

After review, ask ChatGPT to turn confirmed patterns into proposed rubric clarifications and calibration examples. Keep uncertain cases visibly unresolved.