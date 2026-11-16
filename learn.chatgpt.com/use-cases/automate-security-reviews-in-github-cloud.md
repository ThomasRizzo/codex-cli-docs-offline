---
name: Automate security reviews in GitHub Cloud
tagline: Check proposed changes for security risks before they merge.
summary: Connect a repository and configure review triggers with Codex Security Review.
bestFor:
  - Developers who want security feedback within their existing GitHub
    pull-request workflow.
  - Application security teams establishing consistent reviews of proposed code
    changes.
  - Repository maintainers tailoring reporting thresholds for sensitive areas
    such as authentication, authorization, and payments.
relatedLinks:
  - label: Configure automatic security reviews
    url: /codex/security/security-review#configure-security-review
  - label: Set reporting thresholds and path overrides
    url: /codex/security/security-review#set-reporting-thresholds
  - label: Review GitHub pull requests with Codex
    url: /codex/third-party/github
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

The fastest way to automate security reviews in GitHub Cloud is through the [Security Review](https://developers.openai.com/codex/security/security-review) feature within ChatGPT. This is available through the same product surface as Codex Code Reviews available within your organization at [https://chatgpt.com/codex/cloud/settings/code-review](https://chatgpt.com/codex/cloud/settings/code-review).

Codex Security Review goes deeper than Code Review on security-specific risks by analyzing the pull request diff, supporting repository context, and configured threat models or security guidance.

## Difference between Code Review and Security Review

Code Review is a broad engineering review that assesses code quality. For example, Code Review asks: “Could this change break the product or introduce a serious engineering problem?” It reviews issues such as incorrect control flow, data corruption or loss, compatibility regressions, or incorrect API behavior. The intended users for Code Review are software developers within the organization.

Codex Security is a specialized, deeper assessment of security risks in the same PR changes. Security Review is for both software developers responsible for remediating vulnerabilities, as well as application security engineers responsible for securing CI/CD pipelines and source code. It assesses issues such as authentication and authorization bypasses, cross-tenant access, injection and unsafe parsing, or sensitive data exposure.

## Configure security reviews


There are two options for configuring security reviews. The auto-review reporting determines which findings Codex posts to the PR when Security Review runs automatically. It is defaulted to High, so only High and Critical findings are posted.

The option for manual review controls which findings Codex posts after someone explicitly requests a Security Review. It is defaulted to Medium, so Medium, High, and Critical findings are posted.

When configured, posted vulnerabilities will surface within the PR.

![Security finding posted on a GitHub pull request.](https://developers.openai.com/images/codex/secure-sdlc/github-review-finding.webp)

It’s best to choose automatic reporting thresholds around what the team is prepared to investigate consistently. For a targeted investigation, use the manual review settings to surface the additional detail relevant to that question.

## Set path overrides


Path-based reporting overrides the minimum severity published to the Github PR. Given that a repository’s risk is rarely uniform, this feature can tailor the risk threshold for more critical path, such as:

- Lowering the threshold for authentication, authorization, payments, cryptography, CI workflows, of infrastructure.

- Keeping a higher threshold for lower-risk or especially noisy areas.

You can modify the path overrides within the Codex Cloud settings for the selected repo. In this example below, we have established that `src/**` should have auto reviews for low vulnerabilities or higher. Changes to GitHub workflows or dependencies will enforce reporting for medium vulnerabilities.

![Path overrides for source files, workflows, and dependencies.](https://developers.openai.com/images/codex/secure-sdlc/path-overrides.webp)