# Workbench Projects visual baseline

Status: **Accepted**  
Accepted on: 2026-09-03  
Applies to: `command-center` → `projects`, template schema `1`

The proposed static reference is
[`workbench/command-center-projects-v1-visual-baseline.html`](workbench/command-center-projects-v1-visual-baseline.html).
It is additive and does not modify either accepted Focus or Knowledge visual baseline.
Its SHA-256 digest at acceptance is:

```text
03bea791baa513236eab77f02b7b2ab83cad45698e83838a6e4e3721223989d0
```

This document is the implementation contract for the Command Center Projects view.

Implementation status: React view aligned on 2026-09-03.

## Accepted composition

1. Retain the accepted greeting, local date, daily-context modules, motivational
   sentence, prominent three-view navigation, source marker, and Tolaria StatusBar.
2. Use only the three widgets already registered for the Projects view:
   - `project-lanes`: the dominant Project Execution Board, with three leading real status
     groups and a selected-note inspector;
   - `action-queue`: a bounded next-action list built from recently modified notes that
     already carry a meaningful status;
   - `daily-pulse`: the full-width Project Signal Stream ordered by note modification
     time.
3. Keep the status-distribution ring inside `project-lanes` as a compact execution
   summary. It is not a separately registered widget.
4. Route every project card, queue item, and timeline item through the existing
   workbench note-navigation adapter.

## Data feasibility

The production implementation can use the existing read-only `WorkbenchModel` without
adding a command, data store, or application-state dependency:

- lane names, counts, and entries: `statusGroups`;
- action queue: `actionableEntries`;
- recent project signal stream: the status-bearing subset of `recentEntries` or the
  already bounded `actionableEntries`, ordered by `modifiedAt`;
- selected-note title, original status, modification time, Type, and connection count:
  existing `VaultEntry` fields;
- total status-note count and ring segments: the sum of displayed `statusGroups` counts.

The three labels and values shown in the proposal are illustrative. Production keeps the
user's original status strings and must not translate them into a fixed workflow such as
To do / Doing / Done. The first three deterministic status groups populate the visual
lanes; the queue remains capable of exposing recent entries from other status groups.

## Data-integrity rules

- Never infer completion percentage, delivery confidence, project health, urgency,
  productivity, or blocker severity from a status string.
- The ring visualizes only the relative counts of the displayed real status groups.
- “Next step” copy may only use an existing note title or structured field. When no
  explicit next-step field exists, show the note title and original status rather than
  generating prose.
- A note is not treated as a project merely because its status resembles a project
  status. Phase one displays status-bearing notes and keeps their real Type visible.
- Illustrative note titles, counts, dates, and statuses in the static reference are not
  production defaults.

## Interaction contract

1. Selecting a card updates one compact inspector; it does not open or mutate the note.
2. “Open note” and list/timeline activation close the workbench first and then use the
   canonical Tolaria note navigation callback.
3. Switching to Focus or Knowledge uses the existing internal-view controller.
4. All surfaces remain read-only. No drag-and-drop, inline status editing, or project
   creation is introduced in phase one.
5. Keyboard focus follows the document order: primary views, lanes, inspector action,
   action queue, then signal stream.

## Visual invariants

- The Project Execution Board is the dominant desktop surface and keeps a visible 28 px
  semantic-token grid, a quiet signal rail, three status lanes, and one inspector.
- The greeting and three large internal-view tabs remain more prominent than local
  project controls.
- Lane count, card status, and selected inspector use the same source value; color is
  never the sole status indicator.
- Execution Pulse and Next Step Queue form the secondary column; the Project Signal
  Stream spans the full content width below them.
- Styling consumes Tolaria semantic tokens. Light, Dark, System, and extension themes
  remain the only color authority.

## Responsive interpretation

At medium widths, the secondary panels become a two-column row beneath the Project
Execution Board.
At narrow widths, all regions stack in this order: greeting and daily context, primary
navigation, Project Execution Board, Execution Pulse, Next Step Queue, Project Signal
Stream. The
three status lanes become a vertical sequence; cards, inspector values, and navigation
targets must not be clipped or hidden.

## Deliberate limits

- No Kanban drag-and-drop, sortable dependency, editable status, or persisted layout.
- No Gantt chart, deadline inference, calendar integration, AI summary, or network call.
- No new Rust command, scan, index, cache, or project-specific data model.
- No workbench-specific theme palette and no branching on extension-theme ids.
- No new official application-state owner, renderer palette, or native integration.

## Change control

This reference is implemented as the Projects view inside the existing
Command Center template boundary. Material changes to the greeting hierarchy, primary
navigation, Project Execution Board dominance, status-integrity rules, or responsive reading order
require a new versioned proposal and explicit product-owner acceptance.
