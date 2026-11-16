---
name: Run security reviews from the CLI
tagline: Review selected code changes and inspect security evidence from your terminal.
summary: Use Codex Security CLI to review uncommitted work or changes on a branch.
bestFor:
  - Developers checking local work or branch changes from their terminal.
  - Application security teams assessing selected services, packages, and their
    consumers in a monorepo.
  - Engineers investigating existing GitHub code-scanning alerts against their
    repository.
relatedLinks:
  - label: Set up and authenticate the Codex Security CLI
    url: /codex/security/cli
  - label: Select changes, revisions, and paths to scan
    url: /codex/security/cli/reference#select-the-scan-target
  - label: Validate existing findings from the CLI
    url: /codex/security/cli/reference#codex-security-validate-and-codex-security-patch
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Reviewing uncommitted local work

You can use the CLI to review uncommitted local work with seeded context about the repository and security policies.

Run the examples in the same shell from your Git checkout. They assume your security policy is in `SECURITY.md` and your supporting documents are in `docs/security/`. The setup creates a temporary directory for scan results.

```bash
northstar_repo="$(git rev-parse --show-toplevel)"
northstar_kb="$northstar_repo/docs/security"
northstar_results="$(mktemp -d)"
```

```bash
npx @openai/codex-security scan "$northstar_repo" \
  --working-tree \
  --base HEAD \
  --knowledge-base "$northstar_repo/SECURITY.md" \
  --knowledge-base "$northstar_kb" \
  --output-dir "$northstar_results/working-tree"
```

This reviews staged and unstaged changes relative to `HEAD`.

Before starting, be sure to confirm that the working tree contains the change you intend to assess. Unrelated edits broaden the investigation and can make it harder to connect the findings to the question that prompted the review.

## Reviewing PRs or branch commits

Another option is to review a PR or branch for security issues. Check out the branch to review and fetch its target branch. This example uses `origin/main`.

```bash
northstar_pr_base="$(git -C "$northstar_repo" merge-base origin/main HEAD)"

npx @openai/codex-security scan "$northstar_repo" \
  --diff "$northstar_pr_base" \
  --head HEAD \
  --knowledge-base "$northstar_repo/SECURITY.md" \
  --knowledge-base "$northstar_kb" \
  --output-dir "$northstar_results/branch"
```

Note that a diff scan evaluates the proposed changes and does not scan the entire repository. Once complete, the output directory will contain the following files:

- `report.md`: readable review

- `scan-manifest.json`: confirms the exact base, head, target, and artifacts

- `findings.json`: presents the severity, confidence, locations, and remediation

- `coverage.json`: identifies the reviewed surfaces, exclusions, deferred work, and completeness


## Scanning monorepos

In a monorepo, a change to a shared library can affect multiple services. Codex should receive enough context to review those interactions, while CI determines which components and checks are required.

## Repository context

Keep shared engineering instructions in `AGENTS.md` and security expectations in `SECURITY.md`. A typical repository could look like this:

```text
monorepo/
├── AGENTS.md
├── SECURITY.md
├── docs/security/
│   ├── architecture.md
│   └── threat-model.md
├── packages/auth/
└── services/
    ├── billing/
    └── reporting/
```

Use existing ownership and build metadata to connect each component to its dependencies, consumers, and tests. For example, a change to `packages/auth` may require reviewing both services even when their files are unchanged. This scope mapping is maintained by your organization; it is not automatically configured by adding Codex.

## Component assessment

Large repositories may not always require scanning the entire codebase for each PR. One option is to use a path scan when a monorepo contains separate services or packages. Repeat --path to assess a shared library and its consumers together.

```bash
npx @openai/codex-security scan "$northstar_repo" \
  --path packages/auth \
  --path services/billing \
  --path services/reporting \
  --knowledge-base "$northstar_repo/SECURITY.md" \
  --knowledge-base "$northstar_kb" \
  --output-dir "$northstar_results/paths"
```

This scans only the selected paths rather than the entire repository.

## PR and diff scanning

For a PR, use its exact base and head commit hashes from authenticated GitHub metadata. Both revisions and their history must be available in the checkout. The following example reuses the variables above and saves the diff results separately:

```bash
BASE_SHA="<full PR base commit SHA>"
HEAD_SHA="<full PR head commit SHA>"

BASE_REVISION="$(
  git -C "$northstar_repo" merge-base "$BASE_SHA" "$HEAD_SHA"
)" || exit

npx @openai/codex-security scan "$northstar_repo" \
  --diff "$BASE_REVISION" \
  --head "$HEAD_SHA" \
  --knowledge-base "$northstar_kb" \
  --auth chatgpt \
  --output-dir "$northstar_results/pr"
```

A diff scan focuses on the proposed changes. If a shared-library change requires broader consumer review, also run the component assessment against a clean checkout of that PR’s head revision. Keep the results distinct: `--diff` and `--path` are separate scan modes and cannot be combined.

## Scanning alerts from GitHub

You can also assess code scanning alerts from the default branch using the Codex Security CLI.

```bash
northstar_github_repository="example/northstar"
northstar_github_alerts="$northstar_results/github-alerts.json"

# Import all open alerts as complete JSON.
npx @openai/codex-security import github "$northstar_github_repository" \
  --format json \
  > "$northstar_github_alerts"

# Or import a selected subset.
npx @openai/codex-security import github "$northstar_github_repository" \
  --github-alert 12 \
  --github-alert 18 \
  --format json \
  > "$northstar_github_alerts"

# Run from the corresponding local repository; imported contents are data.
cd "$northstar_repo"
npx @openai/codex-security validate "$northstar_github_alerts"
```