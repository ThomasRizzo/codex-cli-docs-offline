---
name: Write an initiative off-track brief
tagline: Explain what changed, why an initiative slipped, and what decision is needed.
summary: Give ChatGPT the executive ask, initiative docs, KPI dashboards,
  tracker, financial model, meeting notes, stakeholder threads, and owner
  updates, then ask it to draft an executive-ready off-track brief.
skills:
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read initiative plans, trackers, models, and approved source documents.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review stakeholder threads, owner updates, and decisions around the
      initiative.
  - token: $spreadsheets
    description: Validate KPI movement, financial assumptions, and tracker data.
  - token: $documents
    description: Create a concise brief with options, tradeoffs, and a decision ask.
bestFor:
  - Strategic initiatives that are slipping and need an evidence-backed
    explanation.
  - Leadership reviews where options, tradeoffs, owners, and a decision ask must
    be clear.
  - Teams reconciling tracker status with KPI, financial, and stakeholder
    context.
starterPrompt:
  title: Draft the off-track brief
  body: >-
    Draft an off-track brief for [initiative].


    Use the executive ask, initiative docs, KPI dashboards, project tracker,
    financial model, meeting notes, stakeholder threads, and owner updates I
    provide.


    Explain what changed, likely causes, execution gaps, risks, options,
    tradeoffs, owners, and the decision needed. Separate confirmed evidence from
    hypotheses, cite the source behind material numbers, and flag anything that
    needs owner confirmation. Do not change the tracker or send the brief.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Business operations teams"
    url: https://openai.com/academy/codex-for-work/how-business-operations-teams-use-codex/
  - label: Run verified operations
    url: /codex/use-cases/verified-operations-workflows
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Reconcile the plan with execution signals

An off-track brief should explain a gap between the plan and current reality. Give ChatGPT the executive ask, initiative plan, tracker, KPI and financial context, owner updates, and stakeholder discussion so it can trace the explanation to evidence.




1. Define the initiative, audience, decision date, and scope of the brief.
2. Attach the plan, tracker, dashboards, model, notes, threads, and owner updates.
3. Ask ChatGPT to list changed assumptions, execution gaps, risks, and missing inputs.
4. Run the starter prompt and inspect the options, tradeoffs, owners, and decision ask.
5. Review the recommendation with initiative owners before changing plans or status.




Keep likely causes separate from confirmed causes. Leaders should be able to see which decision is needed now and which additional evidence would change the recommendation.

## Prepare the decision conversation

Use a follow-up to turn the brief into a short meeting pre-read with the smallest set of decisions and questions that need discussion.



**Prompt:**

```text
Turn the off-track brief into a decision meeting pre-read.

Include:

- the one-sentence situation
- evidence of what changed
- decision needed now
- options and tradeoffs
- risks and owners
- unresolved questions
- source links and missing inputs

Do not imply approval or update the initiative tracker.
```