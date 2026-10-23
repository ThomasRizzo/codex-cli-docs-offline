---
name: Build an onboarding portal
tagline: Help new hires find their next task and practice the work they'll be doing.
summary: Turn your team's first-week plan into daily activities, resource links,
  and a practice task, with saved progress so each new hire can pick up where
  they left off.
bestFor:
  - Managers onboarding several people into the same role.
  - People teams maintaining first-week plans and resources for new hires.
starterPrompt:
  title: Build an onboarding portal
  body: >-
    Use @Sites to build an onboarding portal for [role or team] from our
    first-week plan. The end-of-week goal is [for example, draft a customer
    kickoff agenda].


    Sources:

    - First-week plan: [attached file or document link].

    - Product and team resources: [specific document or folder links].

    - Practice-task instructions and example: [links].

    - Contacts and their responsibilities: [supplied list].


    First confirm which sources you can read. List the tasks by day with their
    source links, instructions, and contacts. Ask about missing or conflicting
    details; don't invent tasks, people, or company policies.


    Build a welcome page, a day-by-day checklist, a resource list, helpful
    contacts, and the end-of-week practice task. For each task, show what to do,
    why it matters, what a completed task looks like, its resource link, and who
    can help. Include estimated times only where the plan provides them. Link
    the practice task to its instructions, approved example, and review
    criteria. Use the sequence in the supplied plan. Add a progress bar and a
    Continue where you left off section. Treat completion as a record of
    activities, not a score of job readiness.


    Require sign-in and save each person's task completion between visits. Keep
    progress private to that person and enforce record access on the server.
    Keep shared task content separate from individual progress. Give tasks
    stable identities so an instruction or link update doesn't erase completion
    records.


    Use a reviewed copy of the plan and links to original resources. Explain
    that source-document changes need a site update. Don't copy restricted
    resource contents into a page for a broader audience or write completion
    data back into source documents. If a source can't be read, ask for an
    accessible copy or link.


    Test a new user, partial progress, a completed plan, and a second account.
    Confirm that progress survives reload, remains private, and isn't reset by
    an instruction edit. Flag resource links that still need a new hire's access
    check. Keep the site private to our workspace. Show a saved preview, test
    results, and open questions before publishing.
  suggestedEffort: medium
relatedLinks:
  - label: Save records and progress
    url: /codex/sites/creating-a-site#save-records-and-progress
  - label: Add Sign in with ChatGPT
    url: /codex/sites/data-and-connections#add-sign-in-with-chatgpt
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Turn your first-week plan into a place where new hires can see what to do today, find the right resources, and pick up where they left off. Ask for a portal that brings daily tasks, helpful contacts, and an end-of-week practice task together, with progress saved for each person.

Choose a role and name something a new hire should be able to do by the end of the week. That goal helps you decide which resources and activities belong in the plan. Gather the materials your team already uses:

| Source          | Example                                                                       | What it contributes                  |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------ |
| First-week plan | A document or spreadsheet with day, task, instructions, resource, and contact | The daily checklist                  |
| Team resources  | A product overview, team directory, and role-specific templates               | Links and context for each task      |
| Practice task   | Instructions, review criteria, and an approved example                        | A clear goal for the end of the week |

Make tasks concrete enough that someone can tell when they're done. “Learn the product” could become “Read the product overview and bring two questions to your buddy meeting.” Include an estimated time if your plan provides one, and explain which activities need another person's help.

### Example: Preparing for a customer kickoff

In this hypothetical plan for a customer success manager, the week's activities build toward drafting a kickoff agenda:

- **Get oriented:** Read the product overview and meet a buddy to discuss questions.
- **See the work:** Watch an approved sample kickoff and note the questions the host asks.
- **Try the task:** Draft an agenda using the team's template, then discuss it with a manager.

For another role, substitute a relevant task, such as preparing a campaign brief or handling a sample support request. Use your approved plan to set the activities and sequence.

## Connect your sources




1. Attach the onboarding plan in the build conversation. For documents in a connected app, ask ChatGPT which connections are available, then give it the exact plan, resource, or folder links. Complete any connection step it requests.
   For example, point to “Customer success: first week” and “Kickoff agenda template” in Google Drive or SharePoint, if the relevant connection is available. Name the exact files instead of asking it to search all company documents.
2. Ask ChatGPT to list the tasks it found, grouped by day, with the source link and contact for each. Correct gaps before it builds the site. A document link identifies a source; confirm that ChatGPT can read it when you need its contents.
3. Use the plan as a reviewed copy in the site and keep links to original resources. A later edit to the source document won't automatically update that copy. To revise the plan, return to the build conversation with the updated source.
4. If resources should load from a connected app when someone visits, request that separately. Use a workspace-private site, and test with the new hire's own app permissions. Follow [data and connections](https://developers.openai.com/codex/sites/data-and-connections#build-a-site-with-connected-data) for the connection flow.




Open the resource links with a colleague who has the same access as a new hire. Fix inaccessible materials before sharing the site. Keep individual completion records in the site; they don't need to be written back into the onboarding document.

## How to use it




1. Put the next action first

   Use the starter prompt with your plan and resource links. Review the first day as someone who has just joined. They should know which task to start, why it matters, what to open, and who can help. Ask ChatGPT to replace vague task labels with actions from the plan and put the relevant resource beside each task.

2. Work toward the practice task

   Follow the week's activities through to the practice task. The new hire should be able to find the instructions, an approved example, and what their manager will look for. In the sample kickoff plan, that might mean checking that the agenda states the meeting's purpose, includes questions for the customer, and leaves time to agree on next steps.

   Mark an activity complete, reload, and return in another session to check that progress is saved. Use a second account to verify that it starts with its own progress and can't access the first person's record. A completed checklist records activities; use the practice task and conversation to understand where the person still needs help.

3. Welcome the next hire

   Review the audience and publish the site for your team. Include its link in your welcome message, and explain how the new hire can use it each day. Ask which instructions or resources were hard to follow during the end-of-week conversation. When the plan changes, ask ChatGPT to preserve completed tasks and explain how new or removed tasks affect progress before publishing the update.




## Take it further

### Refresh the plan from its source

Update the checklist when the onboarding plan changes, while preserving completed tasks and making changes to existing progress explicit.



**Prompt:**

```text
Read the updated onboarding plan at [document link or attached file]. Compare it with the site's current tasks and show additions, removals, and changed instructions. Keep existing task identities and saved completion records wherever the task is the same. Ask me how to handle removed or substantially changed tasks. Update only the reviewed plan and resource links, then show a preview before publishing.
```

### Put the next task first

Help each new hire resume their first unfinished task without hiding the rest of the week's plan.



**Prompt:**

```text
Add a Continue where you left off section showing the signed-in person's first unfinished task, its day, instructions, resource link, and contact. Keep the full week available. Show a completion message when all tasks are done. Test a new user, a partially completed plan, and a completed plan, and confirm that each person's saved progress remains private.
```