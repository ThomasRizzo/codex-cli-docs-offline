---
name: Track course engagement
tagline: Turn de-identified course exports into a faculty review view.
summary: Use ChatGPT with LMS activity, gradebook, attendance, assignment
  metadata, and metric definitions to build a dashboard of engagement patterns,
  completion gaps, assessment trends, and data-quality warnings.
skills:
  - token: $spreadsheets
    description: Align course exports, calculate reviewed metrics, and build an
      editable dashboard.
  - token: google-drive
    description: Gather approved LMS, attendance, gradebook, and assignment files.
bestFor:
  - Faculty reviewing course engagement and completion patterns.
  - Course exports that need aligned definitions and data-quality checks.
  - Dashboards that support human review without diagnosing students.
starterPrompt:
  title: Build a Course Engagement Dashboard
  body: >-
    Build a course engagement and performance dashboard from the de-identified
    LMS activity, gradebook, attendance, assignment metadata, course calendar,
    and metric definitions I provide.


    Show:

    - engagement trends

    - completion gaps

    - assessment patterns

    - missing or inconsistent data

    - questions for faculty review


    Create a faculty review queue. Do not diagnose students or automate
    outreach, grading, placement, or support decisions.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Define the dashboard before combining data

Provide only approved, de-identified exports. Include the metric definitions, reporting window, course calendar, and identifiers needed to align the files.

Before building charts, ask ChatGPT to show how the LMS, attendance, gradebook, and assignment data will be joined. Resolve duplicate records, missing identifiers, and conflicting definitions first.

## Build a review view

Use the starter prompt to create a dashboard with:

- trends over time
- assignment completion and assessment patterns
- filters that match the course structure
- missing-data and quality warnings
- a queue of questions for faculty review

Keep observed patterns separate from explanations. A change in activity is a signal to inspect, not a diagnosis.

## Validate and use responsibly

Check calculations against source totals and spot-check individual de-identified records. Confirm that date windows, section filters, and assessment groupings are correct.

Use the dashboard to guide faculty questions. Do not use it to automate grading, outreach, placement, or high-stakes labels.