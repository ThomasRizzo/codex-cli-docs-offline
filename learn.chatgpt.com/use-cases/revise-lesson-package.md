---
name: Revise a lesson package
tagline: Apply approved feedback consistently across connected files.
summary: Use ChatGPT with a current lesson folder, written or dictated feedback,
  approved files, and confirmation rules to create a revision plan, update
  connected materials, preserve prior versions, and return a verified change
  log.
skills:
  - token: google-drive
    description: Read the approved lesson files and preserve prior versions.
  - token: $documents
    description: Apply approved feedback and produce a file-by-file change log.
bestFor:
  - Teachers revising a deck, guide, handout, and answer key together.
  - Feedback that must be applied consistently across several files.
  - Reviews that need an approval checkpoint, archive, and change log.
starterPrompt:
  title: Revise a Lesson Package
  body: |-
    Use this feedback to revise the approved lesson files in this folder.

    First, show me a file-by-file change plan. After I approve it:
    - update the lesson deck, teacher guide, student handout, and answer key
    - preserve prior versions in Archive
    - verify that examples, directions, and answers still match
    - create a concise change log
    - list unresolved questions

    Do not change files outside the approved list.
  suggestedModel: gpt-6-astra
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Convert feedback into a change plan

Gather the current lesson folder, the feedback, the approved file list, and any changes that require explicit confirmation. Distinguish requested changes from suggestions or open questions.

Ask ChatGPT to map each feedback item to the files and sections it would affect.

## Approve the scope

Review the file-by-file plan before allowing edits. Confirm which prior versions must be preserved and which source file controls shared content such as terminology, examples, or answers.

After approval, revise connected files in one coordinated pass.

## Verify cross-file consistency

Compare the updated deck, teacher guide, handout, and answer key. Check that:

- examples and answers still match
- instructions use consistent terms
- timing changes appear everywhere they should
- source links remain intact
- prior versions are archived
- unresolved questions remain visible

Use the change log to support a final educator review. Do not treat requested edits as approved instructional or policy decisions unless the responsible reviewer confirms them.