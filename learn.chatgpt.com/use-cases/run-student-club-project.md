---
name: Run a student club project
tagline: Coordinate plans, owners, budgets, and follow-ups in one hub.
summary: Use ChatGPT with a project brief, shared folder, meeting notes, budget,
  member availability, campus requirements, and deadlines to create a milestone
  plan, owner tracker, communications drafts, and risk log.
skills:
  - token: google-drive
    description: Gather the project brief, notes, campus requirements, and shared materials.
  - token: $spreadsheets
    description: Track milestones, owners, budget, decisions, and risks.
bestFor:
  - Student clubs planning events, trips, campaigns, or team projects.
  - Projects whose files, decisions, owners, and deadlines are scattered.
  - Teams that want drafts and trackers without automatic assignment or sending.
starterPrompt:
  title: Create a Student Project Hub
  body: >-
    Create an operating hub for our [club, event, trip, or team project] using
    this shared folder, meeting notes, budget, member availability, campus
    requirements, and deadlines.


    Include:

    - an organized folder structure

    - milestone plan

    - owner tracker

    - budget sheet

    - next-meeting agenda

    - communications drafts

    - decision and risk log


    Flag unresolved decisions and wait for team approval before assigning
    owners, changing files, or sending anything.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Establish the project hub

Gather the project brief, current folder, meeting notes, budget, member availability, campus requirements, and deadlines. Identify the source of truth for dates, approvals, and spending rules.

Ask ChatGPT to inventory the current state before reorganizing files or assigning work.

## Plan the work

The operating hub should connect:

- milestones and deadlines
- proposed owners and dependencies
- budget categories and approvals
- decisions and unresolved questions
- risks and contingency actions
- meeting agendas and follow-ups
- communications drafts

Keep private planning notes separate from messages intended for members, partners, or attendees.

## Review with the team

Confirm owners, dates, and budget assumptions in a team meeting. ChatGPT can draft recommendations, but it should not assign people, send messages, or commit funds without approval.

After each meeting, add the notes and ask ChatGPT to update the hub with confirmed decisions. Preserve a decision log so changes remain understandable to future organizers.