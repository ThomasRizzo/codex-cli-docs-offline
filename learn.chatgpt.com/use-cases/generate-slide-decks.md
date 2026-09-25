---
name: Create or revise a slide deck
tagline: Turn notes, data, or an existing presentation into a slide deck.
summary: Create or revise a Google Slides or PowerPoint presentation from source
  material, a reference deck, or a reusable template.
skills:
  - token: presentations
    description: Create, edit, and preview Google Slides or PowerPoint presentations
      from source material, a reference deck, or a template.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read connected source files and create or update native Google
      Slides presentations.
  - token: template-creator
    description: Turn an existing PowerPoint presentation into a reusable
      presentation template.
bestFor:
  - Turning notes, research, or data into a presentation.
  - Refreshing an existing deck while preserving its structure and style.
starterPrompt:
  title: Create a slide deck
  body: >-
    Use @Presentations to turn the material I've attached into a presentation
    for its intended audience.


    If I've included an existing deck or template, match its structure, visual
    style, and branding. Keep text and charts editable where possible, use
    visuals when they make the point clearer, and check the finished slides for
    layout or formatting issues. Return the completed presentation and briefly
    flag anything that needs my review.
  suggestedModel: gpt-6-astra
  suggestedEffort: medium
relatedLinks:
  - label: Create and edit files with ChatGPT Work
    url: https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
  - label: ChatGPT for PowerPoint
    url: https://help.openai.com/en/articles/20001242
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Start with the material you already have: notes, a memo, research, a spreadsheet, or an existing presentation. Tell ChatGPT who the deck is for, what it needs to communicate, and what should stay unchanged.

In the ChatGPT desktop app, use `@Presentations` to create or edit a PowerPoint file or build a new presentation from your source material. Connect Google Drive when you want to create or update native Google Slides or reference files stored in Google Workspace. You can also attach local files directly.

To work inside an open PowerPoint presentation, use the [ChatGPT for PowerPoint](https://help.openai.com/en/articles/20001242) add-in. Available plugins, skills, and connected sources can vary by plan and workspace.

Add `@Presentations` to your prompt to find saved presentation templates in
  the Template Gallery. If you don't have a template, Presentations can start
  from a built-in layout or follow an existing deck.

## What to expect

ChatGPT turns the source material into a short slide plan, builds the presentation, and checks the rendered slides before returning the deck. It can follow a reference presentation or saved template, preserve approved figures and branding, and flag claims that need a source.

Here is what that conversation can look like:

ChatGPT reviewed the Frontier Builders strategy brief and review notes, created a six-slide presentation for Monday's leadership review, generated a visual opener, and checked the slides for layout issues.

After a request to make the opener more visual and shorten the decision slide, it refined the deck and returned the updated presentation.




Review the final slides, not only the outline. Check that the story fits the audience, the claims and numbers match the source material, and the slides are readable. Duplicate important decks before making large changes so you can revert if needed.

## Make it work for you

Use follow-on prompts to match a reference, adapt the story, bring in new information, or save a format you expect to use again.

### Save the format as a reusable template



**Prompt:**

```text
Use $template-creator:template-creator to turn this presentation into a reusable template.

Preserve the slide layouts, typography, colors, and brand elements so I can use this format for future [updates, reviews, or presentations].
```

### Match an existing presentation



**Prompt:**

```text
Use @Presentations to revise this deck to match [reference presentation].

Preserve the reference layouts, typography, colors, logos, and section structure. Keep the current content and approved figures, and flag anything that doesn't fit cleanly.
```

### Adapt the deck for a different audience



**Prompt:**

```text
Revise this presentation for [audience].

Make the recommendation, supporting evidence, and next steps clear for them. Remove unnecessary detail, keep important figures intact, and preserve the existing style.
```

### Update the deck with new information



**Prompt:**

```text
Update this presentation using [new notes, spreadsheet, document, or connected source].

Identify which slides need to change, update the relevant claims and visuals, and leave unrelated slides untouched.
```

Template Creator saves a personal template backed by the original presentation, so you can reuse the same format in a future task. Template matching and advanced chart, shape, formatting, or slide-management edits can still need manual refinement. Confirm the final layout and claims before sharing.

See [Create and edit files with ChatGPT
  Work](https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work)
  for the current Google Workspace workflow and supported file types, or use
  [ChatGPT for PowerPoint](https://help.openai.com/en/articles/20001242) to work
  directly in an open PowerPoint presentation.