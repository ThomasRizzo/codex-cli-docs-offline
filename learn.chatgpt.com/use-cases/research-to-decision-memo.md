---
name: Turn research into a decision memo
tagline: Combine evidence, tradeoffs, and open questions into one recommendation.
summary: Give ChatGPT research, planning documents, models, dashboards,
  stakeholder context, and unresolved questions, then ask it to separate
  evidence from interpretation and draft a sourced decision memo that is ready
  for leadership review.
skills:
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read approved recaps, planning docs, models, and source material.
  - token: notion
    url: https://github.com/openai/plugins/tree/main/plugins/notion
    description: Check decision history, research notes, and project context when
      they live in Notion.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review stakeholder debate, comments, and unresolved questions from
      approved channels or threads.
  - token: $spreadsheets
    description: Validate financial, KPI, or scenario inputs behind the recommendation.
  - token: $documents
    description: Produce a concise, editable decision memo and review-ready pre-read
      with source notes.
bestFor:
  - Decisions that combine internal evidence, external research, budget, and
    tradeoffs.
  - Planning or investment questions where the recommendation needs an explicit
    evidence trail and decision log.
  - Teams that want alternatives, owner confirmations, and unresolved risks
    visible before a leadership review.
starterPrompt:
  title: Draft a decision memo
  body: >-
    I'm deciding whether [team or company] should [decision].


    Use these sources:

    - prior recaps and research: [files or links]

    - planning docs, models, and dashboards: [files or links]

    - audience, account, or market context: [files or links]

    - stakeholder comments and meeting notes: [files, channels, or thread links]

    - budget guardrails: [files or links]

    - decision criteria: [criteria]


    If I ask for web research, keep external findings separate from internal
    evidence. Write a concise decision memo with a recommendation, supporting
    evidence, alternatives and tradeoffs, costs, risks, a decision log, open
    questions, owner confirmations, and source links.


    If the audience needs a pre-read, organize the memo and supporting analysis
    into a review-ready packet while keeping the memo as the source of truth.
    Flag assumptions and do not make the decision or share the output.
  suggestedModel: gpt-6-sol
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: "OpenAI Academy: Business operations teams"
    url: https://openai.com/academy/codex-for-work/how-business-operations-teams-use-codex/
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Define the decision before gathering evidence

Decision work becomes clearer when ChatGPT knows the choice, constraints, audience, decision date, and approval boundary. Attach internal context first, then identify any outside research that needs to be completed separately.




1. State the decision, decision maker, timing, and criteria.
2. Attach recaps, planning docs, models, dashboards, budget guardrails, stakeholder comments, and meeting notes.
3. Ask ChatGPT to inventory internal evidence, source gaps, unresolved debate, and requested web research.
4. Run the starter prompt and review the recommendation, alternatives, tradeoffs, risks, decision log, and missing information.
5. Verify each material claim and owner confirmation before the memo enters leadership review.




Keep internal evidence, external research, and interpretation in separate sections. If a cost, date, or market fact cannot be confirmed, leave it as an explicit open item. When the audience needs a longer pre-read, keep the decision memo as the source of truth and place supporting analysis in an appendix instead of hiding uncertainty in polished slides.

## Pressure-test the recommendation and review packet

Use a follow-up pass to challenge the preferred option, expose which assumptions would change the recommendation, and anticipate the questions decision makers will ask.



**Prompt:**

```text
Pressure-test the decision memo.

Show:

- the assumptions that drive the recommendation
- the strongest case for each alternative
- evidence that is internal versus external
- costs, risks, and missing information that could change the decision
- claims, numbers, and owner confirmations that still need review
- questions a skeptical decision maker is likely to ask
- the smallest additional analysis needed to reduce uncertainty

Keep the original memo unchanged, cite the relevant source for each finding, and mark every proposed revision for review.
```