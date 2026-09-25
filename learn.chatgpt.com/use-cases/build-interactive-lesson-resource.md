---
name: Build an interactive lesson resource
tagline: Turn an approved lesson package into a tested student experience.
summary: Use Sites with approved lesson materials, practice questions, feedback
  rules, accessibility requirements, and design preferences to build and test an
  interactive lesson resource for educator review.
skills:
  - token: sites
    description: Build, preview, test, and publish an interactive lesson resource.
  - token: google-drive
    description: Gather the approved lesson package and supporting materials.
bestFor:
  - Teachers turning reviewed materials into interactive practice.
  - Lessons that need guided examples, feedback, and a final self-check.
  - Student-facing resources that require accessibility testing and educator
    approval.
starterPrompt:
  title: Build an Interactive Lesson Resource
  body: >-
    Use @sites to build an interactive lesson resource for [grade, subject, and
    topic] from the approved lesson package in this folder.


    Include:

    - a short introduction

    - one guided example

    - three practice interactions with feedback

    - a final self-check

    - teacher notes


    Meet the accessibility requirements and feedback rules I provide. Test the
    main paths, report limitations, and do not publish or share the resource
    until I approve the reviewed version.
  suggestedEffort: high
relatedLinks:
  - label: Sites documentation
    url: /codex/sites
  - label: Sites showcase
    url: /showcase/sites
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Start from approved instructional content

Use the reviewed lesson package, practice questions, feedback rules, accessibility requirements, and design preferences. Identify the learning goal and the evidence that a student has completed the intended practice.

Do not invent missing instructional policy or learner data.

## Build the learning flow

A focused first version should include:

- a clear introduction
- a guided example
- a small set of practice interactions
- feedback that follows the supplied rules
- a final self-check
- teacher-facing notes

Use Sites to build and preview the resource. Keep the interaction model simple enough to test thoroughly.

## Test before sharing

Check the main paths, keyboard use, labels, contrast, responsive behavior, feedback logic, and content accuracy. Test incorrect as well as correct responses.

Ask ChatGPT to document limitations and unresolved accessibility or instructional questions. An educator should approve the reviewed resource before it is published or shared with students.