---
name: Prepare a leadership reporting pack
tagline: Turn company progress, financial metrics, and owner updates into a
  source-backed reporting pack.
summary: Give ChatGPT the prior pack, progress outline, initiative trackers, KPI
  and forecast inputs, leadership notes, and owner commentary, then ask it to
  build an editable company or board update with a clear through-line, validated
  proof points, risks, milestones, and review flags.
skills:
  - token: $slides
    description: Update an editable PowerPoint deck, preserve its visual system, and
      render slides for layout review.
  - token: $spreadsheets
    description: Validate updated metrics and deltas against the latest forecast,
      KPI, and cash source files.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read approved prior packs, progress trackers, forecast files,
      dashboards, leadership notes, and owner inputs from exact Drive locations.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Read approved owner updates and open-question threads that should
      inform the pack.
bestFor:
  - Recurring company, leadership, CFO, or board updates built from a stable
    template.
  - Reporting cycles that combine initiative progress, metrics, charts,
    narrative, and owner inputs.
  - Teams that need a clear record of changed figures, risks, next milestones,
    and unresolved assumptions.
starterPrompt:
  title: Prepare the reporting pack
  body: >-
    Use $slides and $spreadsheets to prepare the [company, leadership, CFO, or
    board] reporting pack for [period or topic].


    Use the prior pack or progress outline, initiative trackers, metric
    snapshots, latest forecast model, KPI dashboard, cash view, leadership
    notes, owner commentary, and open questions I provide. If any sources are in
    connected plugins, use only the exact @google-drive files or @slack threads
    I name.


    Identify the through-line across workstreams, then update the narrative,
    proof points, key metrics, deltas, charts, risks, and next milestones while
    preserving the existing deck's visual system. Return an editable .pptx file
    and a short pack summary covering what changed, which figures do not tie to
    a source, what still needs owner input, which assumptions remain open, and
    which slides need leadership review. Render the deck and fix clipping,
    overflow, or layout issues before delivery. Do not share it.
  suggestedModel: gpt-6-astra
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Business operations teams"
    url: https://openai.com/academy/codex-for-work/how-business-operations-teams-use-codex/
  - label: Plugins
    url: /codex/plugins
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Build the narrative from the reporting record

Company and board reporting needs a narrative that connects initiative progress, financial and operating metrics, risks, and next steps. ChatGPT can use the prior pack for structure and approved source files for facts while preserving the deck's visual system and keeping unresolved assumptions visible.

## Refresh from approved sources

Provide the prior pack or progress outline, initiative trackers, latest forecast, KPI dashboard, cash view, leadership notes, and owner commentary. Tell ChatGPT which slides are in scope, which sources are authoritative, and which parts of the template must remain unchanged.




1. Attach the prior pack and the latest approved source files.
2. Identify the reporting period, audience, in-scope workstreams, and review owners.
3. Ask ChatGPT to find the through-line across progress, proof points, risks, and next milestones.
4. Run the starter prompt and request an editable `.pptx` file.
5. Review the source tie-out for every changed claim, metric, and chart.
6. Inspect the rendered slides for clipping, overflow, and layout drift, then resolve owner inputs in the same chat.




## Review what changed

The reporting pack should make it easy to distinguish updated facts from open questions. Ask ChatGPT to keep a change summary and owner checklist alongside the deck so reviewers can focus on material differences without rewriting the whole update.



**Prompt:**

```text
Audit the refreshed reporting pack against the prior pack and source files.

List:

- slides with changed metrics, charts, or commentary
- claims, proof points, risks, and milestone dates that need verification
- figures that tie to the forecast, KPI dashboard, or cash view
- figures that do not have a clear source
- assumptions and owner inputs that remain open
- slides that need leadership review
- clipping, overflow, or inconsistent formatting found in the rendered deck

Fix safe layout issues, but do not invent or silently replace missing claims or metrics. Keep unresolved items grouped by owner.
```