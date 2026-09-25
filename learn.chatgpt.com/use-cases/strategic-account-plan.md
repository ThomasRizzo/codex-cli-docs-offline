---
name: Refresh a strategic account plan
tagline: Turn recent account activity into a current deal strategy pack.
summary: Give ChatGPT account and opportunity records, calls, threads, emails,
  usage notes, product needs, prior plans, and company context, then ask it to
  refresh the stakeholder map, discovery gaps, risks, value hypothesis,
  objections, proof points, and next actions.
skills:
  - token: $spreadsheets
    description: Inspect account and opportunity records, activity, usage signals, and gaps.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read prior account plans, customer docs, proof points, and company context.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review account threads, stakeholder context, and open risks.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Read recent customer or internal email context when it is in scope.
bestFor:
  - Strategic accounts with stale plans or several active stakeholders.
  - Deal teams that need discovery gaps, objections, risks, and proof points in
    one pack.
  - Account reviews where next actions should be grounded in recent customer
    signals.
starterPrompt:
  title: Refresh the account plan
  body: >-
    Refresh the strategic account plan for [account].


    Use CRM account and opportunity records or exports, recent call transcripts,
    account threads, email context, customer docs, usage notes, prior account
    plans, product needs, and relevant company context I provide.


    Create a deal strategy pack with:

    - stakeholder map

    - discovery gaps

    - risks and objections

    - value hypothesis

    - proof points

    - next-best actions


    Flag assumptions, stale information, and anything that needs account-owner
    or manager confirmation. Do not update CRM records or contact the customer.
  suggestedEffort: high
relatedLinks:
  - label: "OpenAI Academy: Sales teams"
    url: https://openai.com/academy/codex-for-work/how-sales-teams-use-codex/
  - label: Prioritize accounts
    url: /codex/use-cases/prioritize-accounts
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Refresh from recent customer signals

An account plan should reflect what the customer has said, done, and prioritized recently. Give ChatGPT the prior plan, account and opportunity data, recent calls, threads, emails, usage notes, product needs, and approved company context.




1. Define the account, planning horizon, opportunity, and team audience.
2. Attach the prior plan and the recent account, customer, product, and usage context.
3. Ask ChatGPT to identify stale information, discovery gaps, stakeholder changes, and open risks.
4. Run the starter prompt and review the value hypothesis, objections, proof points, and next actions.
5. Confirm the plan with the account owner before updating the CRM or sharing customer-facing content.




Keep customer evidence separate from internal assumptions. Mark proof points that are approved for customer use and keep internal risks out of a customer-facing draft.

## Make the plan actionable

Ask ChatGPT to map the next actions to evidence and owners so the plan does not become a static summary.



**Prompt:**

```text
Turn this account plan into a 30-day action map.

For each action, include:

- customer or internal owner
- source signal that justifies it
- desired outcome
- dependency or risk
- suggested date
- evidence that will show progress

Flag actions that need AE or manager approval. Do not update CRM records or contact the customer.
```