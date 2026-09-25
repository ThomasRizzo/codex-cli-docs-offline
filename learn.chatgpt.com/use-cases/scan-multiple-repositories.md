---
name: Scan multiple repositories
tagline: Run security scans across repositories and review the findings and coverage.
summary: Use the Codex Security CLI to scan a list of repositories at specific
  commits, review each result, and decide what needs investigation or a fix.
bestFor:
  - Security teams assessing a group of services at specific commits.
  - Engineering teams that need a repeatable repository inventory and separate
    scan results.
  - Reviewers prioritizing findings and coverage gaps across repositories.
relatedLinks:
  - label: Install and authenticate the CLI
    url: /docs/security/cli
  - label: Bulk scans and repository discovery
    url: /docs/security/cli/bulk-scans
  - label: Bulk-scan command reference
    url: /docs/security/cli/reference#codex-security-bulk-scan
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

Complete the [CLI quickstart](https://developers.openai.com/docs/security/cli) to install
and authenticate Codex Security. Confirm that you have security scan access and
Git access to the repositories you own or have permission to assess. Scans use
your local permissions and don't pause for approval; review the
[scan permissions guidance](https://developers.openai.com/docs/security/cli/reference#local-scan-permissions).

## Prepare the repository inventory

Start with a small set of repositories. Save this as `repositories.csv`, then
replace the example URLs and commit placeholders:

```csv
id,repository,revision
payments,https://github.com/YOUR-ORG/payments.git,REPLACE_WITH_FULL_COMMIT_SHA
identity,https://github.com/YOUR-ORG/identity.git,REPLACE_WITH_FULL_COMMIT_SHA
```

Give each repository a unique `id` and a full commit SHA. Get the SHA from a
local checkout with:

```bash
git -C /path/to/repository rev-parse HEAD
```

Each scan reviews that commit, including the full repository. Branch names,
shortened hashes, and uncommitted changes aren't part of this workflow. For
folder scopes or repository-specific instructions, see the
[CSV options](https://developers.openai.com/docs/security/cli/bulk-scans#create-a-repository-csv).

**GitHub option:** You can [choose repositories
  interactively](https://developers.openai.com/docs/security/cli/bulk-scans#discover-github-repositories)
  from your GitHub account or organization instead of preparing a CSV.

## Run the scans

From the directory containing `repositories.csv`, replace the output path with
a private directory outside the scanned repositories, then run:

```bash
npx @openai/codex-security bulk-scan repositories.csv \
  --output-dir /path/outside/repositories/security-scans \
  --workers 2 \
  --mode standard \
  --max-attempts 1 \
  --max-cost 5
```

This runs two standard scans at a time, with one attempt per repository.
`--max-cost 5` stops each attempt when its estimated cost exceeds $5. Work
already in progress can exceed the estimate, so this is not a hard cap or a
shared budget for the whole run. Choose these values before starting.

The CLI saves each repository's results in its own folder under
`security-scans/artifacts/`. Keep the results private: they can contain source
excerpts and vulnerability details.

## Review the results

Open the results directory and check:

1. **Inventory:** Confirm the repositories and commits in `manifest.json`.
2. **Status:** Read `results.jsonl` for each attempt's status and artifact location.
3. **Coverage and findings:** In each attempt folder, read `coverage.json` for
   gaps and exclusions, then `report.md` and `findings.json` for findings and
   supporting evidence.

Exit code `0` means every repository completed successfully, not that no
vulnerabilities exist. Exit code `2` indicates incomplete coverage, a repository
that couldn't complete, or an input or runtime error. An empty findings list
with incomplete coverage does not establish that the code is secure.

Record the next action for each repository: investigate a finding,
[fix an accepted finding](https://developers.openai.com/docs/security/plugin/fix-findings), or follow up on
coverage gaps. Use the scanned commit and supporting evidence when handing
work to the responsible team.

To resume an interrupted run, repeat the same command with the same CSV,
instructions, and output directory. The CLI skips completed scans and does
not automatically retry incomplete coverage. Use a new output directory when changing
the inventory, revisions, scopes, modes, or instructions. See
[resume and retry guidance](https://developers.openai.com/docs/security/cli/bulk-scans#resume-a-campaign)
for recovery details.