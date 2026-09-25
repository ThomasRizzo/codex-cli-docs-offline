---
name: Audit a workflow
tagline: Turn a messy process into a clear audit and automation plan.
summary: Give ChatGPT trackers, process docs, handoff notes, dashboards, ticket
  history, team discussions, and constraints, then ask it to map the current
  workflow, identify stuck points, and draft an automation-ready process spec.
skills:
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read process documentation, trackers, handoff notes, and source artifacts.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review team discussion, repeated questions, and decisions that
      explain how the process runs.
  - token: $spreadsheets
    description: Inspect workflow trackers, timestamps, ownership, and KPI data.
  - token: $documents
    description: Produce the audit brief, updated process document, and automation spec.
bestFor:
  - Operational workflows with repeated manual steps, unclear ownership, or
    frequent handoff failures.
  - Teams deciding whether a process is ready for automation.
  - Audits that need current steps, stuck points, missing data, and outdated
    sources documented together.
starterPrompt:
  title: Audit this workflow
  body: >-
    Audit the [workflow] before [deadline or next cohort].


    Use the current tracker, process documentation, handoff notes, KPI
    dashboard, ticket history, team discussion, and workflow constraints I
    provide. Create:


    - a workflow audit brief with current steps, owners, stuck points, repeated
    questions, and missing data

    - an updated process document

    - a short automation spec for the two most repetitive manual steps


    Flag outdated or conflicting sources. Keep the automation proposal narrow,
    and do not implement or publish changes.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: Scheduled tasks
    url: /codex/automations
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Map the current process

Workflow automation is easier to evaluate when the current process is explicit. Give ChatGPT the tracker, process docs, handoff notes, tickets, metrics, and discussions that show how work actually moves.




1. Define the workflow boundary, users, inputs, outputs, and review date.
2. Attach the current process document, tracker, handoff notes, tickets, and KPI context.
3. Ask ChatGPT to reconcile the documented process with observed discussion and tracker state.
4. Run the starter prompt to produce the audit brief, process document, and narrow automation spec.
5. Review permissions, exception paths, irreversible actions, and ownership before implementation.




Keep the automation proposal separate from the process description. A good audit explains what should remain manual, what can be verified automatically, and what evidence the new workflow must produce.

## Choose the smallest useful automation

After the audit, ask ChatGPT to compare candidate steps by repetition, risk, data quality, and verification cost.



**Prompt:**

```text
Rank the automation candidates from this workflow audit.

For each candidate, show:

- current manual effort and repetition
- required inputs and permissions
- failure and exception paths
- verification artifact
- reversibility and human approval point
- reason to defer or automate

Recommend only the smallest safe first step. Do not implement it or change the source process document.
```