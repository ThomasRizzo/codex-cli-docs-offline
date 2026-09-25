---
name: Plan a dashboard and monitoring workflow
tagline: Define metrics, owners, quality checks, and the decisions a dashboard supports.
summary: Give ChatGPT a strategy brief, workflow context, metric definitions,
  source exports, dashboard examples, and stakeholder feedback, then ask it to
  draft a dashboard spec and monitoring plan.
skills:
  - token: $spreadsheets
    description: Inspect source data, metric definitions, and quality checks behind
      the dashboard.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read strategy briefs, dashboard examples, and stakeholder feedback.
  - token: $documents
    description: Produce an editable dashboard spec with owners, handoffs, and
      publication risks.
bestFor:
  - Teams defining a new dashboard or rebuilding one that no longer supports
    decisions.
  - Metrics work that needs KPI hierarchy, chart specs, filters, and quality
    checks documented.
  - Analysts and operators planning ownership, monitoring, and publication
    handoffs.
starterPrompt:
  title: Draft the dashboard spec
  body: >-
    Draft a dashboard specification for [workflow, product, or business
    question].


    Use the strategy brief, workflow context, metric definitions, source
    exports, dashboard examples, and stakeholder feedback I provide. Return:


    - the decisions the dashboard should support

    - KPI hierarchy and metric definitions

    - chart and filter specifications

    - data-quality and QA checks

    - owners and handoffs

    - monitoring plan

    - publication and access risks


    Do not invent metrics or claim that a dashboard is production-ready without
    validating its sources.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Data science teams"
    url: https://openai.com/academy/codex-for-work/how-data-science-teams-use-codex/
  - label: Analyze datasets and ship reports
    url: /codex/use-cases/datasets-and-reports
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Design around decisions, not charts

Before specifying a dashboard, define the decisions it should support and the owners who will act on the signals. Give ChatGPT metric definitions, source exports, existing examples, workflow context, and stakeholder feedback so the spec stays grounded in actual data.




1. Name the workflow, audience, decisions, and review cadence.
2. Attach the metric glossary, source exports, dashboard examples, and stakeholder feedback.
3. Ask ChatGPT to identify source gaps, quality checks, and ownership needs.
4. Run the starter prompt to draft KPI hierarchy, chart specs, filters, and monitoring.
5. Review the publication risks and test the proposed metrics against source data.




Treat the dashboard spec as a contract between analysts, data owners, and users. Define what each chart means, when it should be trusted, and what action it should trigger.

## Make monitoring actionable

After the spec is reviewed, ask ChatGPT to turn the highest-value checks into a monitoring checklist with clear escalation boundaries.



**Prompt:**

```text
Turn this dashboard spec into a monitoring checklist.

For each KPI, include:

- source and owner
- expected update cadence
- freshness and quality checks
- threshold or anomaly to inspect
- who should be notified
- evidence to attach before escalating

Keep the checklist draft-only and do not create alerts or publish the dashboard.
```