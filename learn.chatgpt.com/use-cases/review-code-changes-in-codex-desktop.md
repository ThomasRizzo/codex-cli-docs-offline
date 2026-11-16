---
name: Review code changes in Codex Desktop
tagline: Inspect changes and investigate security findings while you work.
summary: Start a security review from Codex or your repository’s Codex project.
bestFor:
  - Developers checking uncommitted changes while the implementation is still
    fresh in their minds.
  - Engineers reviewing a commit, branch, or pull-request change set from a
    local checkout.
  - Reviewers who want to investigate findings alongside the affected code
    before deciding what to fix.
starterPrompt:
  title: Starter prompt
  body: Please run a $codex-security:security-diff-scan on [Github repository URL]
relatedLinks:
  - label: Install the Codex Security plugin
    url: /codex/security/plugin
  - label: Review local changes, commits, and pull requests
    url: /codex/security/plugin/code-changes#run-a-manual-review
  - label: Use the Security workbench
    url: /codex/security/plugin/workbench
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

For a more interactive experience reviewing PRs or uncommitted changes, you can execute reviews through the security tab within Codex.

![The Security workbench with the Changes scan type selected.](https://developers.openai.com/images/codex/secure-sdlc/changes-scan.webp)

Alternatively, you can prompt Codex within the repository project of Codex by invoking the skill.

![Security Diff Scan prompt for the North Star Bank example repository.](https://developers.openai.com/images/codex/secure-sdlc/desktop-review-prompt.webp)