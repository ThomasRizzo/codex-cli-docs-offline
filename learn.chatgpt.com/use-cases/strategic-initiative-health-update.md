---
name: Prepare an initiative health update
tagline: Turn recurring initiative context into a clear leadership readout.
summary: Give ChatGPT the tracker, initiative docs, KPI changes, prior briefs,
  owner notes, decision log, and stakeholder context, then ask it to summarize
  progress, deltas, blockers, risks, decisions, and stale items.
skills:
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read trackers, initiative docs, prior briefs, and decision logs.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review stakeholder discussion, blockers, and owner updates.
  - token: $spreadsheets
    description: Validate KPI changes and progress data.
  - token: $documents
    description: Draft a leadership update and a stakeholder-ready follow-up version.
bestFor:
  - Weekly or monthly updates for a strategic initiative.
  - Operating reviews that need progress, deltas, blockers, and decisions in one
    place.
  - Teams that want stale items and missing owner context called out explicitly.
starterPrompt:
  title: Prepare the initiative update
  body: >-
    Prepare the [weekly or monthly] strategic initiative update for
    [initiative].


    Use the project tracker, initiative docs, KPI changes, prior briefs, owner
    notes, decision log, stakeholder threads, and related context I provide.
    Draft:


    - progress and material deltas

    - risks and blockers

    - decisions needed

    - next actions and owners

    - stale items to chase


    Keep material claims grounded in the source context. Separate confirmed
    status from inference and do not edit the tracker.
  suggestedEffort: medium
relatedLinks:
  - label: "OpenAI Academy: Business operations teams"
    url: https://openai.com/academy/codex-for-work/how-business-operations-teams-use-codex/
  - label: Prepare meeting briefs
    url: /codex/use-cases/meeting-prep-briefs
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Make the operating cadence comparable

Recurring initiative updates work best when each version uses the same structure. Give ChatGPT the current tracker, prior brief, KPI changes, decision log, owner notes, and stakeholder context so it can make deltas and stale items easy to spot.




1. Define the reporting period, initiative, audience, and status vocabulary.
2. Attach the tracker, initiative documents, KPI changes, prior briefs, and decision log.
3. Ask ChatGPT to reconcile current status with owner and stakeholder context.
4. Run the starter prompt and review progress, risks, blockers, decisions, and next actions.
5. Check stale items and owners with the initiative lead before sharing the update.




Use a leadership version for decisions and a stakeholder version for follow-ups. Keep both tied to the same source record so differences in emphasis do not become differences in fact.

## Compare two reporting periods

Ask ChatGPT to produce a delta-only view for a faster operating review.



**Prompt:**

```text
Compare this initiative update with the previous period.

Return only:

- progress that changed
- new or worsening risks
- blockers that cleared or remain
- decisions added or resolved
- next actions with changed owners or dates
- stale items that still need follow-up

Keep claims source-backed and flag status that cannot be confirmed.
```