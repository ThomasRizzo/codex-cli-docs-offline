---
name: Build a unit plan from source files
tagline: Turn standards, pacing, and prior lessons into a teachable sequence.
summary: Use ChatGPT with standards, curriculum guidance, prior lesson files, a
  school calendar, assessment guidance, and learner needs to create an editable
  unit plan with goals, lesson sequence, source links, and review flags.
skills:
  - token: google-drive
    description: Gather approved standards, pacing guidance, prior lessons, and
      assessment materials.
  - token: $documents
    description: Create an editable, source-linked unit plan.
bestFor:
  - Teachers planning a unit from approved curriculum sources.
  - Units that need standards, pacing, assessment, and calendar alignment.
  - Planning where missing or conflicting guidance should remain visible.
starterPrompt:
  title: Create a Unit Plan
  body: >-
    Using the standards, pacing guide, prior lesson files, assessment guidance,
    calendar, and learner needs in this folder, create an editable [length] unit
    plan for [grade, subject, and topic].


    Include:

    - learning goals

    - lesson sequence

    - links to source files

    - formative checks

    - likely misconceptions

    - review flags


    Flag missing or conflicting guidance instead of guessing. Label the result
    Draft for educator review.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Ground the unit in approved sources

Collect the standards, curriculum or pacing guide, school calendar, prior lessons, assessment guidance, and relevant learner needs. Identify which documents are current and which are examples only.

Ask ChatGPT to map every major planning decision to an approved source.

## Draft the sequence

Use the starter prompt to create a plan with:

1. Learning goals and standards.
2. A lesson sequence that fits the available calendar.
3. Required materials and source links.
4. Formative checks and assessment connections.
5. Likely misconceptions or prerequisite gaps.
6. Decisions and missing guidance for teacher review.

The draft should show why each lesson belongs in the sequence, not only list activities.

## Review instructional judgment

Check the standards alignment, pacing, assessment load, accessibility, and age appropriateness. Confirm that ChatGPT has not invented district requirements or learner information.

Revise the plan in the same chat, then mark the approved version clearly before using it to generate decks or classroom materials.