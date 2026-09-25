---
name: Build and deploy internal apps
tagline: Turn a team workflow into a hosted internal app with Sites.
summary: Use Sites in ChatGPT Work to build and test a focused internal app, add
  storage when the workflow needs it, and share the reviewed version with the
  right audience.
bestFor:
  - Teams turning a recurring workflow into a focused internal tool.
  - Apps that need lightweight storage, uploads, or workspace sharing.
starterPrompt:
  title: Build and deploy an internal app
  body: >-
    Use @Sites to build a private internal app for [describe the workflow or
    tool you need]. Use any attached files or linked documents to understand who
    it's for, what information it should show, and what people need to do.


    Build a focused first version and check that it works on mobile and desktop.
    Show me a private preview, explain anything that needs my review, and make
    it easy to iterate.


    Do not publish or share the app, change its access, or contact anyone
    without asking me first.
  suggestedEffort: medium
relatedLinks:
  - label: Sites documentation
    url: /codex/sites
  - label: Sites showcase
    url: /showcase/sites
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Build and deploy from one task

Sites is a managed hosting service in ChatGPT. Ask ChatGPT to create an app, and it can build the project, run it for testing, deploy it, and return a URL you can share.

Sites is in public beta for eligible paid plans. It isn't available on Free or Go, or in the EEA, Switzerland, or the United Kingdom at launch, and rollout or workspace settings can affect access.

The scope ranges from static sites to full-stack JavaScript or TypeScript web apps. That makes Sites a good fit for focused internal tools: onboarding dashboards, training hubs, searchable resource libraries, lightweight workflow apps, and reporting views.

See the [Sites documentation](https://developers.openai.com/codex/sites) for setup, storage, deployment, and access guidance.

Start with one useful workflow. A clear first version is easier to review, deploy, and improve than a broad request to recreate an entire internal system.

## What to expect

Here is a fictional example using an attached launch brief and five sample requests. The first pass creates and checks a focused request tracker; the follow-up adds an owner filter and makes overdue requests easier to see.

The launch-request tracker opens with **five sample requests**, including one blocked request, two in review, and one overdue item. The team can scan by launch and status, filter blocked work, add a request, and update its status. The main flow and saved state were checked at desktop and mobile widths.

After a follow-up, the tracker includes an owner filter and highlights overdue work; **blocked requests stay at the top and a request can't be marked ready without an owner**. The preview remains private; no Site was published and access did not change.




## Give ChatGPT the workflow context

Tell ChatGPT who the app is for, what people should do, which source material it should inspect, and what should persist between sessions. Be explicit about the intended sharing scope and ask ChatGPT to test the main flow before it deploys.

Use [plugins](https://developers.openai.com/codex/plugins) to fetch or refresh data from connected internal sources. Start a Sites task that uses connected apps or cloud files in Work on the web, or in Work or Codex on desktop. Use the desktop app for a local file, the built-in browser for a signed-in site, or the Codex Chrome extension for an existing Chrome session.

If you need live data fetching, you can connect to a third-party tool using an
  API key configured in the Site's settings. Keep secret values out of prompts
  and files. If you want to use plugin connections, you can [schedule work from
  the current task](https://developers.openai.com/codex/automations#schedule-work-from-a-task) to fetch data
  with plugins on a set schedule, update the app, and save a version for review.
  Deploy the reviewed version only after approval.

## Choose storage for the app

Many internal apps need persistence. Sites supports two storage primitives:

- Use D1, a SQLite-compatible database, for structured data such as checklist state, bookmarks, filters, annotations, configuration, and file metadata.
- Use R2 object storage for file bytes such as uploaded documents, images, or other assets that should persist.

Keep structured metadata in D1 and larger file objects in R2. A read-only resource page or small static site may not need either one.

Sites doesn't support data or inference residency. Don't use it to process protected health information or payment-card data, or to enable financial transactions. Review the [Sites data and usage restrictions](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites) before storing sensitive information.

## Manage and share your projects

You can manage who can visit your deployed projects.

Keep a new project private while you review its content, data handling, and intended audience.

Depending on your account and workspace settings, you can share it with:

- People you invite.
- Everyone in your workspace.
- Anyone on the Internet.

Sharing lets people visit the project; it doesn't let them edit it. To change access, open [Sites in ChatGPT](https://chatgpt.com/sites) or ask ChatGPT directly:



**Prompt:**

```text
Change this site's access to everyone in my workspace.
```

Public sharing also works for a lightweight event guide, club resource page, or other site meant for people outside a workspace. In Enterprise workspaces, public publishing is off by default and an admin must enable it. Keep internal data private even when a public link is available.

## Examples

The [Sites showcase](https://developers.openai.com/showcase/sites) includes Site examples with full prompts.


- **[Onboarding Hub](https://developers.openai.com/showcase/onboarding-hub)** combines a first-week checklist, resources, notes, and uploaded documents. It uses D1 for user state and file metadata, and R2 for uploaded file bytes.
- **[Enablement Hub](https://developers.openai.com/showcase/enablement-hub)** provides a searchable training library with filters and saved bookmarks backed by D1.
- **[Pulse Dashboard](https://developers.openai.com/showcase/pulse-dashboard)** presents metrics, trends, and lineage details while using D1 for configuration and cached snapshots.
- **[Sparkboard](https://developers.openai.com/showcase/idea-intake)** turns employee idea intake into a workflow with authenticated submissions, voting, comments, status boards, and contributor rankings.
- **[Launch Cal](https://developers.openai.com/showcase/launch-cal)** organizes upcoming product launches into a monthly calendar with filters, risk signals, checklists, and connected-source references.
- **[Event Planning Hub](https://developers.openai.com/showcase/event-planning-hub)** combines event requests, approvals, templates, milestones, policy readiness, and connected planning resources.


Use those examples as starting points, then narrow the prompt around your team's workflow and source material.