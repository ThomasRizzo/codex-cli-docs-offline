---
name: Prepare a committee packet
tagline: Turn governance context into a review-ready meeting packet.
summary: Use ChatGPT with prior minutes, policy drafts, stakeholder feedback,
  program data, governance rules, and decision criteria to prepare a sourced
  decision brief, options, agenda, and minutes template.
skills:
  - token: google-drive
    description: Gather prior minutes, policy drafts, feedback, program data, and
      governance rules.
  - token: $documents
    description: Create the decision brief, agenda, and draft minutes template.
bestFor:
  - Faculty and academic committees preparing for a specific decision.
  - Meetings that need sourced options, tradeoffs, and unresolved questions.
  - Governance workflows where the committee must retain final judgment.
starterPrompt:
  title: Prepare a Committee Decision Packet
  body: >-
    Review the prior minutes, policy drafts, stakeholder feedback, program data,
    governance rules, decision criteria, and meeting deadline I provide.


    Create a packet with:

    - the question to resolve

    - sourced evidence

    - options and tradeoffs

    - unresolved issues

    - a proposed meeting agenda

    - a draft minutes template


    Separate findings from recommendations and leave the final decision to the
    committee.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Frame the decision

Start with the exact question the committee must resolve, the governing rules, the decision criteria, and the deadline. Add prior minutes, policy drafts, stakeholder feedback, and relevant program data.

Tell ChatGPT which materials are authoritative and which represent proposals or opinions.

## Assemble the packet

Use the starter prompt to create a packet that separates:

- confirmed facts and source evidence
- interpretations
- viable options
- tradeoffs and dependencies
- unresolved policy or data questions
- recommendations that need committee discussion

The agenda should follow the decision sequence, and the minutes template should make outcomes, owners, and follow-ups easy to capture.

## Review before the meeting

Check citations, governance requirements, and any confidential material. Confirm that dissenting views and uncertainty are represented fairly.

Use ChatGPT to revise the packet after committee feedback, but keep the final decision and official record with the committee and designated owner.