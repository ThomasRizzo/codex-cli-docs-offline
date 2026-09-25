---
name: Audit course section consistency
tagline: Compare shared courses while preserving instructor discretion.
summary: Use ChatGPT to compare section syllabi, schedules, assignments,
  policies, LMS exports, and department guidance, then create an evidence-backed
  consistency audit with conflicts, priorities, and owners.
skills:
  - token: google-drive
    description: Gather section syllabi, assignment prompts, schedules, and
      department guidance.
  - token: $spreadsheets
    description: Build a cross-section comparison with evidence, priorities, and owners.
bestFor:
  - Multi-section courses with shared outcomes or requirements.
  - Departments reviewing student-facing conflicts across sections.
  - Audits that must distinguish required alignment from instructor choice.
starterPrompt:
  title: Audit Course Sections
  body: >-
    Compare the syllabi, assignments, schedules, LMS exports, course outcomes,
    department guidance, and instructor notes for these sections.


    Create a consistency audit that:

    - separates required alignment from instructor discretion

    - flags student-facing conflicts

    - cites the source for every finding

    - recommends a baseline checklist with owners

    - ranks fixes by urgency and impact


    Return a draft for faculty review and do not overwrite source materials.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Establish the shared baseline

Start with the common course outcomes, department requirements, and any policies that apply to every section. Then add each section's syllabus, schedule, assignments, grading weights, LMS guidance, and instructor notes.

Label required elements separately from areas where instructors may choose different approaches.

## Run the comparison

Ask ChatGPT to compare the sections across a stable set of dimensions:

1. Outcomes and required content.
2. Grading weights and assessment expectations.
3. Due-date, attendance, and late-work language.
4. Assignment instructions and student-facing terminology.
5. LMS visibility and navigation.
6. Legitimate instructor-specific choices.

For every conflict, require a source reference and an explanation of the student impact.

## Resolve findings with faculty

Review the audit with the section leads. Confirm whether each difference is an error, an approved variation, or an unresolved policy question.

Once decisions are made, ask ChatGPT for a baseline checklist with owners and proposed language. Update source materials only after the relevant instructors approve the changes.