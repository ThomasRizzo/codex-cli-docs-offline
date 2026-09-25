---
name: Set up a project teammate
tagline: Keep one project moving with a dedicated, context-aware teammate.
summary: Give ChatGPT Work a dedicated task for one project or workstream. It
  can review relevant messages, documents, decisions, and deadlines; track
  meaningful changes on a schedule; prepare the next step; and wait for approval
  before taking action.
skills:
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Review the messages, decisions, and follow-ups relevant to the project.
  - token: teams
    url: https://github.com/openai/plugins/tree/main/plugins/teams
    description: Review Teams messages, project decisions, and open follow-ups.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Find project-related email, pending replies, and commitments.
  - token: outlook-email
    url: https://github.com/openai/plugins/tree/main/plugins/outlook-email
    description: Find project-related Outlook email and outstanding requests.
  - token: google-calendar
    url: https://github.com/openai/plugins/tree/main/plugins/google-calendar
    description: Check project milestones, meetings, and preparation.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Review the project brief, notes, plans, and decision history.
bestFor:
  - Launches, customer accounts, events, or initiatives with decisions spread
    across connected work tools.
  - Projects that need a dedicated task to track progress, blockers, owners, and
    next steps.
starterPrompt:
  title: Set up my project teammate
  body: >-
    Be my dedicated teammate for [project or workstream]. Focus only on that
    project. If the project isn't clear, ask me before reviewing unrelated work.


    Review the relevant messages, email, calendar events, documents, notes, and
    project trackers available to you. Establish what we're trying to
    accomplish, who's involved, what's already been decided, the current
    deadlines, and what's still open. Tell me when a source is missing instead
    of guessing.


    Start with a concise project brief:


    - the goal and current state;

    - important decisions, owners, and deadlines;

    - what's changed;

    - blockers, dependencies, and unanswered questions; and

    - the next step that would move the project forward.


    Link to your sources when available, check the latest replies before
    surfacing old requests, and distinguish confirmed facts from assumptions.
    Keep your context limited to this project.


    Help me research questions, prepare meetings, review drafts, and write
    follow-ups as the project progresses. If I ask you to check back on a
    schedule, watch for meaningful changes.


    Ask before sending messages, editing documents, scheduling work, sharing
    information, or making commitments.
  suggestedEffort: medium
relatedLinks:
  - label: Set up a work chief of staff
    url: /codex/use-cases/daily-work-brief
  - label: Scheduled tasks
    url: /codex/automations
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## What to expect

Give ChatGPT Work one project to focus on. A dedicated teammate can check the messages, documents, meetings, decisions, and open questions that affect that project, then help you decide what to do next. Add a scheduled check when you want it to keep watching the project.

Unlike a [work chief of staff](https://developers.openai.com/codex/use-cases/daily-work-brief), which watches across your priorities, a project teammate stays focused on a specific launch, customer account, initiative, or event.

Choose the surface that fits your project:

- **ChatGPT on the web:** Keep a teammate focused on connected project messages, documents, meetings, and trackers. A [scheduled check](https://developers.openai.com/codex/automations?surface=web) can keep watching those sources when your laptop is off.
- **ChatGPT desktop app:** Give a teammate access to local project files and apps. You can also ask your chief of staff to create, brief, and coordinate the teammate as a separate task. Keep your computer on and the app running if a [scheduled check](https://developers.openai.com/codex/automations?surface=app) needs local files or desktop tools.

Here's what a project check and follow-up can look like:

**Project status:** The customer-facing launch copy is approved, and the readiness review is on the calendar.

**Open questions:** The launch checklist is missing the documentation link, and security approval hasn't been confirmed.

**Next step:** Check on the final link and confirm whether the security review blocks launch.

**Draft follow-up:** “Hey, checking on the final docs link before the readiness review. Is it ready to add to the launch checklist, or is anything still blocking it?” The message remains unsent.

**Project heartbeat:** Check the launch thread, checklist, and readiness meeting every 30 minutes. Report meaningful changes without contacting anyone or updating the tracker.




## What you can use a teammate for

- **Run a launch.** Watch the project channel, launch checklist, approvals, assets, and release timing. Flag missing materials and decisions before they become blockers.
- **Produce a podcast or video.** Track scripts, recordings, review notes, sensitive footage, edit requests, and publishing deadlines.
- **Ship documentation or a website.** Track pull requests, review comments, preview deployments, product changes, and outstanding publication approvals.
- **Manage a customer project.** Keep the account conversation, meeting notes, commitments, open questions, and the next follow-up in one place.

## Set up your teammate




1. Choose the project, initiative, or customer account you want the teammate to focus on.
2. Connect or provide the messages, email, calendar, documents, and trackers relevant to that work.
3. Start a dedicated task using the starter prompt.
4. Review the initial project brief and correct any missing context.
5. Continue using the same task for decisions, research, meeting preparation, and draft follow-ups.
6. Add a heartbeat when you want the teammate to keep checking for project updates.




Keep the project task focused. ChatGPT should ask before sending messages, updating documents, changing a tracker, scheduling work, or making commitments.

## Start with your chief of staff

In the desktop app, you can ask your [work chief of staff](https://developers.openai.com/codex/use-cases/daily-work-brief) to create and brief the project teammate. That gives the new task the relevant context without turning your chief-of-staff thread into another project workspace.



**Prompt:**

```text
Create a separate teammate task for the project we just discussed. Brief it on the goal, relevant messages and documents, decisions, owners, deadlines, blockers, and open questions. Share only the context needed for that project. Tell me where to find the task, and don't send messages, change documents, or make commitments without my approval.
```

**Check on an existing teammate**



**Prompt:**

```text
Check on the existing project teammate we discussed. Tell me what changed, what's blocked, what it's waiting on, and what I need to review. Don't create a duplicate task or take action without my approval.
```

**Add a project heartbeat**



**Prompt:**

```text
Check this project's messages, documents, tracker, and upcoming meetings every 30 minutes. Tell me when an owner, deadline, approval, blocker, or decision changes. Stay quiet when nothing meaningful has changed. Don't repeat resolved items, send messages, or change project documents without my approval.
```

Connected sources and scheduled tasks depend on your plan and workspace settings. Project-task coordination is available in the desktop app.