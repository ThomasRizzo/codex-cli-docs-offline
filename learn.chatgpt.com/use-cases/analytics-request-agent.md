---
name: Scope an analytics request
tagline: Turn an ambiguous stakeholder ask into a validated analysis plan.
summary: Give ChatGPT the stakeholder request, business context, metric
  glossary, source exports, dashboard links, and request threads, then ask it to
  scope the question, identify missing inputs, run a first pass, and prepare a
  reviewable answer.
skills:
  - token: $spreadsheets
    description: Inspect source exports, test joins, and run the first-pass calculations.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Find metric glossaries, dashboards, source files, and prior analysis.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Read the original request and surrounding stakeholder context.
  - token: $documents
    description: Turn the scoped analysis into a stakeholder-ready answer with review notes.
bestFor:
  - Analytics requests that arrive as broad questions without clear metric
    definitions or scope.
  - Analysts who need to identify source gaps before committing to an answer.
  - Stakeholder-ready analysis that should include charts, validation notes, and
    open questions.
starterPrompt:
  title: Scope this analytics request
  body: >-
    Turn this request into a scoped analysis: [paste request or link to source
    context].


    Identify the business question, required metric definitions, source exports,
    relevant dashboards, and recent product or business context. Draft an
    analysis plan, run a first-pass analysis using the available data, validate
    the outputs, and prepare a stakeholder-ready answer with charts, caveats,
    source links, and open questions for analyst review.


    Do not assume metric definitions, join logic, or missing values. List every
    input or decision you need confirmed before the analysis is final.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Data science teams"
    url: https://openai.com/academy/codex-for-work/how-data-science-teams-use-codex/
  - label: Query tabular data
    url: /codex/use-cases/analyze-data-export
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Turn the ask into an analysis contract

Stakeholder requests often mix the business question, a preferred chart, and an assumed metric definition. Give ChatGPT the original request and surrounding context, then ask it to identify the question, definitions, sources, joins, and decisions before it analyzes.




1. Attach the request thread, metric glossary, dashboards, exports, and relevant context.
2. Ask ChatGPT to list what is known, ambiguous, missing, or out of scope.
3. Confirm the metric definitions, join logic, time window, and intended audience.
4. Run the starter prompt for a first-pass analysis and stakeholder-ready answer.
5. Have an analyst review the calculations, charts, caveats, and open questions.




Do not let a confident answer hide an undefined metric or unverified join. The analysis plan is part of the deliverable because it makes the next iteration faster to review.

## Close the loop with the requester

After the analysis is reviewed, ask ChatGPT to turn the open questions into a short confirmation note without sending it.



**Prompt:**

```text
Turn the open questions into a requester review note.

Include:

- the business question I answered
- definitions and filters used
- source files and joins
- the main result and caveats
- questions that need confirmation
- the next analysis I can run after confirmation

Keep unsupported claims out and return a draft only.
```