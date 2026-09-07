# Workbench visual baseline

Status: **Accepted**  
Accepted on: 2026-09-03  
Applies to: `command-center`, template schema `1`  
Baseline version: `1.0`

Implementation status: Focus, Knowledge, and Projects views aligned on 2026-09-03.

The accepted compact shared-header contract is recorded in
[`WORKBENCH-HEADER-VISUAL-BASELINE.md`](WORKBENCH-HEADER-VISUAL-BASELINE.md).
It changes only the header composition; all three page layouts remain frozen.

The accepted interactive reference is
[`workbench/command-center-v1-visual-baseline.html`](workbench/command-center-v1-visual-baseline.html).
Its SHA-256 digest at acceptance is:

```text
7e3e9b3b9eb8b9ac1fa098ce8befb1ac6e2a9c84de7b5004d020a9ec3719453e
```

This document is the visual acceptance contract for the first Intelligent Command
Center implementation. ADR-0180 and `WORKBENCH-TEMPLATES.md` remain authoritative for
architecture and behavior; this baseline is authoritative for information hierarchy,
layout intent, visual rhythm, and primary interaction prominence.

The accepted supplemental Knowledge-view contract is recorded in
[`WORKBENCH-KNOWLEDGE-VISUAL-BASELINE.md`](WORKBENCH-KNOWLEDGE-VISUAL-BASELINE.md).
The accepted supplemental Projects-view contract is recorded in
[`WORKBENCH-PROJECTS-VISUAL-BASELINE.md`](WORKBENCH-PROJECTS-VISUAL-BASELINE.md).
The accepted supplemental Focus-card contract is recorded in
[`WORKBENCH-FOCUS-VISUAL-BASELINE.md`](WORKBENCH-FOCUS-VISUAL-BASELINE.md).

## Required composition

1. The opening area presents a time-aware personal greeting, the local date, and a
   concise description of the daily situation before operational content.
2. The three frequent internal views — Focus, Knowledge, and Projects — use a prominent
   full-width primary navigation row below the greeting. Each destination exposes both
   its numbered name and a short purpose description.
3. The Focus view preserves this hierarchy:
   - local context brief and its next action;
   - transparent daily pulse counts;
   - recent notes;
   - quick destinations derived from existing views, Types, and folders.
4. Weather and almanac are optional daily-context modules with explicit unavailable and
   offline states. Their absence must not leave an empty structural hole.
5. The motivational sentence is lightweight local content. It refreshes when entering
   the workbench and supports an explicit refresh action without requiring a model or
   network request.
6. The official Sidebar and StatusBar remain the surrounding application navigation.
   Closing the workbench restores Tolaria's existing note surface.
7. Template styling consumes Tolaria semantic tokens. The active Light, Dark, System,
   or extension theme remains the only color authority.

## Responsive interpretation

The baseline is a composition contract rather than a fixed-pixel screenshot. A compliant
implementation may stack columns, wrap navigation, reduce ornamental graphics, and
shorten secondary copy as the window narrows. It must preserve reading order, card
priority, accessible target sizes, and the visibility of all three primary views.

At narrow widths, the required order is greeting and daily context, primary navigation,
context brief, daily pulse, recent notes, and quick destinations. Responsive adaptation
must not demote frequent navigation to a small top-right segmented control.

## Data integrity rules

- Counts, note titles, collection names, dates, and statuses come from the read-only
  workbench model; illustrative values in the baseline are not production defaults.
- Do not invent qualitative productivity or AI scores. Every visualized value must have
  an understandable source.
- Empty and loading states retain the same hierarchy and explain the Tolaria source that
  would populate the region.
- Daily-context integrations must not delay or block the local workbench surface.

## Prohibited drift

Implementation must not, without a newly approved baseline:

- move the three primary views into a compact or low-discoverability top-right control;
- remove the greeting, date, or daily-situation layer;
- replace the accepted first-screen hierarchy with a generic statistics-card grid;
- introduce a workbench-specific palette or branch on extension-theme ids;
- duplicate Tolaria's Sidebar, StatusBar, note list, editor, or navigation state;
- add filler metrics, fake AI conclusions, or unrelated widgets to increase visual density.

## Review checkpoints

Visual review is required at narrow, normal, and wide desktop widths, at 100%, 110%, and
125% application zoom, and in resolved light and dark modes. Review must cover the
official themes plus every bundled theme extension. Keyboard focus, reduced motion,
empty/loading states, and long localized labels are part of acceptance.

## Change control

Do not overwrite this accepted reference for design experiments. Any material change to
the required composition or hierarchy needs a new versioned reference, a short rationale,
and explicit product-owner acceptance. Implementation corrections that merely improve
responsive fit or accessibility may retain version `1.0` when they do not change the
contract above.
