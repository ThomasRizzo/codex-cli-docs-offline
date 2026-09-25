---
name: Run your first security scan
tagline: Find vulnerabilities in your code, review the evidence, and decide what
  needs attention.
summary: Use the Codex Security plugin to scan a local repository, review the
  evidence and coverage, and prioritize findings for investigation or a fix.
skills:
  - token: $codex-security:security-scan
    url: /docs/security/plugin/scans
    description: Scan a repository or scoped folder, validate candidate
      vulnerabilities, and report findings and coverage.
bestFor:
  - Developers assessing a repository or service they own or are authorized to
    review.
  - Security teams establishing an initial view of vulnerabilities and areas
    that need further review.
  - Reviewers who need code evidence and validation results before deciding what
    to fix.
starterPrompt:
  title: Find vulnerabilities in a repository
  body: >-
    Use $codex-security:security-scan to run a standard security scan of
    [absolute path to this repository or one scoped folder].


    I am authorized to assess this code. Keep the review within the selected
    scope.

    Use the repository's security guidance and supported validation commands.

    Do not apply fixes or close findings.


    Return the scan report and summarize:

    - Findings, affected code, and realistic impact.

    - Validation evidence and remaining uncertainty.

    - Reviewed areas, exclusions, and incomplete coverage.

    - Findings and coverage gaps that need human review first.
  suggestedEffort: xhigh
relatedLinks:
  - label: Install the Codex Security plugin
    url: /docs/security/plugin
  - label: Scan settings and recommended model
    url: /docs/security/plugin/scans#configure-the-scan
  - label: Fix a finding from your security scan
    url: /use-cases/fix-a-finding-from-your-security-scan
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Scan a local repository with the Codex Security plugin, review the evidence
behind each finding, and decide what needs investigation or a fix. Start with
one repository or service so you can review its coverage before expanding the
scan.

## Before you start

Open a local repository that you own or have permission to assess in Codex.
Install and enable the [Codex Security plugin](https://developers.openai.com/docs/security/plugin), and
confirm that your account and workspace have the required
[security access](https://developers.openai.com/docs/cyber-safety).

Start with a standard scan of the repository or one service. It runs the scan
workflow once and gives you findings, supporting evidence, and coverage to
review before deciding what to fix. For a large monorepo, choose one folder
with a clear service or product boundary.

Use the starter prompt in that repository's Codex project, replacing the path
with your intended scope. To configure the same scan in the Security sidebar,
follow [Run your first scan](#run-your-first-scan). Choose one way to start the
scan.

## Run your first scan




1. Open **Security**, select **Scans**, then select **+ Scan**.
2. Select your repository and confirm that **Current branch** and **Last
   commit** match the code you want to review. **Codebase** scans the checked-out
   code, including local changes.
3. Select **Codebase** and set **Scan area** to **Entire codebase** or one
   folder. Leave **Deep scan** off for this first pass.
4. Choose a model and reasoning effort using the current
   [scan recommendations](https://developers.openai.com/docs/security/plugin/scans#configure-the-scan).
5. Open **Additional context** if you want to explain a security rule or area
   to prioritize, then select **Start scan**.




For an application that keeps each customer's data in a separate workspace,
you could add this security context:

```text
Users must only retrieve documents from workspaces they belong to.
Review whether a user can supply another workspace's identifier and
retrieve its private documents. Check where workspace membership is
enforced, including background jobs and direct API calls.
```

<figure className="not-prose my-8">
  
  <figcaption className="mt-3 text-sm text-secondary">
    Example scan setup from the security docs. Confirm your own repository,
    scope, and settings before starting.
  </figcaption>
</figure>

## Follow the scan and check coverage

Codex identifies the application's assets and security boundaries, reviews
code for candidate vulnerabilities, validates candidates, and assesses their
impact before producing the report. Select **View activity** to inspect the
underlying Codex task, and wait for the scan to finish.

Open the completed scan and confirm the target and revision. Review coverage,
including skipped or deferred areas, before reading the findings. A completed
scan can contain vulnerabilities; an empty findings list with incomplete
coverage does not establish that the code is secure.

If the scan stops or leaves gaps, record those areas for follow-up. Scan time
and resource use depend on the selected code and the validation work required.

## Understand a finding

Select a finding and open **Summary**. Review these questions together:

- **What can an attacker do?** Read the affected code, root cause, and reported
  impact.
- **How can they reach it?** Follow the attack path from attacker-controlled
  input to the sensitive operation, including any existing safeguards.
- **What did the scan demonstrate?** Read the validation evidence, severity rationale,
  and remaining uncertainty. A severity label alone is not enough to accept a
  finding.

<figure className="not-prose my-8">
  
  <figcaption className="mt-3 text-sm text-secondary">
    Example finding from the security docs, not the result of running this
    walkthrough.
  </figcaption>
</figure>

In this example, a request supplies a workspace identifier that reaches
private-document retrieval without a membership check. To assess a similar
finding in your code, inspect whether another control enforces membership and
whether the validation demonstrates access across workspaces.

For help interpreting a finding, open a chat in the same repository project
and include the finding's title, affected code, and evidence:



**Prompt:**

```text
Help me assess this security finding: [paste the finding, affected code, and validation evidence].

Explain the attack path, existing safeguards, and whether the evidence supports the reported impact and severity. Cite the relevant code and identify missing information. Do not modify code or close the finding.
```

## Choose the next action

Keep a short record of each reviewed finding: the scanned revision, affected
code, evidence, remaining uncertainty, and responsible team. Choose the next
action based on that evidence:

- **Needs a fix:** Select one accepted finding and continue to
  [Fix a finding from your security scan](https://developers.openai.com/use-cases/fix-a-finding-from-your-security-scan).
- **Needs investigation:** Keep it open and identify the missing check or
  information before making a remediation decision.
- **Does not need a fix:** Record the supporting evidence and your triage
  decision. Closing a finding records that decision; it does not change code.

Your result is a reviewed set of findings and coverage gaps, with a next action
for each. If you need a more thorough assessment, use
[Run a deep security scan](https://developers.openai.com/use-cases/deep-security-scan). To assess a
specific pull request or diff, use
[Scan code changes for security](https://developers.openai.com/use-cases/scan-code-changes-for-security).