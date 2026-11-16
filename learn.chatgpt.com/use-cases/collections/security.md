# Security

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Cybersecurity guides for finding and fixing vulnerabilities in your code.

## In this collection

- [Getting Started with Daybreak Blue](https://developers.openai.com/codex/use-cases/getting-started-with-daybreak-blue)
- [Run your first security scan](https://developers.openai.com/codex/use-cases/find-vulnerabilities-in-your-code)
- [Run a deep security scan](https://developers.openai.com/codex/use-cases/deep-security-scan)
- [Scan multiple repositories](https://developers.openai.com/codex/use-cases/scan-multiple-repositories)
- [Automate security scans in CI](https://developers.openai.com/codex/use-cases/automate-security-scans-in-ci)
- [Scan code changes for security](https://developers.openai.com/codex/use-cases/scan-code-changes-for-security)
- [Audit dependency incidents](https://developers.openai.com/codex/use-cases/dependency-incident-audits)
- [Fix a finding from your security scan](https://developers.openai.com/codex/use-cases/fix-a-finding-from-your-security-scan)
- [Remediate a vulnerability backlog](https://developers.openai.com/codex/use-cases/remediate-vulnerability-backlog)
- [Set up security context](https://developers.openai.com/codex/use-cases/set-up-security-context)
- [Automate security reviews in GitHub Cloud](https://developers.openai.com/codex/use-cases/automate-security-reviews-in-github-cloud)
- [Review code changes in Codex Desktop](https://developers.openai.com/codex/use-cases/review-code-changes-in-codex-desktop)
- [Run security reviews from the CLI](https://developers.openai.com/codex/use-cases/run-security-reviews-from-the-cli)
- [Create custom review workflows with GitHub Actions](https://developers.openai.com/codex/use-cases/create-custom-review-workflows-with-github-actions)
- [Manage supply chain risk in the CI/CD](https://developers.openai.com/codex/use-cases/manage-supply-chain-risk-in-cicd)

Use Codex to investigate cyber risks in your code and dependencies, then
develop and test fixes. Start with a repository, a code change, or findings from
tools you already use.

## Set up Daybreak Blue

If your security team plans to use Daybreak Blue, a ChatGPT Enterprise
workspace owner can grant access to selected members.

- [Getting Started with Daybreak Blue](https://developers.openai.com/codex/use-cases/getting-started-with-daybreak-blue): Daybreak Blue reduces refusals on supported models for authorized defensive work

## Find vulnerabilities

Start with a scan of one repository, run a deeper review, or scan a repository
inventory. Automate scans in CI to review code on a schedule or as it changes.
Review the findings and coverage to decide where to investigate next.

- [Run your first security scan](https://developers.openai.com/codex/use-cases/find-vulnerabilities-in-your-code): Use the Codex Security plugin to scan a local repository, review the evidence and coverage...
- [Run a deep security scan](https://developers.openai.com/codex/use-cases/deep-security-scan): Use the Codex Security plugin to run a more comprehensive audit of a repository or scoped...
- [Scan multiple repositories](https://developers.openai.com/codex/use-cases/scan-multiple-repositories): Use the Codex Security CLI to scan a list of repositories at specific commits, review each...
- [Automate security scans in CI](https://developers.openai.com/codex/use-cases/automate-security-scans-in-ci): Add the Codex Security CLI to your CI pipeline

## Review changes and dependencies

Check a pull request or local diff for security regressions, or assess your
repository's exposure to a package or supply chain advisory. Gather evidence
before deciding what needs action.

- [Scan code changes for security](https://developers.openai.com/codex/use-cases/scan-code-changes-for-security): Use the Codex Security plugin to examine a Git-backed change set, validate plausible...
- [Audit dependency incidents](https://developers.openai.com/codex/use-cases/dependency-incident-audits): Use Codex to turn a public package or supply chain advisory into a read-only audit, then...

## Fix and verify findings

Turn a reviewed scan finding into a focused patch, or work through findings from
an existing backlog. Review each change and its verification evidence before
preparing it for merge.

- [Fix a finding from your security scan](https://developers.openai.com/codex/use-cases/fix-a-finding-from-your-security-scan): Use the Codex Security plugin to turn a reviewed scan finding into a focused patch
- [Remediate a vulnerability backlog](https://developers.openai.com/codex/use-cases/remediate-vulnerability-backlog): Bring in approved findings from ticketing tools or vulnerability reporting systems, then use...

## Secure the SDLC

Automate security reviews by defining your application’s security requirements, giving Codex the context to assess changes, and configuring reviews for pull requests and dependency updates.

- [Set up security context](https://developers.openai.com/codex/use-cases/set-up-security-context): Learn how to prepare and configure the context Codex needs for security reviews and scans.
- [Automate security reviews in GitHub Cloud](https://developers.openai.com/codex/use-cases/automate-security-reviews-in-github-cloud): Connect a repository and configure review triggers with Codex Security Review.
- [Review code changes in Codex Desktop](https://developers.openai.com/codex/use-cases/review-code-changes-in-codex-desktop): Start a security review from Codex or your repository’s Codex project.
- [Run security reviews from the CLI](https://developers.openai.com/codex/use-cases/run-security-reviews-from-the-cli): Use Codex Security CLI to review uncommitted work or changes on a branch.
- [Create custom review workflows with GitHub Actions](https://developers.openai.com/codex/use-cases/create-custom-review-workflows-with-github-actions): Make security reviews a repeatable part of your development process
- [Manage supply chain risk in the CI/CD](https://developers.openai.com/codex/use-cases/manage-supply-chain-risk-in-cicd): Assess how third-party dependencies affect your application’s security with Codex Security CLI