---
name: Prioritize accounts
tagline: Rank accounts by risk, upside, urgency, and next action.
summary: Give ChatGPT account records, customer conversations, usage signals,
  renewal or growth context, and review rules, then ask it to produce a ranked
  account brief with rationale, risks, next actions, source links, and follow-up
  drafts.
skills:
  - token: $spreadsheets
    description: Inspect account exports, score fields, and usage or pipeline signals.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read account plans, renewal notes, and approved customer context.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Find recent deal, renewal, or account context in approved threads.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Check customer email context when it is part of the review record.
bestFor:
  - Account managers and sales teams planning which accounts deserve attention
    first.
  - Renewal, expansion, or pipeline reviews that combine CRM, conversations,
    usage, and account plans.
  - Teams that want next actions grounded in sources rather than a score with no
    explanation.
starterPrompt:
  title: Rank my accounts for the week
  body: >-
    I'm planning my week for [renewal, growth, or pipeline] accounts.


    Use the account export, recent call transcripts, open customer email
    threads, usage dashboard, account plans, and the review rules I provide.
    Rank the [number] accounts I should focus on first.


    For each account, include:

    - why it matters now

    - the main risk or upside

    - the recommended next action

    - source links

    - stale or missing context


    Draft follow-up notes only where the next step is clear. Do not update CRM
    records or contact customers.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Bring the signals together

Account priority is more useful when it explains why an account matters now. Give ChatGPT the account list, recent conversations, usage or renewal signals, plans, and review rules, then ask for a ranked brief rather than an unexplained score.




1. Define the account segment, time window, and priority criteria.
2. Attach or name the CRM export, calls, emails, usage dashboard, plans, and review rules.
3. Run the starter prompt and ask for rationale, sources, stale context, and next actions per account.
4. Review any recommended customer follow-up before using it.
5. Hand approved actions to the system of record manually or through a separately reviewed workflow.




Keep risk, upside, urgency, and missing context visible as separate fields. This prevents a high-level ranking from hiding the evidence an account owner needs to make a judgment.

## Tune the priority list

Once the first ranking is useful, test how it changes under a different review rule, such as renewal date, expansion potential, activity gap, or customer risk.



**Prompt:**

```text
Re-rank the account list using [priority rule].

Compare it with the original ranking and show:

- accounts that moved the most
- the source signals behind each move
- accounts with stale or missing context
- actions that remain the same across both rankings
- follow-up drafts that still need owner review

Do not update CRM records or contact customers.
```