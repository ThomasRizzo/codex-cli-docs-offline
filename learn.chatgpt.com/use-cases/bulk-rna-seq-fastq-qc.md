---
name: Validate bulk RNA-seq inputs
tagline: Validate bulk RNA-seq inputs before differential expression.
summary: Use ChatGPT with the NGS Analysis plugin to validate sample sheets,
  FASTQs, and references, then return MultiQC, Salmon matrices, provenance, and
  a short QC interpretation before differential expression.
skills:
  - token: NGS Analysis
    url: codex://plugins/ngs-analysis@openai-curated
    description: Validate sequencing inputs, run bulk RNA-seq counts and QC, and
      return auditable artifacts.
bestFor:
  - Bioinformatics teams validating bulk RNA-seq inputs before differential
    expression.
  - Researchers who want transcript and gene-level quantification plus QC in one
    chat.
  - Teams that need mapping-rate, duplication, library-type, and
    resource-readiness review.
starterPrompt:
  title: Run Bulk RNA-seq Counts and QC
  body: >-
    Use the NGS Analysis plugin.


    Run bulk RNA-seq FASTQ-to-count QC on the provided sample sheet, FASTQ root,
    transcriptome FASTA, genome FASTA, and GTF.


    Return:

    - run_manifest.json

    - MultiQC plus browser-safe review links

    - Salmon transcript- and gene-level matrices

    - validation and resource-readiness artifacts

    - a short QC interpretation that calls out mapping rate, duplication,
    library-type agreement, outlier samples, and anything that would block
    downstream differential expression
  suggestedEffort: high
relatedLinks:
  - label: Request access to GPT-Rosalind
    url: https://openai.com/form/life-sciences-access/
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Leverage skills

The NGS Analysis plugin includes:

- `ngs-analysis-router`
- `ngs-bulk-rnaseq-counts-qc`
- `ngs-runtime-env`

When you use the plugin, ChatGPT can use all these packaged skills.

## Step-by-step guide




1. Point ChatGPT to a directory with the sample sheet, FASTQs, transcriptome FASTA, genome FASTA, and GTF, or provide exact file references.
2. Run the starter prompt so ChatGPT can validate strandedness, reference consistency, and tool readiness before execution.
3. Open the generated MultiQC and matrix artifacts in ChatGPT to review mapping rate, duplication, library-type agreement, and resource readiness.
4. Continue in the same chat to fix blockers, rerun with updated metadata, or hand the resulting gene-level matrices into downstream differential expression.




## Results

The run returns a QC-reviewed counts bundle rather than a bare quantification
output. Start with the MultiQC report to identify warnings that could affect
downstream interpretation. In this example, ChatGPT surfaces FastQC
sequence-content warnings alongside the run summary so the team can decide
whether the observed pattern is expected for the library preparation.

![Review FastQC sequence-content warnings alongside the bulk RNA-seq run summary.](https://developers.openai.com/codex/use-cases/bulk-rna-seq-fastq-qc-screenshot-1.webp)

Next, review the Salmon statistics in the same report. Mapping rates,
library-type assignments, and duplication signals provide a compact readiness
check before differential expression.

![Inspect Salmon alignment and library-type statistics from the generated MultiQC report.](https://developers.openai.com/codex/use-cases/bulk-rna-seq-fastq-qc-screenshot-2.webp)

The resulting gene-level count matrix is saved as a reusable artifact. Open it
in ChatGPT to confirm the expected samples and features are present, then keep it
with the run provenance for downstream analysis.

![Open the generated gene-level count matrix for downstream review.](https://developers.openai.com/codex/use-cases/bulk-rna-seq-fastq-qc-screenshot-3.webp)