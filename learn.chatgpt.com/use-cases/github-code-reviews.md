---
name: Review GitHub pull requests
tagline: Catch regressions and potential issues before human review.
summary: Use Codex code review in GitHub to automatically surface regressions,
  missing tests, and documentation issues directly on a pull request.
skills:
  - token: $security-best-practices
    url: https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices
    description: Focus the review on risky surfaces such as secrets, auth, and
      dependency changes.
bestFor:
  - Teams that want another review signal before human merge approval
  - Large codebases for projects in production
starterPrompt:
  title: Ask Codex to review a pull request
  body: "@codex review for security regressions, missing tests, and risky behavior
    changes."
  suggestedModel: cloud
relatedLinks:
  - label: Codex code review in GitHub
    url: /codex/third-party/github
  - label: Custom instructions with AGENTS.md
    url: /codex/agent-configuration/agents-md
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## How to use

Start by adding Codex code review to your GitHub organization or repository.
See [Codex code review in GitHub](https://developers.openai.com/codex/third-party/github) for more details.

You can set up Codex to automatically review every pull request, or you can request a review with `@codex review` in a pull request comment.

If Codex flags a regression or potential issue, you can ask it to fix it by commenting on the pull request with a follow-up prompt like `@codex fix it`.

This will start a new cloud chat that will fix the issue and update the pull request.

## Define review guidance

To customize what Codex reviews, add a `## Code Review Rules` section to the
`AGENTS.md` closest to the code the rules govern. For example:

```md
## Code Review Rules

### Experiment cohorts

- Do not filter treatment comparisons on post-exposure behavior, including conversion or retention.
  Safe path: build cohorts from assignment or exposure; report conversion as an outcome.
```

Put repository-wide rules in the root `AGENTS.md` and service-specific rules
in a nested file. Keep rules concise, describe the behavior to flag and any
safe path or exception, and leave formatting and lint checks in CI. See
[Customize what Codex reviews](https://developers.openai.com/codex/third-party/github#customize-what-codex-reviews)
for setup and rule-writing guidance.