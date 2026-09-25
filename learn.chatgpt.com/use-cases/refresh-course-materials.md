---
name: Refresh course materials
tagline: Review a course as one connected system.
summary: Use ChatGPT with Google Drive and document tools to review syllabi,
  slides, readings, assignments, rubrics, and outcomes, then return an
  evidence-backed course refresh plan without changing source files.
skills:
  - token: google-drive
    description: Gather the syllabus, slides, readings, assignments, rubrics, and
      prior course notes.
  - token: $documents
    description: Produce a structured, review-ready course refresh plan.
bestFor:
  - Faculty preparing a course for a new term.
  - Courses whose materials have evolved across several files and formats.
  - Reviews that need evidence and faculty approval before source files change.
starterPrompt:
  title: Build a Course Refresh Plan
  body: >-
    Review the syllabus, lecture slides, reading list, assignments, rubrics,
    course outcomes, prior course notes, and term calendar I provide.


    Identify:

    - outdated examples or readings

    - duplicated content

    - alignment gaps between outcomes and assessments

    - inconsistent student guidance

    - weeks with unusually heavy workload


    Create a prioritized course refresh plan with evidence for every
    recommendation. Stop for my review before revising any source files.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Review the course as a system

A course refresh works best when the syllabus, outcomes, lessons, readings, assignments, and rubrics are reviewed together. Gather the current source files and identify which documents are authoritative before you run the starter prompt.

Include the term calendar and prior course notes so ChatGPT can distinguish intentional sequencing from drift between files.

## Build the refresh plan

Ask ChatGPT to:

1. Map learning outcomes to lessons and assessments.
2. Flag outdated, duplicated, or inconsistent material with source evidence.
3. Identify workload spikes and unclear student guidance.
4. Rank revisions by student impact, effort, and dependency.
5. Separate proposed changes from questions that require faculty judgment.

The first output should be a plan, not rewritten course files.

## Review before revising

Check every recommendation against the cited source. Confirm that required content, accessibility guidance, institutional policy, and instructor discretion are represented correctly.

After approving the plan, continue in the same chat and revise one group of files at a time. Preserve the originals and ask for a change summary after each revision pass.