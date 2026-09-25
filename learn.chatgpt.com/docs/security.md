# Codex Security

> For the complete documentation index, see [llms.txt](llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Codex Security is an application security agent that helps security and
engineering teams find, confirm, and fix vulnerabilities. Use it in
Codex, from your terminal, through the TypeScript SDK, or with connected GitHub
repositories.

<CtaPillLink
  href="https://chatgpt.com/plugins/share/676aca3811d54fa7bcdef5255236b3c4"
  label="Install plugin in ChatGPT"
  icon="external"
  class="mb-8 mt-2"
/>

For a prescriptive first local scan, start with the [Codex Security plugin
quickstart](security/plugin.html).

## Use Codex Security in the desktop app

In the ChatGPT desktop app, open the ChatGPT dropdown and select **Codex**.
Install and enable the Codex Security plugin to open **Security** in the
sidebar. The Security workbench keeps your scans, findings, and repositories in
one place while Codex runs each scan in a task.

- Use **Scans** to start scans, follow their progress, and review saved results.
- Use **Findings** to inspect issues and evidence across completed scans.
- Use **Repositories** to review repository history and open findings.

See [Use the Security workbench](security/plugin/workbench.html) for the
complete desktop-app workflow.

### Explore plugin use cases

- [Run a security scan](security/plugin/scans.html) for a repository or one scoped folder.
- [Run a deep security scan](security/plugin/deep-scans.html) when you need broader review and can wait longer for it to finish.
- [Review code changes](security/plugin/code-changes.html) before you merge a pull request or branch.
- [Triage a backlog](security/plugin/triage-backlog.html) when you have existing security findings to review.
- [Fix and verify findings](security/plugin/fix-findings.html) with bounded patches for approved findings.
- [Export or track findings](security/plugin/export-findings.html) as portable artifacts or approval-gated tracking destinations.
- [Write vulnerability reports](security/plugin/vulnerability-reports.html) from supplied findings, disclosure notes, source, and PoCs.
- [Propose security hardening](security/plugin/security-hardening.html) from scan results or other security evidence.
- [See what's new](security/plugin/changelog.html) in the Codex Security plugin.

The desktop Security workbench and Codex CLI use the Codex Security plugin.
  Codex Security cloud scans connected GitHub repositories through Codex cloud.
  For Codex sandboxing, approvals, network controls, and admin settings, see
  [Agent approvals & security](agent-approvals-security.html).

## Codex Security CLI and SDK

The CLI and TypeScript SDK are available as the public
[`@openai/codex-security`](https://github.com/openai/codex-security) package.
Run the CLI with `npx`:

```bash
npx @openai/codex-security --help
```

Running scans requires Codex Security access. For best results, use an account
verified for [Trusted Access for Cyber](https://chatgpt.com/cyber).

Use the same scanner as the plugin across repositories and over time. The CLI
discovers GitHub repositories, resumes bulk scans, tracks findings across
scans, and records false-positive feedback. Add your architecture and security
policies, set an estimated cost limit, or run checks in CI and before commits.
Use the TypeScript SDK to build scanning, progress reporting, and cost controls
into an application or developer tool.

- [Start with the CLI quickstart](security/cli.html) to set up the CLI,
  preflight a repository, and run a local scan.
- [Run bulk security scans](security/cli/bulk-scans.html) to discover GitHub
  repositories or run a resumable campaign from a CSV inventory.
- [Run scans in CI](security/cli/ci.html) to review pull-request changes,
  preserve artifacts, upload SARIF, and set a severity policy.
- [Read the CLI FAQ](security/cli/faq.html) for answers about scan history,
  false-positive feedback, coverage, and fix verification.
- [Use the CLI reference](security/cli/reference.html) to check supported
  commands, flags, output formats, artifacts, and exit codes.
- [Integrate the TypeScript SDK](security/sdk.html) to select targets,
  inspect results, track progress, and cancel scans from code.

## Codex Security cloud

Codex Security cloud is currently in research preview. It scans connected
GitHub repositories for likely security issues.

It helps teams:

1. **Find likely vulnerabilities** by using a repo-specific threat model and real code context.
2. **Reduce noise** by validating findings before you review them.
3. **Move findings toward fixes** with ranked results, evidence, and suggested patch options.

## How Codex Security cloud works

Codex Security scans connected repositories commit by commit.
It builds scan context from your repo, checks likely vulnerabilities against that context, and validates high-signal issues in an isolated environment before surfacing them.

You get a workflow focused on:

- repo-specific context instead of generic signatures
- validation evidence that helps reduce false positives
- suggested fixes you can review in GitHub

## Codex Security cloud access and prerequisites

Codex Security cloud works with connected GitHub repositories through Codex
cloud. If a repository isn't visible, confirm the repository is available in your
Codex cloud workspace or contact your OpenAI account team.

## Related docs

- [Codex Security plugin quickstart](security/plugin.html) walks through installation and a first local scan.
- [Security workbench](security/plugin/workbench.html) explains saved scans, findings, repositories, and scan activity in the desktop app.
- [Codex Security CLI quickstart](security/cli.html) walks through setup, preflight, and a first terminal scan.
- [Run bulk security scans](security/cli/bulk-scans.html) explains GitHub discovery, CSV inventories, campaign results, and resume behavior.
- [Codex Security CLI FAQ](security/cli/faq.html) answers common questions about scans, findings, coverage, and costs.
- [Codex Security TypeScript SDK](security/sdk.html) explains how to run scans from an application or developer tool.
- [Codex Security cloud setup](security/setup.html) details setup, scanning, and findings review.
- [Security Review](security/security-review.html) explains how to run in-depth security reviews on GitHub pull requests.
- [Improving the threat model](security/threat-model.html) explains how to tune scope, entry points, and criticality assumptions.
- [Codex Security cloud FAQ](security/faq.html) covers common cloud product questions.