---
name: Synthesize research evidence
tagline: Build a source-linked evidence base for research or proposals.
summary: Use ChatGPT to synthesize papers, research notes, methods documents,
  prior proposals, funding guidance, and grant aims into a research landscape
  with themes, disagreements, limitations, and claim-review flags.
skills:
  - token: google-drive
    description: Gather the approved paper corpus, notes, methods documents, and
      proposal materials.
  - token: $documents
    description: Produce a structured evidence brief with source links and
      claim-review flags.
bestFor:
  - Faculty preparing a literature review or grant concept.
  - Evidence collections spread across papers, notes, and prior proposals.
  - Draft claims that need traceable sources and explicit limitations.
starterPrompt:
  title: Build a Literature or Grant Evidence Base
  body: >-
    Synthesize the papers, research notes, methods documents, prior proposals,
    funding guidance, grant aims, and citation requirements I provide.


    Organize the evidence by:

    - theme

    - disagreement

    - methods limitation

    - relevance to each research or grant aim

    - open question


    Create a research landscape or grant evidence brief with source links and
    claims that require faculty verification. Do not invent citations or
    overstate the evidence.
  suggestedEffort: high
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Define the evidence corpus

Collect the approved papers, notes, methods documents, prior proposal excerpts, funder guidance, draft aims, and citation requirements. Record which sources are authoritative and which are background only.

Ask ChatGPT to inventory the corpus before synthesizing it. Resolve missing files, duplicates, and inaccessible references early.

## Build a traceable evidence brief

The starter prompt should produce:

1. Themes and areas of agreement.
2. Meaningful disagreements.
3. Methods and evidence limitations.
4. Evidence mapped to each research or grant aim.
5. Open questions and missing support.
6. Source links for every substantive claim.

Keep source findings separate from interpretation and proposal language.

## Review claims and citations

Verify each citation against the original source. Check that quoted or paraphrased findings preserve scope, population, method, and uncertainty.

Use follow-up prompts to strengthen weakly supported sections, compare competing evidence, or create a claim-to-source matrix. Faculty remain responsible for interpretation, citation accuracy, and final proposal claims.