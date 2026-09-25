---
name: Prepare meeting briefs
tagline: Turn calendar context into an agenda and notes plan.
summary: Use ChatGPT with Calendar, Drive, Slack, and Gmail to gather approved
  sources before a meeting, then draft objectives, agenda, questions, and a
  notes template.
skills:
  - token: google-calendar
    url: https://github.com/openai/plugins/tree/main/plugins/google-calendar
    description: Find the meeting, attendees, timing, and attached material that
      should shape the brief.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read linked docs, interview notes, pre-reads, trackers, and source
      artifacts.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Pull the latest planning thread, decision context, or collaborator
      updates when the meeting depends on them.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Check related email threads for scheduling changes, attachments, or
      external context.
bestFor:
  - Meetings where context is split across calendar invites, docs, Slack
    threads, email, and notes.
  - Managers, product teams, operators, and interviewers who want a
    source-backed prep packet.
starterPrompt:
  title: Build the Prep Brief
  body: >-
    Help me prepare for [meeting] on [date].


    Use only these sources:

    - calendar event: [event name or date range]

    - docs or notes: [links or names]

    - Slack channels or threads: [optional]

    - Gmail thread or sender: [optional]


    First, inventory the sources you can access and name any source gaps.


    Return:

    - meeting objective

    - attendee context

    - key source-backed facts

    - likely agenda

    - open questions

    - decisions or follow-ups I may owe

    - suggested notes template for the meeting


    Keep unsupported claims in a separate source gaps section. Do not update
    docs, send messages, or share the brief until I approve it.
  suggestedEffort: low
relatedLinks:
  - label: Plugins
    url: /codex/plugins
  - label: Use ChatGPT with Google Calendar
    url: /codex/plugins
  - label: ChatGPT desktop app
    url: /codex/app
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Prepare from the sources you already have

Meeting context often lives outside the calendar invite. There may be a pre-read in Drive, a decision in Slack, an email thread, or notes from an earlier conversation.

Use ChatGPT to gather the approved sources and draft a short prep brief with the objective, agenda, open questions, and a notes template.

## Gather the right context




1. Name the meeting, date, or calendar event.
2. Point ChatGPT at the docs, notes, Slack threads, email threads, or folders it can use.
3. Ask ChatGPT to inventory the sources before writing the brief.
4. Have it separate confirmed context, source gaps, and open questions.
5. Ask for a notes template or scorecard if you need to capture decisions during the meeting.




For interview loops, ask ChatGPT to read the approved notes or question bank, then produce a structured scorecard. For recurring planning meetings, ask it to compare the last notes with the latest source updates so the agenda starts from what changed.

## Keep the brief scannable

Ask for the smallest output that will help. You should get something like this:



**Objective:** decide whether the launch plan has enough owner
    coverage for the next two weeks.
  

  

    **Context:** the pre-read has a draft owner map, but two
    follow-up items in Slack still need dates.
  

  

    **Questions:** who owns partner review, and what is the latest
    date for the public copy freeze?
  

  

    **Notes template:** decisions, owners, dates, risks, and
    follow-ups.



If the brief includes private or sensitive information, keep the output local to the chat and ask ChatGPT to flag anything that doesn't belong in a shared doc.



**Prompt:**

```text
Turn this prep brief into a live notes template.

Keep the source-backed context short, then add sections for:

- decisions
- owners and dates
- risks
- unanswered questions
- follow-ups I owe
- follow-ups other people own

Flag anything private that doesn't belong in a shared meeting doc.
```