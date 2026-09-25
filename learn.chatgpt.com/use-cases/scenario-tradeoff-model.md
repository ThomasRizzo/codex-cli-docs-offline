---
name: Model strategic scenarios and tradeoffs
tagline: Compare strategic paths with assumptions, risks, cost, timing, and impact.
summary: Give ChatGPT a financial model, KPI dashboard, planning docs, market
  context, stakeholder notes, operational data, and decision criteria, then ask
  it to compare options and produce a reviewable tradeoff model.
skills:
  - token: $spreadsheets
    description: Build comparable scenarios, sensitivities, and cost or timing views.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read models, planning docs, dashboards, and approved source material.
  - token: $documents
    description: Summarize options, prioritization, risks, ownership, and
      assumptions for review.
bestFor:
  - Strategic choices where leaders need comparable paths and explicit tradeoffs.
  - Planning decisions that combine cost, timing, operational capacity, and
    customer impact.
  - Teams that want a recommendation while keeping assumptions inspectable and
    changeable.
starterPrompt:
  title: Compare strategic scenarios
  body: >-
    Compare strategic paths for [decision].


    Use the financial model, KPI dashboard, planning docs, market context,
    stakeholder notes, operational data, and decision criteria I provide. Create
    a scenario and tradeoff model with:


    - options and prioritization matrix

    - recommendation and rationale

    - cost and timing

    - risks and mitigations

    - ownership

    - customer or business impact

    - assumptions to inspect


    Do not overwrite the source model or treat unsupported assumptions as facts.
    Flag inputs that need approval.
  suggestedModel: gpt-6-astra
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Business operations teams"
    url: https://openai.com/academy/codex-for-work/how-business-operations-teams-use-codex/
  - label: Refresh a forecast and plan
    url: /codex/use-cases/refresh-forecast-and-plan
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Make the options comparable

Scenario work is easier to review when every option uses the same assumptions and decision criteria. Give ChatGPT the model, KPI context, planning documents, operational data, and stakeholder constraints before it builds the comparison.




1. State the decision, options, time horizon, and criteria.
2. Attach models, dashboards, planning docs, market context, and operational data.
3. Ask ChatGPT to identify assumptions that are shared, option-specific, or missing.
4. Run the starter prompt and review cost, timing, risk, ownership, and customer impact.
5. Change assumptions explicitly and compare the recommendation across scenarios.




Keep the source model intact and save scenario outputs separately. The most useful result is not only a recommendation but also a clear explanation of which assumptions would change it.

## Test sensitivity

Ask ChatGPT to vary the assumptions that matter most and show when the preferred option changes.



**Prompt:**

```text
Run a sensitivity review on the scenario model.

Identify:

- the assumptions with the largest effect on the recommendation
- the breakpoints where another option becomes preferable
- costs, timing, or customer impacts that are not comparable
- risks that are hard to quantify
- inputs that require owner approval

Do not overwrite the model or treat a scenario as an approved plan.
```