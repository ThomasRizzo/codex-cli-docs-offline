---
name: Review forecast risk
tagline: Decide which deals belong in commit, upside, or pull.
summary: Give ChatGPT forecast snapshots, opportunity records, call notes, deal
  threads, email context, support or legal status, usage signals, and owner
  notes, then ask it to produce a sourced forecast risk review with deal-by-deal
  rationale.
skills:
  - token: $spreadsheets
    description: Compare forecast snapshots, opportunity data, activity, and
      deal-level metrics.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read forecast files, account plans, and approved deal context.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review deal threads, support context, and current blockers.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Check customer or internal email context that affects forecast position.
bestFor:
  - Sales leaders preparing a weekly or monthly forecast call.
  - Deal reviews where commit position depends on customer urgency, blockers,
    and close path.
  - Teams that need sourced facts separated from inferred risk and owner
    follow-ups.
starterPrompt:
  title: Review the forecast
  body: >-
    Review [accounts or deals] for the [forecast period] forecast call.


    Use the CRM opportunity export, forecast snapshots, call notes, email
    threads, Slack deal context, support escalations, legal or procurement
    status, usage signals, and owner notes I provide.


    Recommend what should stay in commit, move to upside, or get pulled.
    Separate sourced facts from inferred risk, explain the rationale by deal,
    list blockers and missing context, and end with owner follow-ups. Do not
    update CRM records or change the forecast.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Sales teams"
    url: https://openai.com/academy/codex-for-work/how-sales-teams-use-codex/
  - label: Prioritize accounts
    url: /codex/use-cases/prioritize-accounts
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Review the forecast from the deal record outward

Forecast risk is easier to assess when the forecast position is checked against opportunity details, recent customer activity, blockers, and the close path. Give ChatGPT the full review record and require a rationale for every recommendation.




1. Define the forecast period, teams or deals in scope, and commit vocabulary.
2. Attach the CRM export, forecast snapshots, calls, emails, deal threads, support, legal, procurement, usage, and owner notes.
3. Ask ChatGPT to separate sourced facts from inferred risk.
4. Run the starter prompt and inspect each deal's rationale, blocker, and next owner action.
5. Confirm recommendations with the sales owner before changing the forecast system.




Do not infer confidence from stage alone. A useful review shows the evidence, missing context, customer urgency, and close-path risk behind each commit, upside, or pull recommendation.

## Prepare for the forecast call

Use a follow-up pass to turn the review into a short call agenda with the fewest questions needed to resolve uncertainty.



**Prompt:**

```text
Turn this forecast review into a call agenda.

Group deals by:

- commit risk
- missing evidence
- customer or legal blocker
- decision needed from leadership
- owner follow-up

For each deal, write the one question that would most reduce uncertainty. Do not change the forecast or send the agenda.
```