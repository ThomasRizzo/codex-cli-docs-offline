---
name: See which campaigns bring in leads
tagline: Compare spend, lead counts, and cost per lead by campaign, channel, and week.
summary: Turn weekly campaign exports into a dashboard where your team can
  compare lead volume and cost, filter a change by channel, and inspect the rows
  behind the totals.
bestFor:
  - Marketers comparing lead volume and cost per lead across channels.
  - Teams reviewing weekly exports from ad platforms and CRM reports.
  - Teams replacing a static weekly report with a dashboard people can explore.
starterPrompt:
  title: See which campaigns bring in leads
  body: >-
    Use @Sites to build a campaign dashboard for [team] from [attached
    spreadsheet or exact source link and tab].


    Reporting context:

    - Review question: [what the team wants to understand from this report].

    - Period: [start and end dates].

    - Currency: [currency].

    - Week boundary and time zone: [definition].

    - Lead definition and attribution rule: [team definition].

    - Additional source and campaign-ID mapping, if needed: [file or none].


    First inspect the source and show the columns, row count, date range, and
    sample rows. Expect one row per campaign per week with campaign ID or name,
    channel, spend, and leads. Flag duplicates, missing values, mixed
    currencies, and unmatched campaign IDs. Ask how to resolve ambiguous
    mappings; don't silently drop rows or invent data.


    Show total spend, total leads, and cost per lead. Add campaign, channel, and
    week filters, a weekly trend chart, and a campaign comparison table. Let a
    reviewer inspect the source rows behind a selected campaign's totals. Make
    every card, chart, and table use the same filtered rows. Label currency,
    reporting period, source, and any excluded rows. Flag a partial reporting
    week when the supplied dates establish that it is incomplete.


    Calculate cost per lead as total spend divided by total leads for the
    selected rows, never the average of row-level ratios. Show N/A for zero-lead
    ratios, distinguish missing values from zero, and show an empty state when
    no rows match. Keep different currencies separate unless I supply a
    conversion rule.


    Start with a saved copy of the supplied data. Explain how to replace it with
    a new export without duplicating overlapping weeks. Don't describe it as
    live unless a supported connection is configured and tested. Don't edit
    source reports or campaign budgets, or infer revenue or lead quality from
    lead counts.


    Check totals against the source. Use a separate, labeled sample to test that
    $1,000 with 25 leads plus $500 with five leads gives $1,500 spend, 30 leads,
    and $50 cost per lead; don't add these sample rows to the real report. Also
    test zero leads, missing values, duplicate rows, and combined filters. Check
    the mobile layout. Keep the dashboard private to our workspace and show a
    saved preview, validation results, and unresolved data questions before
    publishing.
  suggestedEffort: medium
relatedLinks:
  - label: Connect a data source
    url: /codex/sites/data-and-connections#build-a-site-with-connected-data
  - label: Review before sharing
    url: /codex/sites/publishing-and-sharing#review-before-you-share
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Turn weekly campaign exports into a dashboard your team can explore during a review. Show spend, lead volume, and cost per lead together so colleagues can compare campaigns, narrow to a channel or week, and open the rows behind a result.

Choose the question the dashboard should help answer. You might want to find campaigns where spend increased without a similar increase in leads, or see whether a change came from one campaign or an entire channel. That question helps you choose useful filters and comparisons.

Export a spreadsheet for the period you want to review. Use one row per campaign per week and include a stable campaign ID if names can change.

| Field                | Sample value            | Check before building                                         |
| -------------------- | ----------------------- | ------------------------------------------------------------- |
| Week start           | 2026-10-05              | All sources use the same week boundary and time zone          |
| Campaign ID and name | SEARCH-01, Product demo | The ID identifies the same campaign in each source            |
| Channel              | Paid search             | Channel names are consistent                                  |
| Spend and currency   | 1000, USD               | Values use one currency or remain in separate currency groups |
| Leads                | 25                      | Every campaign uses the same lead definition                  |

Supply your team's lead definition and the reporting period. If spend comes from an advertising report and leads come from a customer relationship management (CRM) report, also provide the agreed campaign mapping and attribution rule. Without these, the site can't reliably connect the two reports.

