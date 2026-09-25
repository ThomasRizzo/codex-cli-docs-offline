---
name: Diagnose a stalled deal
tagline: Find the real blocker and the next customer-facing move.
summary: Give ChatGPT stage history, closed activities, call transcripts,
  emails, deal threads, security or procurement notes, and account context, then
  ask it to explain the blocker, prior attempts, escalation path, and next
  action.
skills:
  - token: $spreadsheets
    description: Trace stage history, activity, and timing signals from CRM exports.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read account context, security or procurement notes, and prior deal plans.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review deal threads and internal escalation context.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Check customer and internal email history that explains the stall.
bestFor:
  - Deals that have stopped moving despite recent activity.
  - Sales teams separating a real customer blocker from internal process or
    follow-up gaps.
  - Escalation reviews that need a clear next customer-facing move and owner.
starterPrompt:
  title: Diagnose the stalled deal
  body: >-
    Diagnose why [deal or account] is stalled.


    Use the opportunity stage history, closed activities, call transcripts,
    email threads, deal threads, security, legal, or procurement notes, and
    account context I provide.


    Return:

    - the most likely blocker and supporting evidence

    - prior attempts and what changed

    - customer, technical, legal, or procurement dependencies

    - escalation path and owners

    - the next customer-facing move

    - missing context and risks


    Separate sourced facts from inference. Draft follow-up language only; do not
    send it or update CRM records.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Sales teams"
    url: https://openai.com/academy/codex-for-work/how-sales-teams-use-codex/
  - label: Turn meetings into follow-ups
    url: /codex/use-cases/zoom-meeting-follow-ups
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Trace the stall across the full deal history

The visible stage is rarely the whole blocker. Give ChatGPT stage history, closed activities, calls, emails, deal threads, security or procurement notes, and account context so it can distinguish customer, technical, legal, and internal process issues.




1. Define the deal, time window, and decision the diagnosis should support.
2. Attach stage history, activity, transcripts, email, threads, security or procurement notes, and account context.
3. Ask ChatGPT to build a timeline before naming a root cause.
4. Run the starter prompt and review evidence, prior attempts, dependencies, escalation path, and next move.
5. Have the deal owner approve any customer-facing follow-up before sending it.




Keep the diagnosis factual and time-bounded. If the blocker is uncertain, list the smallest customer or internal check that would distinguish the competing explanations.

## Turn diagnosis into a recovery plan

After the blocker is agreed, ask ChatGPT to create a narrow recovery plan with owners, dependencies, and a proof point for each step.



**Prompt:**

```text
Create a recovery plan for this stalled deal.

Include:

- confirmed blocker and supporting evidence
- one or two hypotheses still to test
- customer-facing next step
- internal dependency and owner
- escalation path
- target date and proof of progress
- follow-up language for review

Do not send the message, update CRM, or promise a date that the sources do not support.
```