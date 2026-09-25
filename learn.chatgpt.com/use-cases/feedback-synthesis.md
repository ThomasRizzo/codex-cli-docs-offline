---
name: Analyze product feedback across tools
tagline: Turn Slack threads, survey exports, and issue queues into clear themes
  and follow-ups.
summary: Give ChatGPT Work feedback from Slack, surveys, issue trackers,
  support, or research notes. It can group repeated problems into a reviewable
  Sheet or Doc with evidence, design implications, open questions, and clear
  follow-ups.
skills:
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Read approved feedback channels or thread links.
  - token: github
    url: https://github.com/openai/plugins/tree/main/plugins/github
    description: Read issues, PR comments, and discussion threads.
  - token: linear
    url: https://github.com/openai/plugins/tree/main/plugins/linear
    description: Read bug or feature queues.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read feedback docs, exports, and folders, then create a Google Doc
      or Sheet.
bestFor:
  - Teams reviewing feedback across Slack, surveys, issues, support, and
    research.
  - Product decisions that need clear themes, supporting evidence, and
    follow-ups.
starterPrompt:
  title: Analyze product feedback
  body: >-
    Analyze feedback on [feature or product area] from [time period] using
    @Slack, @GitHub, @Linear, and @Google Drive. Include any relevant support
    tickets, surveys, and research notes.


    Group the feedback into clear themes, show the supporting evidence, and tell
    me what needs attention.


    Put the findings in a Google Sheet or Doc I can review. Draft any
    follow-ups, but don't post or send them.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
  - label: Scheduled tasks
    url: /codex/automations
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Product feedback might live in Slack, survey exports, issue trackers, support records, or research notes. Give ChatGPT Work the sources, product area, and date range to review. It can group repeated problems into a Sheet or Doc the team can check before deciding what to do next.

Start this workflow in Work on the web or desktop with connected apps and cloud files. Attach a local export first, or use the desktop app, when the source lives on your computer.

## What to expect

Here is an example using a survey export, support records, a feedback thread, and research notes for a request-review queue. The first pass groups the repeated problems; the follow-up splits a broad theme into two clearer decisions.

The first pass found three repeated problems across a survey, support records, a feedback thread, and research notes:

- **Conflicts are hidden in the queue:** eight mentions across four sources. Show conflict status in the list and distinguish `Ready` from `Needs attention`.
- **Bulk approval can include blocked requests:** four mentions across four sources. Skip blocked requests by default or warn before approval.
- **Reviewers lose their place and can't isolate work:** ten mentions across four sources. Preserve search and filters and offer a `Needs attention` view.

After a follow-up to separate the last theme, the table distinguishes **search and filters resetting on return** from **blocked and unreviewed work being hard to isolate**. The table keeps the affected users, evidence IDs, confidence, design implications, open questions, and follow-ups with each theme. The counts are repeated mentions in a small sample, not product-wide incidence rates.




## How it works




1. Give Work the feedback sources, product area, and time period to review.
2. Ask it to group repeated feedback into themes and keep supporting links or IDs with each theme.
3. Create a Google Sheet or Doc with affected users, confidence, open questions, and the decision or follow-up needed.
4. Review the summary before turning any theme into a Slack update or issue draft.




Use the starter prompt on this page for the first pass, then refine any theme that is too broad, missing evidence, or mixing separate problems.

## Turn a reviewed theme into the next draft

Once the summary exists, ask Work to split a broad theme, add missing evidence, draft a Slack update, or turn a reviewed theme into an issue draft. Name the audience and decision so the next step is clear.



**Prompt:**

```text
Use the feedback summary to draft a short update for [team or channel]. Include the main themes, the evidence, and what we should do next. Don't post it.
```

## Keep a feedback channel current

For a Slack channel or issue queue that keeps getting new reports, ask Work to [check it on a schedule](https://developers.openai.com/codex/automations#schedule-work-from-a-task). Keep the same review boundaries so new feedback does not become an unapproved post, issue, or assignment.



**Prompt:**

```text
Check [feedback channel, issue tracker, or survey] every weekday. Tell me when a new theme appears, an existing issue gets worse, or we need to make a decision. Keep the feedback summary up to date, but don't post or send anything.
```