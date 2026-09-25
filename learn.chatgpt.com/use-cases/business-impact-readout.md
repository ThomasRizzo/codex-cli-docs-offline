---
name: Measure business impact
tagline: Turn experiment or launch results into a scale, change, or stop recommendation.
summary: Give ChatGPT an experiment or launch plan, success metrics, cohort
  data, dashboard exports, customer signals, and launch notes, then ask it to
  quantify lift, check guardrails, explain segments, and draft a sourced impact
  readout.
skills:
  - token: $spreadsheets
    description: Calculate lift, guardrails, segment differences, and supporting
      tables or charts.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read experiment plans, dashboard exports, cohort tables, and launch notes.
  - token: $documents
    description: Create a stakeholder-ready impact readout with methodology notes
      and caveats.
bestFor:
  - Experiments, launches, or initiatives that need a clear scale, adjust, or
    stop recommendation.
  - Teams comparing lift across cohorts or segments while checking guardrail
    metrics.
  - Readouts that need methodology, caveats, and confirmed results separated
    from interpretation.
starterPrompt:
  title: Write a business impact readout
  body: >-
    Measure whether [initiative, experiment, or launch] improved [target
    outcome].


    Use the experiment or launch plan, success metrics, relevant dashboards,
    cohort or assignment data, customer signals, and launch notes I provide.
    Quantify lift or movement, check guardrail metrics, inspect segment
    differences, and explain whether the team should scale, change, or stop the
    initiative.


    Return a business impact readout with charts, methodology notes, caveats,
    source links, and a clear recommendation. Separate confirmed results from
    interpretation and flag any missing inputs.
  suggestedEffort: high
relatedLinks:
  - label: "OpenAI Academy: Data science teams"
    url: https://openai.com/academy/codex-for-work/how-data-science-teams-use-codex/
  - label: Analyze datasets and ship reports
    url: /codex/use-cases/datasets-and-reports
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Start with the decision the readout must support

An impact readout should connect the result to a decision, such as scale, adjust, or stop. Provide the experiment or launch plan, success metrics, cohorts, guardrails, and customer context so ChatGPT can show what the data supports.




1. Name the initiative, target outcome, evaluation window, and decision owner.
2. Attach the plan, metric definitions, assignment or cohort data, dashboards, and launch notes.
3. Ask ChatGPT to validate inputs and explain the analysis method before writing the recommendation.
4. Run the starter prompt and check lift, guardrails, and segment differences.
5. Review methodology, caveats, and missing data with the analyst or experiment owner.




Keep measured results separate from interpretation. If the design or data cannot support a causal claim, ask ChatGPT to narrow the language rather than fill the gap.

## Audit the recommendation

Before sharing the readout, ask for a compact evidence audit focused on the recommendation and its most important numbers.



**Prompt:**

```text
Audit the business impact readout.

Check:

- every material number against its source
- the lift calculation and comparison group
- guardrail metrics
- segment differences and sample gaps
- methodology limitations
- claims that go beyond the data
- whether scale, change, or stop is actually supported

Return corrections and open questions without changing the source data.
```