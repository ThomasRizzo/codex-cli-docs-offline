---
name: Automate security scans in CI
tagline: Scan pull requests, commits to main, or your repository on a schedule.
summary: Add the Codex Security CLI to your CI pipeline. Choose when to scan and
  which code to review, preserve findings and coverage, and decide how results
  should affect delivery.
bestFor:
  - Teams adding security checks to pull or merge requests.
  - Maintainers scanning their default branch after changes land.
  - Security teams scheduling recurring repository assessments.
relatedLinks:
  - label: Run Codex Security in CI
    url: /codex/security/cli/ci
  - label: Run Codex Security in GitLab CI/CD
    url: /codex/security/cli/ci/gitlab
  - label: Review code changes in the desktop app
    url: /codex/use-cases/scan-code-changes-for-security
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Make security scanning part of your development workflow. Run Codex Security
on pull requests, after changes reach your default branch, or on a recurring
schedule. Choose the scan scope that fits each trigger, preserve findings and
coverage, and give your team a repeatable way to review the results.

## Choose when to scan

Start with one trigger that fits your team's workflow. Add others as you learn
how long scans take, what they cost, and how your team uses the findings.

| When to run               | Suggested scope                                    | What it helps you review                                     |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| On a schedule             | Full repository, optionally using a deep scan      | The broader codebase at a recurring interval.                |
| On commits to main        | Full repository at the pushed commit               | The integrated code after changes reach your default branch. |
| On pull or merge requests | Changes between the merge base and proposed commit | Potential security regressions before merge.                 |

Use your repository's default branch if it has a name other than `main`.
Configure both the trigger and the scan scope: a pull-request diff scan covers
that change, not the entire repository. A scan after changes reach `main`
cannot block a pull request that has already merged.

## Before you start

You'll need a repository you're authorized to assess, permission to configure
its CI pipeline and secrets, and an OpenAI API key with Codex Security access.
Use the [CLI quickstart](https://developers.openai.com/codex/security/cli) to check access and setup requirements.

Use a trusted runner that meets the
[CI requirements](https://developers.openai.com/codex/security/cli/ci#prepare-the-workflow). Scans run with
the runner's local permissions. Keep unrelated credentials out of the scan
job, and follow your platform's restrictions for pull requests from forks
and other untrusted code.

## Set up your pipeline




1. Add Codex Security to your pipeline

   Choose the example for your CI platform. Follow it to install the Codex
   Security CLI and provide an API key through your CI provider's secret store.

   Choose a starting point:
   - **GitHub Actions:** Use the
     [pull-request workflow](https://developers.openai.com/codex/security/cli/ci#add-the-github-actions-workflow)
     to scan proposed changes and preserve results.
   - **GitLab CI/CD:** Use the
     [pipeline guide](https://developers.openai.com/codex/security/cli/ci/gitlab) for merge requests,
     default-branch scans, and scheduled scans. It includes a downloadable
     pipeline and explains which options to enable.
   - **Other CI platforms:** Adapt the scan and export commands in
     [Run Codex Security in CI](https://developers.openai.com/codex/security/cli/ci) to your provider's
     triggers, secret store, checkout, and artifact handling.

2. Configure the trigger and scope

   Scan the repository at the pushed commit when changes reach `main`,
   and on a recurring schedule for your chosen branch. Weekly scans are
   a good place to start; adjust the cadence based on repository activity,
   scan duration, and cost.

   For pull or merge requests, fetch the base and head history and scan
   the committed diff from their merge base.

   Configure each job to scan the intended code: the full repository for
   scheduled scans and commits to `main`, or the proposed changes for pull
   requests. Follow your platform's example to set up the appropriate scan.

   Set a budget appropriate for the scope and frequency. Full-repository
   scans can take longer and cost more than diff scans. Treat `--max-cost`
   as an estimated cost limit, not a hard spending cap. Reaching it can
   leave coverage incomplete.

3. Run the pipeline and review the results

   Submit the pipeline change through your normal review process, then
   trigger a scan. Confirm the target revision and scope in the run and
   `scan-manifest.json`.

   Review the findings and supporting evidence in the saved reports. Check
   `coverage.json` for incomplete or deferred areas, even if the scan
   reported no findings. Review runtime and cost before increasing the frequency
   or expanding to more repositories.

   Preserve reports as CI artifacts. Keep artifact access and retention
   appropriate for the source code and evidence they contain.

   Optionally export SARIF, a structured
   format for security findings, to display results in your platform's
   security interface. Check the platform guide for supported versions,
   permissions, and licensing requirements.

4. Choose whether findings should block merging

   Start by reviewing findings without blocking merges. Once your team is
   comfortable with the results, you can require pull requests to pass a
   security check—for example, blocking merges when the scan finds a high-
   or critical-severity vulnerability.

   Always check whether the scan completed and what code it covered. A scan
   that failed or skipped code needs attention, even if it reported no findings.

   For setup details, see
   [Configure severity thresholds and interpret scan results](https://developers.openai.com/codex/security/cli/ci#choose-a-severity-policy).

5. Follow up on findings

   Assign findings for investigation or remediation through your team's normal
   process. Include the scanned commit, affected code, and supporting evidence
   so another developer can investigate.

   Verify fixes before closing findings, and address incomplete coverage in a
   follow-up scan.