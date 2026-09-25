---
name: Build an exam study system
tagline: Turn course materials into a reusable plan and practice set.
summary: Use ChatGPT with learning objectives, notes, readings, problem sets,
  prior quizzes, exam guidance, and available time to create a study guide,
  concept map, practice schedule, question bank, and progress tracker.
skills:
  - token: $documents
    description: Create the study guide, concept map, and source-linked practice materials.
  - token: $spreadsheets
    description: Build a study schedule and progress tracker.
bestFor:
  - Students preparing for an exam from several official course sources.
  - Study plans that need spaced practice rather than a one-time summary.
  - Practice questions whose coverage must stay grounded in course materials.
starterPrompt:
  title: Build My Exam Study System
  body: >-
    Build a two-week study system for [course and exam] using the official
    learning objectives, lecture notes, readings, problem sets, prior quizzes,
    and my available study time.


    Create:

    - a concept map

    - a concise study guide

    - a spaced-practice calendar

    - a question bank

    - answer explanations

    - a progress tracker


    Cite the course source for major concepts and do not invent exam coverage.
    Mark uncertain or missing coverage for me to confirm.
  suggestedEffort: medium
relatedLinks:
  - label: Plugins
    url: /codex/plugins
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Define the exam scope

Start with official learning objectives, instructor guidance, lecture notes, readings, problem sets, and prior quizzes. Add the time you have available and any topics you already know need work.

Ask ChatGPT to map each planned topic to a course source. If coverage is unclear, keep it as a question instead of treating it as exam content.

## Create several study modes

Use the starter prompt to produce complementary artifacts:

1. A concept map that shows relationships.
2. A concise guide for review.
3. A spaced-practice calendar.
4. A question bank across recall, explanation, and application.
5. Answer explanations tied to course sources.
6. A progress tracker for topics and practice results.

Mixing formats makes it easier to identify gaps than repeatedly rereading one summary.

## Review and adapt

Check questions and explanations against the official materials. Remove invented topics, ambiguous answer keys, and unsupported claims.

After each study session, update the tracker and ask ChatGPT to revise the next sessions around observed gaps. Keep graded assessments and any restricted course material within the rules set by the instructor.