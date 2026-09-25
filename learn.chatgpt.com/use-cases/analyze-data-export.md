---
name: Build a dashboard that stays up to date
tagline: Turn your data into a private dashboard and keep it up to date.
summary: Ask ChatGPT Work to turn your spreadsheets into a private, interactive
  Site, check the source data on a schedule, and flag the changes that need your
  attention.
skills:
  - token: sites
    description: Build and preview a private, interactive dashboard.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read the approved spreadsheets and source files behind the dashboard.
  - token: $spreadsheets
    description: Check source data, calculate changes, and verify the dashboard.
bestFor:
  - Building an interactive dashboard from spreadsheets or sales exports.
  - Keeping the dashboard current without manually checking the source data.
starterPrompt:
  title: Build a dashboard that stays up to date
  body: >-
    Use @Sites and @google-drive to turn my latest sales data into a private,
    interactive dashboard. Use the spreadsheets or CSVs I attach, or the exact
    Google Drive or Google Sheets URL I paste into this chat. If I have not
    attached a file or provided a source URL, ask me for one instead of
    guessing.


    Show revenue, customer segments, changes over time, and anything unusual.
    Include clear charts, date and segment filters, when the source was last
    updated, and the calculations behind the results. Check for missing rows,
    unmatched records, and inconsistent dates, and explain anything that could
    change the answer.


    Check the approved source every weekday morning. Update the dashboard when
    the data changes, and notify me only when there is a meaningful change, a
    data-quality problem, or something I need to review. If nothing important
    has changed, do not send an update.


    Show me the dashboard for review. Keep it private, and do not publish it,
    share it, change its permissions, or contact anyone without my approval.
  suggestedEffort: medium
relatedLinks:
  - label: Sites documentation
    url: /codex/sites
  - label: Scheduled tasks
    url: /codex/automations
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Attach a CSV or spreadsheet, or connect Google Drive and paste the exact Google Drive or Google Sheets URL into the chat. Sites can turn those sources into a private, interactive dashboard without publishing it or making your data public.

You can build the dashboard in ChatGPT Work in the browser or desktop app. For a scheduled check that continues when your laptop is off, start the task in the browser. A desktop-based task requires your computer to be on and the desktop app to be running.

## What to expect

ChatGPT checks the source data, creates a dashboard, and shows the numbers behind the charts. This example uses fictional quarterly sales exports, a customer-segment map, and a representative dashboard preview. It distinguishes the largest dollar change from the largest percentage change and flags an order that cannot be matched to a customer segment.

### Example dashboard

| Customer segment | Q1 revenue | Q2 revenue |         Change |
| ---------------- | ---------: | ---------: | -------------: |
| Enterprise       |     $3,000 |     $2,450 | -$550 (-18.3%) |
| Mid-market       |     $1,000 |     $1,170 |   +$170 (+17%) |
| SMB              |       $400 |       $520 |   +$120 (+30%) |

Enterprise had the largest dollar change, and SMB had the largest percentage change. One Q2 order worth $160 did not match the customer-segment map and was excluded from the segment totals. The private dashboard includes a comparison chart, segment and date filters, source freshness, and the underlying calculations.

When asked to check the source every weekday morning, ChatGPT updates the dashboard when the approved data changes and flags material changes or missing records. It does not publish or share the dashboard without approval.




## How it works

- **Connect the source:** attach a sales export or spreadsheet, or paste the exact link to an approved Google Sheet or Google Drive file. ChatGPT checks the columns, dates, and customer records before drawing conclusions.
- **Build the dashboard:** Sites turns the results into a private, interactive dashboard with charts, filters, source freshness, and supporting calculations.
- **Keep it current:** a scheduled ChatGPT Work task checks the approved source each weekday and updates the dashboard when the data changes. The site does not run the schedule itself.
- **Only surface what matters:** ask ChatGPT to flag unusual changes, missing records, or decisions that need review. If nothing important changes, it should stay quiet.
- **Review before sharing:** inspect the dashboard first. Ask ChatGPT to share it with specific people only after you approve the access change.

## Share the dashboard

After reviewing the dashboard, ask ChatGPT to share it with specific people or make it available to your workspace. You can also manage access directly in [Sites](https://chatgpt.com/sites). Ask ChatGPT to show the current sharing settings and wait for your approval before inviting anyone, publishing the dashboard, or changing its visibility.



**Prompt:**

```text
Share this dashboard with [name or email]. Show me the current access settings, who will be able to view it, and the dashboard link first. Wait for my approval before changing access or sending an invitation.
```

See the [Sites documentation](https://developers.openai.com/codex/sites) for sharing options and workspace access.

## Take it further

**Change what the dashboard tracks**



**Prompt:**

```text
Update this dashboard to show revenue by customer segment and region. Include the change from the previous period, the source freshness, a filter for each region, and any records that could not be matched. Keep the dashboard private.
```

**Set a more useful alert**



**Prompt:**

```text
When you refresh the dashboard, notify me only if a customer segment changes by more than 15%, a source has stopped updating, or records cannot be matched. Show the change, link it to the source, and tell me what needs review. Do not message me if nothing meets those conditions.
```

**Prepare a weekly update**



**Prompt:**

```text
Every Friday, prepare a short update using the latest dashboard. Include what changed, the most useful chart, any data-quality caveats, and the decisions that need attention. Save it for my review without sending it to anyone.
```