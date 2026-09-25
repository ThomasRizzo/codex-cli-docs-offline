---
name: Track job applications
tagline: Compare roles and manage tailored application materials.
summary: Use ChatGPT with verified experience notes, a resume, portfolio, role
  descriptions, career guidance, contacts, and deadlines to create a role-fit
  comparison, tailored drafts, interview prep, and application tracker.
skills:
  - token: $spreadsheets
    description: Track requirements, evidence, gaps, status, deadlines, and next actions.
  - token: $documents
    description: Draft tailored application materials and interview preparation notes.
bestFor:
  - Students applying to several jobs or internships.
  - Applications that need tailored evidence without invented qualifications.
  - Searches that combine deadlines, outreach drafts, and interview preparation.
starterPrompt:
  title: Build an Application Tracker
  body: >-
    Help me compare these job and internship descriptions and build an
    application tracker.


    Use my resume, verified experience notes, portfolio, career-center guidance,
    contacts, and deadlines.


    Create one row per role with:

    - requirements

    - verified evidence of fit

    - gaps

    - status

    - deadline

    - next action


    Organize one folder per role and draft tailored materials for my review. Do
    not invent qualifications or submit applications, contact anyone, or send
    anything without my approval.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Build a verified evidence set

Gather your current resume, portfolio, role descriptions, career-center guidance, deadlines, and notes about experience you can verify. Remove sensitive identifiers that are not needed for drafting.

Ask ChatGPT to distinguish explicit job requirements from preferences and to cite the evidence used for every fit assessment.

## Create the tracker

Use the starter prompt to build one row per role with:

- organization and role
- deadline and source link
- required qualifications
- verified evidence of fit
- gaps or questions
- application status
- next action
- relevant contact or event

Keep a folder for each role so drafts, research, and submitted versions do not get mixed together.

## Tailor without inventing

Review every resume bullet, cover letter claim, and interview example against your actual experience. Remove unsupported claims and keep gaps visible.

ChatGPT can prepare drafts, outreach options, and interview questions, but it should not submit applications or contact anyone without your approval.