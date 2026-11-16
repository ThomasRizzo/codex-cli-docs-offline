---
name: Create custom review workflows with GitHub Actions
tagline: Run security checks on your own triggers and keep the results for review.
summary: Make security reviews a repeatable part of your development process.
  Configure a GitHub Actions workflow that runs Codex Security on proposed
  changes and saves the results for your team to inspect.
bestFor:
  - Platform and application security teams adding security checks to GitHub
    Actions.
  - Repository maintainers configuring custom review triggers and scan scope.
  - Teams that need repeatable reviews with saved findings, evidence, and
    coverage reports.
relatedLinks:
  - label: Run Codex Security in GitHub Actions
    url: /codex/security/cli/ci/github
  - label: Save reports and upload SARIF results
    url: /codex/security/cli/ci/github#save-reports-and-upload-sarif
  - label: Explore CI/CD integrations and enforcement options
    url: /codex/security/cli/ci
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Instead of enforcing security reviews through Codex, it is also possible to create custom workflows that run the Codex Security CLI. We’ve packaged this workflow to easily be used as a GitHub Action.
```yaml
name: Codex Security review
on:
  workflow_dispatch:
  schedule:
    - cron: '23 7 * * 1' # Mondays at 07:23 UTC

permissions:
  contents: read

jobs:
  security:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: openai/codex-security@a98b35d7eef9f85c298c86229445bb64ac427aaf # action-v0.9.1
        with:
          model: gpt-5.6-sol
          effort: high
        env:
          OPENAI_API_KEY: ${{ secrets.CODEX_SECURITY_API_KEY }}
```

These workflows can also be applied to other source code management tools like GitLab, BitBucket, or Jenkins. Take a look at our documentation page to learn more: [Run Codex Security in CI](https://developers.openai.com/codex/security/cli/ci).