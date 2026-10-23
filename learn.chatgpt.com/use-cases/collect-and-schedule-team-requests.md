---
name: Manage creative requests from brief to delivery
tagline: Collect complete briefs, review drafts, and keep final assets with each
  request.
summary: Turn your creative brief template into a request app where colleagues
  submit work, designers manage the queue, and reviewers give feedback on
  drafts.
bestFor:
  - Small creative teams receiving design requests through scattered messages.
  - Marketing teams coordinating campaign assets and review deadlines.
starterPrompt:
  title: Manage creative requests from brief to delivery
  body: >-
    Use @Sites to build a creative request app for [team] using our brief
    template.


    Sources:

    - Brief template: [attached file or document link].

    - Brand guidelines and approved assets: [document or folder links].

    - Existing requests, if any: [spreadsheet or none].

    - Creative-team members and reviewers: [supplied list].


    First confirm which sources you can read and summarize the required fields.
    Ask about missing owners, unclear dates, or unavailable sources. Use the
    supplied materials; don't invent brand rules or real requests.


    Build an intake form for title, audience, key message, format or dimensions,
    requested date, reviewer, and copy or reference links. Adapt the fields to
    [request types, such as event graphics or presentations]. Show field
    examples and explain how to fix missing or invalid entries. Keep the
    requested date separate from the delivery date agreed by the creative team.


    Give each request a detail page with its brief, requester, owner, reviewer,
    agreed date, status, draft link, feedback, and final asset link. Use New, In
    progress, In review, and Delivered. Make the latest draft and delivered
    asset easy to distinguish. Add a queue with owner, status, and
    agreed-delivery-date filters. Make unassigned requests and missing agreed
    dates visible.


    Require sign-in. Let requesters create and read their own requests and add
    feedback. Let only the named creative team manage all requests, assignment,
    and delivery status. Enforce access on the server, including direct record
    access. Save records and feedback between visits.


    Start with a reviewed copy of supplied request data and links to original
    assets. Explain which content is copied and which remains linked. Don't
    imply that source files stay synchronized, and don't modify connected
    documents or task trackers.


    Use labeled fictional requests for testing. Test required fields,
    submission, status changes, saved feedback after reload, and two requesters
    with different access. Check the layout on mobile. Keep the site private to
    our workspace and show a saved preview, test results, and any unresolved
    questions before publishing.
  suggestedEffort: medium
relatedLinks:
  - label: Data and connections
    url: /codex/sites/data-and-connections
  - label: Publish and share
    url: /codex/sites/publishing-and-sharing
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Give colleagues one place to request creative work and follow it through review and delivery. A request app can collect the details a designer needs, show who owns the work, and keep feedback beside the latest draft. The requester can check progress without searching through messages; the creative team can see what needs attention across its queue.

Choose a recurring request, such as an event graphic, presentation, or campaign asset. Gather the material you already use:

| Source               | Example                                                                   | What it contributes                                                  |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Request brief        | A form or document with audience, message, dimensions, and requested date | Required fields and helpful examples                                 |
| Brand guidelines     | An approved document in your team's shared drive                          | Design guidance and links to approved assets                         |
| Current request list | A spreadsheet with request, owner, reviewer, status, and delivery date    | Starting records, if you want to bring existing work into the portal |

Decide who submits requests, who assigns the work, and who approves the result. Include those roles in your prompt so the app reflects how your team works. Keep a requested date separate from the delivery date the creative team agrees to.

### Example: A webinar graphic

In this hypothetical example, a marketer needs a 1200 × 628 graphic for a webinar aimed at operations leaders. The brief includes the approved headline, registration link, reviewer, and requested delivery date. A designer accepts the request, agrees on a date, and adds a draft. The reviewer leaves feedback on that request, and the designer adds the final asset when it's ready.

You can use the same flow for another deliverable. Change the form fields to match the work: a presentation might need a slide count and speaker notes, while a print asset might need print dimensions and a production deadline.

## Connect your sources




1. Attach the brief template and a small request export to the build conversation. To use a document from a connected app, ask ChatGPT which connections are available, then name the app and provide the exact document title or link. Complete any connection step ChatGPT requests.
   For example, if Google Drive is available, provide the link to your “Brand guidelines” document and “Approved assets” folder, and ask which materials it can read.
2. Ask ChatGPT to identify the required fields, summarize the brand guidance, and show how spreadsheet columns map to request records. Resolve missing owners or unclear dates before importing records.
3. Save briefs, status updates, and feedback in the app. Link to original copy, drafts, and finished assets. Copying a spreadsheet into the site doesn't keep it synchronized with the original.
4. If you want visitors to retrieve current brand resources, ask for a supported read connection to the approved folder or documents. Keep the site private to your workspace and test with a teammate's own account and permissions. See [data and connections](https://developers.openai.com/codex/sites/data-and-connections#build-a-site-with-connected-data).




If a connection isn't available, attach the brief template and any request export, and link to the original assets. Check that the intended reviewers can open the linked files. The app's request status and a task in another app are separate records unless you add an integration.

## How to use it




1. Submit a brief a designer can use

   Use the starter prompt with your sources, then submit a fictional request. Read the resulting brief as the person doing the work: can you tell who the asset is for, what it should communicate, which copy is approved, and who will review it? If a field is too vague, ask ChatGPT for a more specific question or an example beneath it.

   Try leaving a required field blank. Check that the form explains what is missing, retains the other entries, and creates only one request when submitted.

2. Review the draft and deliver the asset

   Assign an owner and agree on a delivery date. Add a draft link, move the request to In review, and leave feedback as the requester. For the sample graphic, feedback might be: “Keep the headline and image. Make the event date easier to read at the size used in an email.” Specific feedback gives the designer a clear next action.

   Add the final asset link and mark the request Delivered. Reopen it to check that the brief, feedback, and updates remain. Someone returning later should be able to distinguish the delivered asset from an earlier draft.

3. Share the queue with the right people

   Filter the queue by owner, status, and agreed delivery date. Use it to see which work is due next and which requests need a reviewer’s response. An unassigned request or a missing agreed date should be visible so the team can resolve it.

   Test with separate requester and creative-team accounts. A requester should see their own requests; the creative team should manage the queue. Confirm that another requester can't read or change a request by opening its URL directly. Review the site's audience, then publish it for your team. Adjust the form when the same missing detail keeps coming up.




## Take it further

### Load brand resources from a connected app

Use a supported connection to show brand guidelines each visitor can access, with links to the original documents.



**Prompt:**

```text
Check which of my connected apps can read [approved brand folder or document links]. If supported, add a Brand resources section that retrieves the relevant guidelines with the visitor's own connection and links to the originals. If access is missing, identify the resource that couldn't be loaded and explain how the visitor can connect their account or request access. Keep request briefs and feedback stored in the app, and don't change the source documents. If the connection isn't available, use the supplied resource links and explain what needs manual updating.
```

### Find overdue requests and missing feedback

Add a view that separates overdue requests, requests waiting for feedback, and requests without an agreed delivery date.



**Prompt:**

```text
Add a Needs attention view for requests awaiting feedback or past their agreed delivery date. Show the request, owner, reviewer, requested date, and agreed date. Keep requests without an agreed date in a separate group. Preserve the existing access rules. Test an overdue request, one waiting for feedback, and one without an agreed date; don't send reminders automatically.
```