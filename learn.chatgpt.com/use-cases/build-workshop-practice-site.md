---
name: Build a hackathon site
tagline: Give participants one place to find the agenda, register, and share
  what they built.
summary: Turn your event brief and agenda into a site that guides participants
  through registration and demo submission, then keeps their projects available
  in a gallery.
bestFor:
  - Organizers running a hackathon for their team or organization.
  - Participants registering a team and submitting a demo.
starterPrompt:
  title: Build a hackathon site
  body: >-
    Use @Sites to build a hackathon site for [hackathon name] using the event
    brief and agenda below. The participants belong to our workspace.


    Sources:

    - Event brief and organizer contact: [attached file or document link].

    - Agenda: [file or spreadsheet link and tab].

    - Event date and time zone: [date and time zone].

    - Team rules and submission requirements: [document link].

    - Submission deadline and late-submission rule: [confirmed details].

    - Project gallery visibility: [when submitted projects should appear and who
    can see them].

    - Judging criteria and participant resources: [links or none].


    First confirm which sources you can read and summarize the schedule,
    deadline, team rules, and required submission fields. Ask about gaps or
    conflicting times. Use only the supplied event details. Leave project choice
    to participants; don't suggest project ideas or example use cases.


    Build an event overview, agenda, participant instructions, resource list,
    and organizer contact section. Make it easy to find the next session, team
    registration, and project submission. Show the event date and time zone with
    the schedule and exact submission deadline. Keep the deadline and help
    contact near the submission form. Link to original resources and explain
    that this is a reviewed copy of the event information.


    Let participants register a team with its name and members, then return to
    add a project title, short description, and demo link. Distinguish saved
    drafts from submitted projects and explain any missing required fields. Show
    submitted projects in a gallery according to the supplied visibility rule.
    Require sign-in and enforce team membership on the server so members can
    edit only their own team's entry. Ask how membership should be confirmed
    before enabling team edits; don't use a typed name as proof of identity.
    Save registrations and submissions between visits.


    Keep event information, team registrations, and project records separate so
    agenda edits preserve submissions. Validate required fields and demo links.
    Follow the supplied deadline rule; ask if it is missing. Don't edit source
    documents or send invitations.


    Test with two fictional teams: register, submit, edit, reload, and try to
    edit the other team's entry directly. Check the deadline behavior and mobile
    layout. Identify and remove test records before the event. Keep the site
    private to our workspace and show a saved preview, test results, and
    unresolved questions before publishing.
  suggestedEffort: medium
relatedLinks:
  - label: Save registrations and submissions
    url: /codex/sites/creating-a-site#save-records-and-progress
  - label: Choose who can visit
    url: /codex/sites/publishing-and-sharing#choose-who-can-visit
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Give hackathon participants a link they can use before, during, and after the event. Build a site where they can find the schedule, register a team, submit a demo, and explore what others made. Organizers can use the same project gallery to run demos and share the results afterward.

Gather the information you would normally send participants:

| Source            | Example                                                                             | What it contributes                     |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| Event brief       | A document with event date, time zone, location, and organizer contact              | The event overview and help information |
| Agenda            | A spreadsheet with start time, end time, session, and location or meeting link      | The schedule                            |
| Participant guide | Team instructions, rules, judging criteria, submission deadline, and resource links | Instructions for joining and submitting |

Decide what participants need to submit and when projects should appear in the gallery. For example, you might collect a title, a short description of what the team built, and a demo link. Use the event's rules to decide whether entries appear immediately or when submissions close.

### Example: A one-day team hackathon

In this hypothetical event, participants meet at 9:00, form teams at 9:30, submit projects by 16:00, and begin demos at 16:30. All times use the event's stated time zone. A participant opens the site to find the morning meeting link, registers their team, then returns later to add the project description and demo. During presentations, the organizer opens each submitted project from the gallery.

Replace the sample times with your confirmed schedule. Participants choose what to build; the site gives them the information and steps they need to take part.

## Connect your sources




1. Attach the event brief and agenda in the build conversation. If they're in a connected app, ask ChatGPT which connections are available, then provide the exact document links and spreadsheet tab name. Complete any connection step it requests.
   For example, supply the “Team hackathon brief” document and “Agenda” spreadsheet tab from Google Drive or SharePoint, if the relevant connection is available. Use ordinary links for the meeting room and participant resources.
2. Ask ChatGPT to summarize the schedule, deadline, team rules, and required submission fields. Confirm the event date and time zone. Resolve conflicting deadlines before using the starter prompt.
3. Build from a reviewed copy of these details, with links to original resources. Keep team registrations and project submissions in the site so they remain available between visits. Changes to the source agenda need a separate site update unless you add a live connection.
4. If you need the agenda to load from a connected source, ask ChatGPT to verify that the connection can read it. Keep the site private to your workspace and test with a participant's own account. Follow [data and connections](https://developers.openai.com/codex/sites/data-and-connections#build-a-site-with-connected-data).




Check that participants can open meeting links, instructions, and demo links with their own accounts. You can start with attached files and ordinary resource links; a live connection isn't required for registration and submissions.

## How to use it




1. Confirm the event clock and instructions

   Use the starter prompt with your event materials. Open the preview and compare it with the approved brief. Check the date, time zone, session times, submission deadline, and links. A participant should be able to find where to go next, how to join, and what to submit without asking an organizer. Keep the deadline and help contact near the submission instructions.

2. Register a team and submit a demo

   Register a fictional test team, then return to add a project title, description, and demo link. Check the full path from registration to a submitted entry: can members tell what's saved, what's still missing, and whether their project has been submitted? Confirm that it appears in the gallery according to your event's visibility rule.

   Edit the entry and reload to confirm the changes were saved. Test with a second team account and confirm it can't edit the first team's entry, including through a direct link. Check what happens at the submission deadline and remove test entries before the event.

3. Use the site during and after the hackathon

   Review the audience and publish the site for your participants. Add the link to the event invitation and ask a colleague to find the agenda and submission instructions without your help. Before the event, use their feedback to clarify any confusing steps.

   During demos, use the gallery to open each project and see the team's description alongside its demo link. After the event, keep the gallery available to the intended audience so people can revisit projects they missed. Check demo links from a participant's account, and update event information without replacing the saved submissions.




## Take it further

### Update the agenda without losing submissions

Change session times or locations without overwriting registered teams, submitted projects, or their access rules.



**Prompt:**

```text
Read the revised agenda from [document link, spreadsheet tab, or attached file]. Show the differences in session times, locations, and the submission deadline before applying them. Keep team registrations, project submissions, and their access rules unchanged. Flag conflicting dates or missing time zones. After I confirm the changes, update the agenda and show a preview before publishing.
```

### Add a submission countdown

Make the deadline visible in the event's time zone and explain what happens when it passes.



**Prompt:**

```text
Add a countdown to the confirmed submission deadline on [date and time] in [event time zone]. Keep the exact date, time, and time zone visible beside it. Show a clear message after the deadline instead of negative time. Follow the event's agreed late-submission rule; don't change whether submissions are accepted without asking. Test before, at, and after the deadline.
```