---
name: Run verified operations
tagline: Run repeatable workflows and verify the result.
summary: Use ChatGPT to normalize inputs, run approved scripts or APIs, retry
  bounded failures, and verify the result from logs or artifacts before
  reporting back.
bestFor:
  - Operations tasks with structured inputs, explicit approval, and a result
    that should be auditable.
  - Repeated workflows such as access updates, invite batches, quota changes,
    customer setup tasks, routing checks, and migration follow-ups.
  - Teams that need ChatGPT to run a narrow scope and report exactly what
    succeeded, failed, or needs a human decision.
starterPrompt:
  title: Run an Approved Workflow
  body: >-
    I need to run this workflow:


    Goal: [what should happen]

    Inputs: [CSV, Google Sheet, list, ticket, or file path]

    Approval or policy source: [Slack thread, doc, ticket, or none]

    Runner: [script, API, CLI, skill, or manual app workflow]

    Verification artifact: [result CSV, log, dashboard, screenshot, or other
    proof]


    Please:

    - inspect the inputs and ask only for missing required fields

    - normalize dates, amounts, owners, and IDs before running the workflow

    - run a dry run first when the workflow supports it

    - run only the approved scope

    - record one success or failure row per item

    - retry transient failures once without restarting successful rows

    - summarize totals, failures, retries, and verification artifacts


    Pause before irreversible actions or scope changes.
  suggestedModel: gpt-6-sol
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
  - label: Scheduled tasks
    url: /codex/automations
  - label: Agent skills
    url: /codex/build-skills
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Run operations you can audit

If you have repeatable operations you need to run regularly, such as giving access to a user, applying a batch update, or calling a script with different parameters for example, you can use ChatGPT to automate it and give you an auditable output.

Use this workflow when ChatGPT should run a repeatable operation and show you what happened with an artifact that counts as verification.

## Describe the task and inputs




1. Give ChatGPT the input table, files, tickets, or other list it should batch run the process on.
2. Point it to the approval source or policy that defines the allowed scope, if applicable.
3. Tell ChatGPT which script, API, skill, CLI, or app workflow should do the work.
4. Optionally, ask for a dry run when the workflow supports one.
5. Ask ChatGPT to run the batch operation and record one success or failure row per item.




Keep the scope narrow, and add instructions for ChatGPT to run the operation only when it has all the required inputs.
If a row is missing a required field, ChatGPT should flag that row instead of guessing.

Connect the tools you use to run the operation with [plugins](https://developers.openai.com/codex/plugins), for example your ticketing system or your spreadsheet with list items.

## Require proof to verify the result

A useful operations run includes a result that you or a teammate can inspect, such as a CSV, log file, dashboard link, screenshot, PR check, or other proof that the operation was successful. In the ChatGPT desktop app, you can [open and inspect generated files](https://developers.openai.com/codex/artifacts-viewer) after the run to verify the result.

## Turn the run into a reusable workflow

After the first successful run, ask ChatGPT to capture the repeatable parts. For common workflows, this can become a [skill](https://developers.openai.com/codex/build-skills) or a [scheduled task](https://developers.openai.com/codex/automations).



**Prompt:**

```text
Turn this operations run into a [reusable ChatGPT skill/scheduled task].

Capture:

- required inputs
- approval or policy source
- runner command, API, skill, or app workflow
- dry-run behavior if applicable
- verification artifact
- retry policy
- final report format

Keep the operation narrow and pause before irreversible actions.
```

For scheduled operations, create a scheduled task only after the manual run produces reliable output. Keep sensitive actions that might affect access or data permanently draft-only unless you explicitly want ChatGPT to take them.