---
name: Create a classroom materials pack
tagline: Produce aligned teaching, practice, and family materials.
summary: Use ChatGPT with a reviewed lesson deck, unit plan, school guidance,
  handouts, and accessibility or language requirements to create a teacher
  guide, student handout, answer key, family overview, and materials checklist.
skills:
  - token: google-drive
    description: Gather the reviewed deck, unit plan, school guidance, and existing
      materials.
  - token: $documents
    description: Create consistent, editable classroom and family materials.
bestFor:
  - Teachers who need companion materials for a reviewed lesson.
  - Packs where terminology, examples, timing, and instructions must agree.
  - Materials that need accessibility, language, or policy review flags.
starterPrompt:
  title: Create a Classroom Materials Pack
  body: >-
    Using the reviewed lesson deck and unit plan in this folder, create a
    coordinated classroom materials pack:


    - teacher guide

    - student handout

    - answer key

    - one-page family overview

    - materials checklist


    Keep terminology, examples, timing, and directions consistent across every
    file. Use the school guidance and existing materials I provide. Flag
    anything that needs accessibility, translation, or policy review.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Set a shared source of truth

Start with the reviewed lesson deck and unit plan. Add current school guidance, existing handouts, accessibility requirements, and language needs.

Tell ChatGPT which files control terminology, examples, timing, and instructional decisions.

## Create the companion materials

Use the starter prompt to generate a coordinated set:

1. A teacher guide with preparation and facilitation notes.
2. A student handout aligned to the lesson sequence.
3. An answer key that matches the handout exactly.
4. A concise family overview in appropriate language.
5. A materials and preparation checklist.

Ask ChatGPT to compare the files after drafting and report mismatched vocabulary, examples, directions, or answers.

## Review each audience separately

Teachers should review instructional accuracy and usability. Check student materials for clarity and accessibility, answer keys for exact alignment, and family communication for policy and language requirements.

Keep every file editable and visibly in draft until the responsible educator approves the full pack.