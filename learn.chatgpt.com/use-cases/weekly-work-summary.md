---
name: Write a weekly work summary
tagline: Turn a week of activity into a manager-ready update.
summary: Give ChatGPT your calendar, edited documents, sent messages, tracker,
  and project context, then ask it to summarize completed work, decisions,
  changes, blockers, follow-ups, and next priorities with source links.
skills:
  - token: google-calendar
    url: https://github.com/openai/plugins/tree/main/plugins/google-calendar
    description: Reconstruct the meetings and milestones that shaped the week.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review sent messages, decisions, blockers, and follow-ups in the
      relevant work channels.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read the tracker, project docs, and files that show what changed.
  - token: $documents
    description: Turn the source review into a clear, editable weekly update.
bestFor:
  - Managers and individual contributors writing a recurring weekly update.
  - Teams that need to reconstruct progress from several work surfaces.
  - Updates that should distinguish confirmed facts from inference and include
    source links.
starterPrompt:
  title: Draft my weekly update
  body: >-
    I'm writing my weekly update for [week or date range].


    Use my calendar, documents I edited, messages I sent in [channels], [main
    tracker or planning doc], and any other context that is clearly relevant.
    Write a manager-ready summary covering:


    - work completed

    - decisions made

    - important changes

    - blockers

    - follow-ups

    - next week's priorities


    Include source links where possible. Separate confirmed facts from
    inferences, and do not send or publish the update.
  suggestedEffort: low
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Reconstruct the week from source activity

A useful weekly update should not depend on remembering every meeting or message. Point ChatGPT to the tracker, documents, calendar, and work-channel messages that represent the week, then ask it to separate completed work from plans or assumptions.




1. Define the week and the audience for the update.
2. Name the tracker, documents, calendar, and channels that are in scope.
3. Run the starter prompt and ask for source links behind important claims.
4. Check decisions, blockers, and follow-ups against the underlying threads.
5. Revise the length and tone for the destination without publishing it automatically.




Keep inferences visibly separate from confirmed work. This makes it easier for a manager or collaborator to correct the update without rereading every source.

## Prepare the next update

Once the first summary is accurate, ask ChatGPT to reuse its structure for the next reporting period and call out what changed since the prior version.



**Prompt:**

```text
Use the same structure for the next weekly update.

Compare it with the previous update and identify:

- work newly completed
- decisions that changed
- blockers that remain
- follow-ups that moved owners or dates
- next priorities that are supported by current source context

Keep source links and separate confirmed facts from inferences. Return a draft only.
```