## Connect your sources




1. Attach a CSV or spreadsheet in the build conversation. For a sheet in a connected app, ask ChatGPT which connections can read it, then provide the file link, tab name, and relevant range or column names. Complete any connection step it requests.
   For example, name the “Weekly campaign results” file in Google Drive, the “Campaigns” tab, and columns A–F, if an available connection can read that sheet. Otherwise, export the tab as a CSV and attach it.
2. Ask ChatGPT to show the columns, reporting dates, row count, and a few sample rows before building. Identify blank values, duplicate campaign-week rows, and unmatched campaign IDs. Confirm how to handle them.
3. Start with a saved copy of the export. Label it with its source and reporting period. To update it, provide a fresh file in the same conversation and say whether it replaces the dataset or adds new weeks. Check for overlap before combining exports.
4. For data that loads when someone opens the site, ask ChatGPT to verify a supported read connection to the exact sheet or reporting source. Keep the site private to your workspace and test with a teammate's connection. See [data and connections](https://developers.openai.com/codex/sites/data-and-connections#build-a-site-with-connected-data).




A source link or uploaded export doesn't create a live connection. For a connected version, request a manual Refresh action and a visible last-successful-refresh time. If access fails, show an error or previous results labeled with their refresh time rather than an empty report that looks like zero activity.

## How to use it




1. Reconcile the totals with your export

   Use the starter prompt, then compare unfiltered totals with the source. Check a small selection yourself before relying on the summary cards. For example, these hypothetical campaigns illustrate how the dashboard should combine results:

   | Sample campaign      | Spend  | Leads | Cost per lead |
   | -------------------- | ------ | ----- | ------------- |
   | Product demo: Search | $1,000 | 25    | $40           |
   | Product demo: Social | $500   | 5     | $100          |
   | Combined             | $1,500 | 30    | $50           |

   Combined cost per lead is $1,500 divided by 30 leads, or $50. Averaging $40 and $100 would incorrectly give $70 because the campaigns generated different numbers of leads. Ask ChatGPT to show how it calculates the total, then check it against your source rows.

   Test a zero-lead row, a missing value, and a filter with no matching rows. The cards, chart, and table should all use the same selection and distinguish missing data from zero.

2. Compare volume, cost, and weekly changes

   Choose the same reporting period for the campaigns you want to compare. Look at lead counts alongside cost per lead: a campaign can have a low unit cost while contributing only a small share of total leads. Then filter to a channel and inspect the weekly trend to find where a change began.

   Use the campaign table to identify what needs a closer look. If spend rose but leads stayed flat, check the source report and campaign changes for that period. If one week looks unusually low, first check whether the week is complete and all rows were included. Lead counts alone don't establish lead quality, revenue, or what caused a change.

3. Bring current data to the weekly review

   Review the audience and publish the dashboard for your team. Before each meeting, replace the export or refresh the connected source, then verify the reporting period, totals, and any excluded rows. In the meeting, filter to a result someone has a question about and trace it back to the source. Leave with a specific follow-up, such as checking a campaign's lead definition or reviewing a recent creative change. Keep budget changes outside the dashboard's reporting workflow.




## Take it further

### Refresh from a connected spreadsheet

Replace repeated file uploads with a supported read connection that shows when the dashboard last refreshed successfully.



**Prompt:**

```text
Check whether an available connection can read [spreadsheet link], tab [tab name], with columns [column names]. If supported, add a manual Refresh action using each visitor's own connection. Validate the new rows before replacing displayed results, preserve the current filters, and show the source, reporting period, and last successful refresh. Handle denied access and missing columns visibly. Keep this read-only; don't edit the sheet or change campaign budgets. If unsupported, retain the file-based update workflow.
```

### Compare consecutive weeks

Show what changed from the previous calendar week, using consistent filters and totals for both periods.



**Prompt:**

```text
Compare the selected week with the previous calendar week for spend, leads, and cost per lead, using the same campaign and channel filters. Show absolute changes and the two date ranges. Calculate each period's cost per lead from its total spend and leads. Label missing prior-week data and undefined ratios as unavailable rather than zero. Check the results against a small sample before saving the update.
```