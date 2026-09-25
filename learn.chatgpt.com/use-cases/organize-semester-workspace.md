---
name: Organize a semester workspace
tagline: Turn scattered course files and deadlines into one verified system.
summary: Use ChatGPT with course folders, syllabi, assignment sheets, readings,
  notes, and calendar context to organize a semester workspace, preserve
  originals, and build a deadline tracker linked to official sources.
skills:
  - token: google-drive
    description: Organize course files while preserving original materials.
  - token: $spreadsheets
    description: Build a deadline tracker with source links and conflict flags.
bestFor:
  - Students starting a new term with files spread across courses and downloads.
  - Semester planning that needs dates verified against official materials.
  - Workspaces that should preserve originals and archive duplicates.
starterPrompt:
  title: Organize My Semester Workspace
  body: >-
    Organize these semester files into a clear workspace by course, with
    subfolders for official course materials, readings, notes, assignments, and
    submitted work.


    Please:

    - preserve the original files

    - identify and archive duplicates

    - use consistent file names

    - create a course index

    - build a deadline tracker from the syllabi and assignment sheets

    - link every deadline to its official source


    Verify every date and flag conflicts instead of guessing. Show me the
    proposed structure before moving or renaming anything.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Gather official course sources

Collect each syllabus, assignment sheet, reading list, course calendar, and current folder. Distinguish official course materials from personal notes and submitted work.

Before organizing anything, ask ChatGPT to inventory the files, identify duplicates, and show the proposed folder structure.

## Build the workspace

A useful semester workspace should include:

- one folder per course
- separate locations for official materials, readings, notes, assignments, and submitted work
- consistent, searchable file names
- a course index with links to important files
- a deadline tracker with the source for every date

Preserve original files and archive older duplicates rather than deleting them.

## Verify deadlines and conflicts

Compare each deadline against the syllabus or assignment sheet. Flag conflicting dates, missing time zones, and unclear submission instructions instead of choosing one silently.

After reviewing the proposed structure, approve file changes in small batches. Recheck the indexes and deadline tracker whenever new official materials arrive.