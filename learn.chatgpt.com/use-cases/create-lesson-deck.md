---
name: Create a lesson deck
tagline: Turn approved teaching materials into an editable presentation.
summary: Use ChatGPT with a reviewed unit plan, prior slides or notes, a
  district template, approved images, and accessibility requirements to create a
  native lesson deck with speaker notes, checks for understanding, and source
  attribution.
skills:
  - token: google-drive
    description: Gather the reviewed unit plan, approved sources, images, and
      district template.
  - token: $slides
    description: Create a native, editable lesson presentation.
bestFor:
  - Teachers turning an approved lesson plan into a polished deck.
  - Presentations that must follow a district template and accessibility
    guidance.
  - Lessons that need speaker notes, formative checks, and citations.
starterPrompt:
  title: Create a Lesson Deck
  body: >-
    Create a native Google Slides deck for [lesson] using the reviewed unit
    plan, approved source materials, images, and district template in this
    folder.


    Include:

    - an opening question

    - concise explanations

    - worked examples

    - two checks for understanding

    - an exit ticket

    - speaker notes

    - source attribution


    Follow the accessibility requirements I provide. Keep the deck editable and
    label it Draft for educator review.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Start from reviewed content

Use an approved unit or lesson plan, current source materials, a district presentation template, approved images, and accessibility requirements. Separate source content from optional examples.

A clear source hierarchy prevents outdated slides from overriding the reviewed plan.

## Build the presentation

Ask ChatGPT to create a native, editable deck with a coherent lesson flow:

- opening question or phenomenon
- concise instruction
- worked examples
- checks for understanding
- practice or discussion prompts
- exit ticket
- speaker notes
- source attribution

The deck should support instruction rather than turn every detail into slide text.

## Inspect the native deck

Review the actual presentation, not only an outline. Check readability, pacing, accessibility, image permissions, source accuracy, and whether notes contain the detail the teacher needs.

Revise the deck in focused passes. Keep it labeled as a draft until an educator confirms that the content and instructional sequence are ready to use.