---
name: Analyze KPI root causes
tagline: Explain an unexpected metric movement with evidence and next actions.
summary: Give ChatGPT KPI dashboards, metric definitions, exports, segment cuts,
  launch context, and stakeholder threads, then ask it to separate confirmed
  drivers from hypotheses in a source-backed root-cause brief.
skills:
  - token: $spreadsheets
    description: Inspect metric exports, calculate cuts, and create supporting charts.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read metric definitions, dashboards, launch context, and approved
      source files.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Check relevant stakeholder context and recent changes.
  - token: $documents
    description: Package the analysis as a reviewable brief with sources and caveats.
bestFor:
  - Product, growth, or operations teams investigating an unexpected KPI
    movement.
  - Root-cause questions that require segment, cohort, channel, geography, or
    product cuts.
  - Reviews where confirmed drivers must stay separate from plausible hypotheses.
starterPrompt:
  title: Find the KPI root cause
  body: >-
    Explain why [KPI] changed during [time window].


    Use the KPI dashboard, metric definition, source exports, segment cuts,
    launch or campaign context, and stakeholder threads I provide. Break down
    the movement by relevant segment, cohort, channel, geography, and product
    surface.


    Return a root-cause brief with:

    - charts and material changes

    - confirmed drivers

    - hypotheses to investigate

    - caveats and data-quality issues

    - source links

    - open questions

    - recommended actions


    Do not treat correlation as proof, and do not change the source data.
  suggestedModel: gpt-6-luna
  suggestedEffort: xhigh
relatedLinks:
  - label: "OpenAI Academy: Data science teams"
    url: https://openai.com/academy/codex-for-work/how-data-science-teams-use-codex/
  - label: Query tabular data
    url: /codex/use-cases/analyze-data-export
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Define the metric before explaining movement

Root-cause work starts with a stable definition, comparison window, and source-of-truth data. Give ChatGPT the KPI definition, dashboard, exports, and context around launches or campaigns before asking it to explain the change.




1. State the KPI, comparison period, expected direction, and decision the analysis should support.
2. Attach the dashboard, metric definition, exports, segment cuts, and relevant context.
3. Ask ChatGPT to inspect data quality and propose the most useful breakdowns.
4. Run the starter prompt and review confirmed drivers separately from hypotheses.
5. Validate the recommended actions with the metric owner before changing a dashboard or process.




Use charts to make the movement inspectable, but do not treat a segment correlation as proof of cause. Keep source links, caveats, and open questions with the brief.

## Challenge the root cause

Ask ChatGPT to look for counterevidence and alternative explanations before the brief goes to leadership.



**Prompt:**

```text
Challenge the root-cause brief.

For each confirmed driver or hypothesis, list:

- supporting source and calculation
- counterevidence or alternative explanation
- segment or cohort where it does not hold
- data-quality limitation
- next check that would increase confidence

Revise the recommendation only when the evidence supports it, and keep all changes visible.
```