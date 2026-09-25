---
name: Set up a work chief of staff
tagline: Stay on top of your priorities, meetings, messages, and commitments.
summary: Set up ChatGPT Work as a chief of staff that checks your connected
  messages, email, calendar, documents, and project trackers every hour, keeps
  track of what changes, and prepares concise updates and draft replies. On
  desktop, ask it to create or coordinate a separate task for a specific
  project.
skills:
  - token: google-calendar
    url: https://github.com/openai/plugins/tree/main/plugins/google-calendar
    description: Review the day's meetings, timing, and preparation needs.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Find Gmail messages that need a reply or change your priorities.
  - token: outlook-email
    url: https://github.com/openai/plugins/tree/main/plugins/outlook-email
    description: Find Outlook messages that need a reply or change your priorities.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Find direct messages, mentions, decisions, and follow-ups that need
      attention.
  - token: teams
    url: https://github.com/openai/plugins/tree/main/plugins/teams
    description: Find Teams messages, decisions, and follow-ups that need attention.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read the approved running notes, trackers, or planning docs behind
      the day's work.
bestFor:
  - People managing priorities and commitments across messages, email,
    calendars, documents, and project trackers.
  - Workdays with meetings to prepare for, decisions to make, and follow-ups to
    track.
starterPrompt:
  title: Set up my work chief of staff
  body: >-
    Be my chief of staff.


    Start by checking the work tools and sources available to you, such as Slack
    or Teams, Gmail or Outlook, my calendar, documents, notes, and project
    trackers. Figure out what I'm working on, who I work with, what I've
    committed to, and what needs my attention.


    Give me a concise update covering:


    - what changed and what needs a decision;

    - approaching deadlines, meetings, and commitments;

    - messages that need a response;

    - what is blocked or waiting on someone; and

    - what can wait.


    Link to the original sources when possible, check the latest replies before
    resurfacing an older request, and tell me if an important source is
    unavailable. Separate confirmed facts from assumptions and don't repeat
    items that have already been resolved.


    Suggest next steps, draft replies, and prepare meeting briefs when useful.
    In the desktop app, when I ask you to delegate a project, create or continue
    a separate project task and share only the context it needs.


    Set up an hourly check if scheduled tasks are available. Review the
    connected sources, compare what you find with prior updates, and interrupt
    me only when a priority, deadline, blocker, decision, or message
    meaningfully changes. Stay quiet when there's nothing new. If you can't
    create the schedule, tell me instead of implying that it's active.


    Apart from the hourly check I just requested, ask before creating a new
    project task, sending anything, editing documents, changing a schedule, or
    making commitments.


    Start by telling me what I should know today.
  suggestedModel: gpt-6-luna
  suggestedEffort: xhigh
relatedLinks:
  - label: Set up a project teammate
    url: /codex/use-cases/project-teammate
  - label: Scheduled tasks
    url: /codex/automations
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## What to expect

Give ChatGPT Work ongoing responsibility for staying on top of your work. In one thread, it can check the work tools you've connected every hour, bring together your priorities, prepare you for meetings, and flag messages, decisions, or commitments that need your attention. In the desktop app, it can also help you start or coordinate a separate task for a project when you ask.

Use the sources that apply to your work, such as Slack or Teams, Gmail or Outlook, your calendar, documents, and project trackers. ChatGPT should tell you if it can't access a source rather than guess what's in it.

Choose the surface that fits how you want your chief of staff to work:

- **ChatGPT on the web:** Use connected work tools and an hourly [scheduled check](https://developers.openai.com/codex/automations?surface=web) that can continue when your laptop is off. This is a good default when you want updates wherever you are.
- **ChatGPT desktop app:** Use the same connected sources alongside local files and apps. Your chief of staff can also create, brief, and coordinate separate project teammates when you ask. Keep your computer on and the app running if a [scheduled check](https://developers.openai.com/codex/automations?surface=app) needs local files or desktop tools.

Here's what an initial check and follow-up can look like:

**Top priorities**

- Confirm the launch docs link with Priya before 9:15 AM for the 9:30 AM readiness review.
- Prepare an accurate customer update, respond to Finance, and review the weekly update.

**What changed:** Launch copy is approved, the missing docs link is the current blocker, and the earlier team-social request is resolved.

**Draft reply:** “Copy is approved. I'm checking the docs link now and will confirm it before the readiness review.” The reply stays unsent until you approve it.

**Catch-up prompt:** I'm back after time away. Catch me up on work by checking my available messages, email, calendar, documents, and project trackers. Show me what changed, include source links, and don't send or change anything.




## Make it your own




1. Start a thread using the starter prompt.
2. Connect the messaging, email, calendar, and document sources relevant to your work.
3. Review the first update and point out anything important, resolved, or missing.
4. Keep using the same thread for follow-ups, meeting preparation, and draft replies.
5. On desktop, ask it to create or continue a separate task when a project needs its own teammate.
6. Review the hourly heartbeat and adjust its schedule when needed.




The starter prompt authorizes an hourly check. ChatGPT should ask before creating another task, sending messages, updating documents, changing the schedule, or making commitments.

**Adjust the hourly heartbeat**



**Prompt:**

```text
Check my connected work sources every hour. Tell me only about meaningful changes, approaching deadlines, decisions, blockers, or messages that need my attention. Don't repeat resolved items. Apart from this hourly check, keep everything read-only unless I approve a specific action.
```

**Catch up after time away**



**Prompt:**

```text
Catch me up on what changed while I was away. Review my available messages, email, calendar, documents, and project trackers. Show me decisions, deadlines, blockers, and messages that need a reply. Link to the original sources and tell me if anything is missing. Don't send or change anything.
```

**Start a project teammate on desktop**

When one project needs its own focused working space, ask your chief of staff to [set up a project teammate](https://developers.openai.com/codex/use-cases/project-teammate) and share the relevant context.



**Prompt:**

```text
Create a separate teammate task for [project]. Brief it on what we're trying to accomplish, the relevant messages, documents, decisions, and open questions. Give it only the context it needs, keep its work separate from other projects, and tell me where to find it. Ask before sending messages, editing documents, or making commitments.
```

**Continue an existing project teammate**



**Prompt:**

```text
Check on my existing [project] teammate. Give it this follow-up: [what you need]. Then tell me what changed, what's blocked, and what needs my review. Don't create a duplicate task, contact anyone, or change anything without my approval.
```

**Prepare the next step**



**Prompt:**

```text
Use the latest context in this thread to draft the reply, handoff, or meeting brief I need next. Keep it concise, show the sources behind your recommendation, and don't send or share anything without my approval.
```

Connected sources and scheduled tasks depend on your plan and workspace settings. Set up scheduled tasks in chat rather than in a voice conversation.