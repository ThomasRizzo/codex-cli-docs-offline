---
name: Analyze datasets and ship reports
tagline: Turn messy data into clear analysis and visualizations.
summary: Use ChatGPT Work to clean data, join sources, explore a question, model
  the result, and produce a clear report with supporting charts and caveats.
skills:
  - token: $spreadsheets
    description: Inspect CSV, TSV, and Excel files, check formulas and joins, and
      create reviewable tables or charts.
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Read the approved Google Sheets and source files you name in Drive.
  - token: Data Analytics
    description: Gather source context, analyze and validate data, and build
      reusable reports, dashboards, charts, or notebooks.
bestFor:
  - Data analysis that starts with messy files and ends with a chart, memo,
    dashboard, or report.
  - Questions that require cleaning, reliable joins, interpretable models, or
    reproducible analysis.
  - Teams that need artifacts others can review and reuse.
starterPrompt:
  title: Turn data into a source-backed report
  body: >-
    Use @Data Analytics to inspect the attached property-sales and
    highway-distance datasets and determine whether homes near the highway have
    lower property values.


    Explain what each source contains, identify the relevant columns and likely
    join keys, and check for missing values, duplicates, unmatched records, and
    incomplete data. Clean and join the inputs without overwriting the source
    files or inventing values.


    Explore the question with clear supporting charts, start with an
    interpretable model when modeling is useful, and explain the result,
    assumptions, and uncertainty in plain language. Return a concise report,
    notebook, or spreadsheet with the answer first, name the files you create,
    and flag any data issue that could change the conclusion.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
  - label: Agent skills
    url: /codex/build-skills
techStack:
  - need: Analysis stack
    goodDefault: "[pandas](https://pandas.pydata.org/) with
      [matplotlib](https://matplotlib.org/) or
      [seaborn](https://seaborn.pydata.org/)"
    why: Good defaults for import, profiling, joins, cleaning, and the first round
      of charts.
  - need: Modeling
    goodDefault: "[statsmodels](https://www.statsmodels.org/) or
      [scikit-learn](https://scikit-learn.org/stable/)"
    why: Start with interpretable baselines before moving to more complex predictive
      models.
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Introduction

At its core, data analysis is about using data to inform decisions. The goal isn't analysis for its own sake. It's to produce an artifact that helps someone act: a chart for leadership, an experiment readout for a product team, a model evaluation for researchers, or a dashboard that guides daily operations.

A useful framework, popularized by _R for Data Science_, is a loop: import and tidy data, then iterate between transform, visualize, and model to build understanding before you communicate results.

ChatGPT Work fits well into this workflow. It helps you clean data, explore hypotheses, generate analyses, and produce reproducible artifacts. The target isn't a one-off notebook. It's an analysis that other people can review, trust, and rerun.

## Define your use case

Choose one concrete question you want to answer with your data. The more specific the question, the easier it is to identify the right inputs, checks, and result.

### Running example: Property values near the highway

As an example, we'll explore the following question:

> To what extent are houses near the highway lower in property valuation?

Suppose one dataset contains property values or sale prices, and another contains location, parcel, or highway-proximity information. The work isn't only to run a model. It's to make the inputs trustworthy, document the joins, pressure-test the result, and end with an artifact that somebody else can use.

You can attach CSVs or Excel workbooks, name an approved Google Sheet with `@google-drive`, or use the desktop app when your data is stored on your computer.

### Example result

In a fictional sample, ChatGPT matches 11 property sales to the highway-distance file and flags one sale without a matching distance. Homes within one mile of the highway average **$500,000**, compared with **$600,000** for homes two to five miles away.

After excluding the highest-priced distant property, the difference remains **$94,000**. The report and chart explain that the sample is small, the unmatched sale is excluded, and the comparison doesn't establish causation or control for neighborhood, sale timing, traffic, or noise.




## Import the data

Start by attaching the files and asking ChatGPT to inspect them. This helps answer basic but important questions:

- What file formats are here?
- What does each dataset seem to represent?
- Which columns might be targets, identifiers, dates, locations, or measures?
- Where are the clear quality issues?

Don't ask for conclusions yet. Ask for inventory and explanation first.

## Tidy and merge the inputs

Most real work starts here. You have two or more datasets, the primary key isn't clear, and a naive merge could lose data or create duplicates.

Ask ChatGPT to profile the merge before performing it:

- Check uniqueness for candidate keys.
- Measure null rates and formatting differences.
- Normalize clear formatting issues such as casing, whitespace, or address formatting.
- Run trial joins and report match rates.
- Recommend the safest merge strategy before it writes the final merged file.

If you need to derive the best key, such as a normalized address, a parcel identifier built from a few columns, or a location join, ask ChatGPT to explain the tradeoffs and edge cases before you accept the merge.

## Explore with charts

Use charts to understand the data before choosing a model. In the running example, compare homes near the highway with homes farther away, examine outliers, inspect missing-value patterns, and check whether the apparent effect reflects neighborhood composition, home size, or another factor.

Keep each chart tied to the original question. Save the useful comparisons so another person can inspect the analysis.

## Model the question

Not every analysis needs a complex model. Start with an interpretable baseline.

For the highway question, a sensible first pass is a regression or other transparent model that estimates the relationship between highway proximity and property value while controlling for relevant factors such as size, age, and location.

Ask ChatGPT to be explicit about:

- The target variable and feature definitions.
- Which controls to include and why.
- Leakage risks and exclusions.
- How it chose the split, evaluation, or uncertainty estimate.
- What the result means in plain language.

If the first model is weak, that's still useful. It tells you whether the problem is the model, the features, the join quality, or the question itself.

## Communicate the result

The analysis is only useful when someone else can consume it. Ask ChatGPT to produce the artifact the audience needs:

- A Markdown memo for technical collaborators.
- A spreadsheet or CSV for downstream operations.
- A formatted document or PDF for decision-makers.
- A notebook, dashboard, or static report for a reusable analysis.

Ask it to include caveats. If the join quality is imperfect, sampling bias is present, or model assumptions are fragile, the deliverable should say so plainly.

## Optional: set up a Python environment

If the project needs reusable scripts or a notebook, ask ChatGPT to use the existing Python environment or set up a small, reproducible one. Keep source files unchanged and save the analysis, charts, and final report separately. You don't need to set up Python before analyzing attached files in ChatGPT Work.

## Suggested prompts

**Load the datasets and explain them**



**Prompt:**

```text
Review the data files I've attached and explain what each one contains. Identify likely target columns, dates, parcel or location identifiers, file formats, missing information, and obvious quality issues. Don't draw conclusions yet.
```

**Check the merge before joining**



**Prompt:**

```text
Check how these datasets should be joined. Profile the candidate keys, show duplicate and unmatched records, normalize obvious formatting issues, and explain the safest join. Don't invent missing values or overwrite the source files.
```

**Build an interpretable first model**



**Prompt:**

```text
Model whether highway proximity is associated with lower property values. Start with an interpretable baseline, account for home size, age, and neighborhood where the data supports it, and explain the effect, uncertainty, and limitations in plain language.
```

**Package the results for stakeholders**



**Prompt:**

```text
Turn this analysis into a short, stakeholder-ready report. Put the answer first, include the most useful supporting charts, explain the data and join checks, and clearly flag any limitations or uncertainty. Keep the source data unchanged and name the files you create.
```