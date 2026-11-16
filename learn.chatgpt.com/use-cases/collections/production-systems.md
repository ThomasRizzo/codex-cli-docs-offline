# Production systems

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Navigate, refactor, and review real codebases.

## In this collection

- [Understand large codebases](https://developers.openai.com/codex/use-cases/codebase-onboarding)
- [Upgrade your API integration](https://developers.openai.com/codex/use-cases/api-integration-migrations)
- [Refactor your codebase](https://developers.openai.com/codex/use-cases/refactor-your-codebase)
- [Run code migrations](https://developers.openai.com/codex/use-cases/code-migrations)
- [Migrate a validation module](https://developers.openai.com/codex/use-cases/migrate-a-validation-module)
- [Save workflows as skills](https://developers.openai.com/codex/use-cases/reusable-codex-skills)
- [Create a CLI Codex can use](https://developers.openai.com/codex/use-cases/agent-friendly-clis)
- [Run verified operations](https://developers.openai.com/codex/use-cases/verified-operations-workflows)
- [Follow a goal](https://developers.openai.com/codex/use-cases/follow-goals)
- [Keep documentation up-to-date](https://developers.openai.com/codex/use-cases/update-documentation)
- [Kick off coding tasks from Slack](https://developers.openai.com/codex/use-cases/slack-coding-tasks)
- [Automate bug triage](https://developers.openai.com/codex/use-cases/automation-bug-triage)
- [Investigate an incident and test a fix](https://developers.openai.com/codex/use-cases/incident-to-tested-fix)
- [Review GitHub pull requests](https://developers.openai.com/codex/use-cases/github-code-reviews)
- [QA your app with Computer Use](https://developers.openai.com/codex/use-cases/qa-your-app-with-computer-use)
- [Turn an issue into a tested pull request](https://developers.openai.com/codex/use-cases/issue-to-tested-pr)
- [Add evals to your AI application](https://developers.openai.com/codex/use-cases/ai-app-evals)

The use cases in this collection are useful when Codex is working in a repo that already has history, tests, owners, and production constraints.
Codex is particularly good at navigating complex codebases, including sprawling monorepos with lots of different services and dependencies.
If you're working on a production system, get familiar with these use cases to understand how Codex can help you.

## Start with a codebase tour

Use Codex to get familiar with a complex codebase, which is especially useful when onboarding onto a repo for production software.

- [Understand large codebases](https://developers.openai.com/codex/use-cases/codebase-onboarding): Use Codex to map unfamiliar codebases, explain different modules and data flow, and point...

## Modernize the codebase

Leverage Codex to plan tech stack migrations, upgrade your integration to the latest models if applicable, and refactor the codebase to improve readability and maintainability.

- [Upgrade your API integration](https://developers.openai.com/codex/use-cases/api-integration-migrations): Use Codex to update your existing OpenAI API integration to the latest recommended models...
- [Refactor your codebase](https://developers.openai.com/codex/use-cases/refactor-your-codebase): Use Codex to remove dead code, untangle large files, collapse duplicated logic, and...
- [Run code migrations](https://developers.openai.com/codex/use-cases/code-migrations): Use Codex to map a legacy system to a new stack, land the move in milestones, and validate...
- [Migrate a validation module](https://developers.openai.com/codex/use-cases/migrate-a-validation-module): Give Codex a bounded migration brief, contract fixtures, and a prepared cloud environment

## Codify repeatable work

Ask Codex to turn repo-specific workflows or checklists into a skill, so that all repo contributors can benefit from a standardized process.

- [Save workflows as skills](https://developers.openai.com/codex/use-cases/reusable-codex-skills): Turn a working Codex chat, review rules, test commands, release checklists, design...
- [Create a CLI Codex can use](https://developers.openai.com/codex/use-cases/agent-friendly-clis): Ask Codex to create a composable CLI it can run from any folder, combine with repo scripts...
- [Run verified operations](https://developers.openai.com/codex/use-cases/verified-operations-workflows): Use ChatGPT to normalize inputs, run approved scripts or APIs, retry bounded failures, and...
- [Follow a goal](https://developers.openai.com/codex/use-cases/follow-goals): Use `/goal` when a task needs Codex to keep working across turns toward a verifiable...

## Keep documentation current

Ask Codex to compare source changes with existing docs, update the smallest useful docs surface, and verify the changes.

- [Keep documentation up-to-date](https://developers.openai.com/codex/use-cases/update-documentation): Use Codex to compare source code changes, public docs, release notes, and PR context, then...

## Maintain system health

Let Codex pick up feature requests and bug fixes automatically by using it from Slack and connecting it to your alerting, issue tracking, and daily bug sweeps.

- [Kick off coding tasks from Slack](https://developers.openai.com/codex/use-cases/slack-coding-tasks): Mention `@ChatGPT` in Slack to request repository work in an eligible workspace-shared Codex...
- [Automate bug triage](https://developers.openai.com/codex/use-cases/automation-bug-triage): Ask Codex to check recent alerts, issues, failed checks, logs, and chat reports, tune the...
- [Investigate an incident and test a fix](https://developers.openai.com/codex/use-cases/incident-to-tested-fix): Give Codex Cloud a sanitized incident packet and a working test environment

## Avoid the review bottleneck

Use Codex to automatically review PRs and run focused QA passes on critical flows, so you can catch issues quickly and ship updates confidently.

- [Review GitHub pull requests](https://developers.openai.com/codex/use-cases/github-code-reviews): Use Codex code review in GitHub to automatically surface regressions, missing tests, and...
- [QA your app with Computer Use](https://developers.openai.com/codex/use-cases/qa-your-app-with-computer-use): Use Computer Use to exercise key flows, catch issues, and finish with a bug report.
- [Turn an issue into a tested pull request](https://developers.openai.com/codex/use-cases/issue-to-tested-pr): Give Codex a scoped issue, a prepared cloud environment, and explicit checks
- [Add evals to your AI application](https://developers.openai.com/codex/use-cases/ai-app-evals): Ask Codex to inspect your AI application, identify the behavior you want to evaluate, and...