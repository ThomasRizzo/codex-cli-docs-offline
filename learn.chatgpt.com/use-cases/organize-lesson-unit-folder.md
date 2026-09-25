---
name: Organize a lesson or unit folder
tagline: Turn scattered teaching files into a clear, verified structure.
summary: Use ChatGPT with an existing lesson or unit folder to identify
  duplicates, propose practical subfolders, preserve source files, archive older
  drafts, standardize names, and return a change summary.
skills:
  - token: google-drive
    description: Inventory and organize lesson files while preserving originals.
bestFor:
  - Teachers with lesson or unit files spread across formats and drafts.
  - Folders that need clearer names, subfolders, and an archive.
  - Reorganization that should be proposed and reviewed before files move.
starterPrompt:
  title: Organize a Lesson or Unit Folder
  body: >-
    Organize this [lesson or unit] Drive folder into clear subfolders.


    Please:

    - keep original source files untouched

    - identify duplicates and older versions

    - propose an Archive folder for older drafts

    - rename unclear files consistently

    - create a short README that explains what is included


    Show me the proposed structure before making changes. After approval, verify
    the finished folder and summarize every change.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Inventory before reorganizing

Start with the existing lesson or unit folder. Tell ChatGPT which files are authoritative, which are working drafts, and which should never be moved.

Ask for an inventory that groups files by likely purpose and flags duplicates, unclear names, and older versions.

## Review the proposed structure

A practical structure might separate:

- source and reference materials
- lesson plans
- presentations
- student handouts
- assessments and answer keys
- accessibility or language versions
- archived drafts

The exact folders should reflect how the teacher or team actually works. Review names and proposed moves before approving any changes.

## Verify the result

After organization, confirm that links still work, current files remain easy to find, and nothing was deleted. Ask ChatGPT for a README and a change summary showing renamed, moved, and archived files.

Repeat the inventory when a unit changes substantially so the folder remains usable instead of accumulating another layer of duplicates.