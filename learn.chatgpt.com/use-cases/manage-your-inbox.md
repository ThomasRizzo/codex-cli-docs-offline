---
name: Get your email to inbox zero
tagline: Clear the backlog, draft replies in your voice, and stay on top of new email.
summary: Clear an overloaded inbox and see which messages need a reply, a
  decision, or your attention. ChatGPT Work can suggest a cleanup, draft replies
  in your voice, and check for new email on a schedule.
skills:
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Search and triage Gmail threads, create reply drafts, and archive,
      label, or move messages to Trash when you explicitly ask.
  - token: outlook-email
    url: https://github.com/openai/plugins/tree/main/plugins/outlook-email
    description: Search and triage Outlook email, organize recurring messages,
      change read state or move messages when you explicitly ask, and draft
      replies using your connected mailbox.
bestFor:
  - Clear an overloaded email inbox without losing useful records.
  - Surface important mail and reply drafts on a schedule.
starterPrompt:
  title: Get your email to inbox zero
  body: >-
    Review my connected email from the last 90 days, including sent mail. If I
    have multiple accounts, review each separately. If none are connected,
    explain how to connect Gmail or Outlook Email from the Plugins tab in
    ChatGPT Work.


    Infer whether the inbox is work or personal and identify the people,
    projects, and recurring messages that matter. Use recent, human-written sent
    emails to understand how I write. Ignore forwarded or generated messages
    that aren't representative of my voice, and check other connected tools when
    they might provide useful context for a reply.


    Give me a concise, personalized update with natural headings:


    - Open with one or two sentences about what you learned from my inbox,
    including the total and unread counts.

    - List up to five emails that need attention. Keep each to one short,
    action-oriented bullet with relevant timing and a link. Avoid speculation,
    especially for security alerts.

    - In two or three sentences, explain what routine email you'd label and
    archive, what stays visible, and any subscriptions worth reviewing. Format
    proposed `labels` inline and clarify that archived email remains searchable.

    - Draft one useful reply in my voice, briefly explaining who it's for, what
    they need, and any relevant context you found.

    - Explain what you'll do going forward and that I can redirect you by
    replying here.

    - End with three simple, numbered yes/no questions: apply the cleanup, save
    the reply as a draft, or keep the proposed schedule and priorities. Show how
    to respond with a one-line example, such as “1 yes, 2 yes, 3 no,” and invite
    me to include any changes.


    Schedule checks at 8 AM and 4 PM on weekdays for work email, or 8 AM daily
    for personal email. Explain this in first person: “Going forward, I'll
    check…” Describe how you'll surface new or changed mail that needs
    attention, use other connected sources like messaging, documents, or
    calendar when relevant, and draft replies in my voice. Tell me I can
    redirect you by replying here. Keep each update concise, number any
    questions at the bottom, and briefly say so if nothing needs attention.


    Don't send, archive, or move anything to Trash without approval. Apply only
    approved cleanup actions and always ask separately before using Trash.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /docs/plugins
  - label: Scheduled tasks
    url: /docs/automations
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

You can run this in ChatGPT Work in the browser or desktop app. Before you start:

