# Security

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Find and fix vulnerabilities in your code.

Use Codex to investigate security risks in your code and dependencies, then
develop and test fixes. Start with a repository, a code change, or findings from
tools you already use.

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