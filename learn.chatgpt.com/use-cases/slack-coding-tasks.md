---
name: Kick off coding tasks from Slack
tagline: Delegate repository work from Slack threads.
summary: Mention `@ChatGPT` in Slack to request repository work in an eligible
  workspace-shared Codex Cloud environment, then review the result in the
  thread.
bestFor:
  - Async handoffs with enough context in the Slack thread to act on
  - Teams handling issue triage, bug fixes, or scoped implementation work from
    Slack
starterPrompt:
  title: Start the task from a thread
  body: >-
    @ChatGPT investigate the issue described in this thread for [repository].

    Use the workspace-shared Cloud environment for [project or environment].

    Make the smallest useful fix, run the relevant checks, and report the result
    here.
  suggestedModel: cloud
relatedLinks:
  - label: Use ChatGPT in Slack
    url: /codex/third-party/slack
  - label: Codex Cloud environments
    url: /codex/environments/cloud-environments
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## How to use

1. Have your workspace admin enable the ChatGPT app in Slack using the [Slack
   setup guide](https://developers.openai.com/codex/third-party/slack).
2. For repository work, confirm that Cloud delegation is enabled and an eligible
   workspace-shared environment has a published version. For an Enterprise
   workspace, follow the [environment sharing
   guidance](https://developers.openai.com/codex/environments/cloud-environments#share-within-an-enterprise-workspace).
3. Copy the starter prompt into an enabled Slack channel or thread. Include the
   repository, relevant context, constraints, and the result you want.
4. Complete any connection or approval prompts, then review the result and
   reported checks. When available, use **Follow along** to inspect the coding
   task.
5. Mention `@ChatGPT` in the same thread for related work. Follow-ups that use
   the same account to run the task can continue it; another execution account
   may start a separate task. Start a new conversation to use a different Cloud
   environment.

## Tips

- Summarize the issue and expected behavior if the thread doesn't already provide
  enough context.
- Name the repository or intended workspace-shared environment. Personal Cloud
  environments aren't included in this Slack flow.
- Check that the account running the task has the required environment,
  repository, and service access. A Slack reply doesn't give everyone access
  to the coding task.
- Keep the request scoped and name relevant files or folders in a large codebase.
- Before merging, review proposed changes and check that the reported tests cover
  the requested behavior.