- **Connect your email.** Install the [Gmail or Outlook Email plugin](https://developers.openai.com/docs/plugins). You can also connect Slack, Google Drive, and your calendar to give ChatGPT more context when drafting replies.
- **Choose where scheduled checks run.** Start in the browser if you want checks to continue when your laptop is off. On desktop, keep your computer on and the ChatGPT desktop app running. Voice chats don't support [scheduled tasks](https://developers.openai.com/docs/automations), so set up or manage them in chat instead.

## What to expect

ChatGPT reviews recent mail, identifies messages that need attention, proposes a cleanup, and prepares replies without sending them. Once you approve the cleanup, it can apply those changes to the older backlog. Here is what that conversation can look like:

I reviewed your connected work inbox, centered on product launches, documentation, and production work. It has **116 messages, 96 unread**; most unread mail is project activity, calendar updates, shared-file notifications, and newsletters.

### What needs attention

- **Recording prep:** send the requested demo topics, short bio, and photo before tomorrow's session.
- **Documentation review:** address the product-accuracy feedback before the guide moves forward.
- **Failed preview deployment:** investigate the failed build before relying on the current changes.
- **Benefits task:** complete the outstanding benefits change.
- **Sign-in alert:** confirm whether the recent login was yours and follow the alert instructions if it wasn't.

### Cleanup

I'd label and archive routine project, calendar, and document notifications under `Project activity`, `Calendar`, and `Docs`; archived mail remains searchable. Direct requests, active reviews, failed builds, security alerts, and anything unresolved would stay visible. Newsletters and other recurring subscriptions are worth reviewing separately.

### A reply to the recording organizer

The recording organizer is waiting on demo topics, a short bio, and a photo. I checked the latest scheduling context and drafted a response in your voice:

> Excited for this. I'm planning to show the three workflows we discussed and will send the bio and photo today. I saw the updated calendar invite, so I'll plan around the new time.

Going forward, I'll check at **8 AM and 4 PM on weekdays**. I'll surface new or changed email that needs your attention, check connected sources like messaging, documents, or your calendar when relevant, and prepare replies in your voice. You can redirect me anytime by replying here.

### What would you like me to do?

1. **Apply the cleanup?** Yes / no. Routine messages will be labeled and archived, not deleted.
2. **Save the reply as a draft?** Yes / no.
3. **Keep the proposed schedule and priorities?** Yes / no.

Reply with “1 yes, 2 yes, 3 no” and include any changes.




**Warning:** The Gmail plugin can move email to Trash when you explicitly ask. Review the proposed groups and a few sample messages first, and archive anything you're unsure about instead of deleting it. Available actions can vary by email plugin and workspace settings.

## How it works

An email workflow has a few parts:

- **Connected context:** plugins let ChatGPT read your email and check other connected tools when a reply needs more context. Slack may have the latest conversation or decision, Google Drive may have relevant files or project docs, and your calendar can clarify dates or meetings.
- **Priorities:** you can tell ChatGPT which people, requests, alerts, and recurring messages to prioritize or ignore. Future checks can use those instructions.
- **Approval boundaries:** ChatGPT proposes cleanup and drafts replies, but waits for your approval before taking action.
- **Scheduled tasks:** instead of waiting for you to come back and ask again, ChatGPT can check for new messages in the same task on a schedule.

## Build your own email workflow

You can be more specific when you already know what you want. A **work-email**
prompt might emphasize active conversations, requests, approvals, and project
context:



**Prompt:**

```text
Start by reviewing my connected work email account. If you can't access my email, tell me how to connect Gmail or Outlook Email from the Plugins tab in ChatGPT Work.

Review the last 90 days. Keep direct human emails, active conversations, requests, deadlines, approvals, security alerts, HR tasks, and renewals visible. Group recurring project updates, calendar changes, meeting notes, and system notifications so they're easy to find but don't crowd the inbox. Surface newsletters, promotions, and expired reminders for review.

Use recent, human-written sent emails to understand my voice when drafting replies. Check other connected messaging, calendar, or work-context plugins when they might contain relevant information.

Give me a concise, personalized update: briefly describe the inbox and unread count; list up to five emails that need attention, with timing and links; explain in two or three sentences how you'd clean up routine mail while keeping important email visible; and draft one useful reply with enough context to understand who it's for and what they need. End with numbered yes/no questions for cleanup, saving the reply as a draft, and keeping the schedule and priorities, plus a one-line example response.

Going forward, check my inbox at 8 AM and 4 PM on weekdays. Surface new or changed email that needs my attention, use other connected sources when relevant, and draft useful replies in my voice. Keep each update concise and put any questions at the bottom.

Wait for approval before sending, archiving, or moving anything to Trash, and tell me I can change the schedule, priorities, or reply behavior anytime.
```

A **personal-email** prompt might instead emphasize people you know, bills,
packages, travel, appointments, and account alerts:



**Prompt:**

```text
Start by reviewing my connected personal email account. If you can't access my email, tell me how to connect Gmail or Outlook Email from the Plugins tab in ChatGPT Work.

Review the last 90 days. Keep messages from people I know, bills, renewals, receipts, packages and delivery updates, travel and reservations, appointments, security alerts, and anything time-sensitive visible. Group useful records like order confirmations and account activity so they're easy to find. Surface newsletters, promotions, expired reminders, and recurring subscriptions for review.

Use recent, human-written sent emails to understand my voice when drafting replies. Check my connected calendar or other available context when it might help with a response.

Give me a concise, personalized update: briefly describe the inbox and unread count; list up to five emails that need attention, with timing and links; explain in two or three sentences how you'd clean up routine mail while keeping important email visible; and draft one useful reply with enough context to understand who it's for and what they need. End with numbered yes/no questions for cleanup, saving the reply as a draft, and keeping the schedule and priorities, plus a one-line example response.

Going forward, check my inbox once each day at 8 AM. Surface new or changed email that needs my attention, use other connected sources when relevant, and draft useful replies in my voice. Keep each update concise and put any questions at the bottom.

Wait for approval before sending, archiving, or moving anything to Trash, and tell me I can change the schedule, priorities, or reply behavior anytime.
```

Both examples follow the same basic structure: what to check, what matters, what to do, when to do it, and what requires approval.

## Take it further

Once the basic workflow is running, you can refine it or ask ChatGPT to handle other useful email tasks.

**Always check the right context**



**Prompt:**

```text
Whenever an email is from [people or teams] or about [project or topic], check [connected source, channel, folder, or doc] before summarizing it or drafting a reply. Call out anything that changes the response.
```

**Draft a recurring update**



**Prompt:**

```text
Every Friday at 3 PM, draft an email to [people or team] with an update on [project or topic]. Use [connected sources, channels, docs, or files] to summarize progress, decisions, risks, and next steps. Keep it concise and ask me to review before sending.
```

**Follow up on unanswered email**



**Prompt:**

```text
Flag active email threads where I'm waiting on a response and no one has replied in [number] days. Draft a short follow-up using the latest available context, but don't send it without my approval.
```

**Change the format**



**Prompt:**

```text
Organize future inbox checks into “needs a reply,” “waiting on someone,” and “can ignore.” Put anything time-sensitive first.
```

**Teach it what matters**



**Prompt:**

```text
Always surface messages from [people, teams, or senders] and anything about [projects or topics]. Treat [recurring notifications] as low priority.
```

**Adjust how it drafts replies**



**Prompt:**

```text
Keep reply drafts short and direct. Match how I normally write, use the latest context from my connected plugins, and ask me when you’re missing context.
```

**Change when it checks**



**Prompt:**

```text
Check my inbox at 8 AM and 4 PM on weekdays. Only flag messages that need attention before the next check.
```

Keep cleanup and reply actions approval-based until you trust the rules.

Gmail and Outlook actions and scheduled tasks depend on your plan and workspace settings.