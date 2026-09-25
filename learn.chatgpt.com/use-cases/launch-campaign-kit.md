---
name: Build a launch campaign kit
tagline: Turn launch context into coordinated first-draft campaign assets.
summary: Give ChatGPT launch plans, product notes, trackers, page links, team
  discussion, creative inputs, and approval guidance, then ask it to draft a
  campaign kit with review flags for unverified claims and staging issues.
skills:
  - token: google-drive
    url: https://github.com/openai/plugins/tree/main/plugins/google-drive
    description: Gather approved launch plans, product notes, briefs, and templates.
  - token: slack
    url: https://github.com/openai/plugins/tree/main/plugins/slack
    description: Read launch decisions, team context, and open questions.
  - token: gmail
    url: https://github.com/openai/plugins/tree/main/plugins/gmail
    description: Check relevant launch email threads and approvals.
  - token: $documents
    description: Draft the brief, copy, plan, and approval notes in a structured package.
  - token: $slides
    description: Create or update an editable launch presentation when the campaign
      needs a deck.
bestFor:
  - Product or marketing launches that need several coordinated first-draft
    assets.
  - Teams working across launch plans, page links, creative briefs, trackers,
    and discussion threads.
  - Campaigns where claims, approvals, and private operational details need
    explicit review.
starterPrompt:
  title: Build the launch campaign kit
  body: >-
    Build a first-draft campaign kit for [product or launch].


    Use the launch plan, product notes, launch tracker, creative brief, page
    links, team discussions, approval guidance, and any other sources I provide.


    Return:

    - launch review brief

    - customer email

    - internal announcement

    - social post

    - two-week content plan

    - agency or creative brief

    - staging-page fix list

    - team status update


    Flag unverified claims, missing assets, approval needs, and anything that
    requires product or legal review. Do not publish or send anything.
  suggestedEffort: high
relatedLinks:
  - label: "OpenAI Academy: Everyday work"
    url: https://openai.com/academy/how-to-use-codex-for-everyday-work/
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Gather the launch record

Campaign work crosses plans, product notes, trackers, pages, creative inputs, and team decisions. Start with the approved source set and tell ChatGPT which claims, assets, and destinations still need review.




1. Attach the launch plan, product notes, tracker, creative brief, and relevant pages.
2. Add launch discussions, approval guidance, audience, timing, and destination formats.
3. Run the starter prompt to create the campaign kit and an approval checklist.
4. Verify claims against product sources and separate public copy from internal operations.
5. Render any deck or page draft and fix safe layout issues before human review.




Use the first pass to identify missing inputs, not to fill them with plausible copy. Keep legal, product, and brand review flags next to the asset they affect.

## Run a launch-readiness pass

Ask ChatGPT to compare the kit with the launch plan and return only the gaps that could block review or publication.



**Prompt:**

```text
Audit this campaign kit against the launch plan and approval guidance.

List:

- claims without a source
- assets or links that are missing
- inconsistent dates, names, or product descriptions
- items needing product, legal, brand, or owner approval
- staging-page issues
- public copy that includes internal-only details

Fix safe formatting issues, but do not publish, send, or approve anything.
```