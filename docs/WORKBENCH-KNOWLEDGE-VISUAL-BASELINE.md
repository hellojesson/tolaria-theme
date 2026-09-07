# Workbench Knowledge visual baseline

Status: **Accepted**  
Accepted on: 2026-09-03  
Applies to: `command-center` → `knowledge`, template schema `1`

Implementation status: realigned on 2026-09-03 after a visual-parity correction.

The accepted static reference is
[`workbench/command-center-knowledge-v1-visual-baseline.html`](workbench/command-center-knowledge-v1-visual-baseline.html).
It is additive and does not modify the accepted Command Center v1 Focus baseline.
Its SHA-256 digest at acceptance is:

```text
6257e64b7f797b8dd271ce974ab5574e9f85bdeaad8078c8442d07d00ee9a9e6
```

## Required composition

1. Retain the accepted greeting, local date, daily-context modules, motivational
   sentence, and prominent three-view navigation.
2. Use the existing manifest hierarchy without adding another widget:
   - `knowledge-map`: a Type-centered constellation and selected-Type inspector;
   - `knowledge-stream`: recently changed notes that already contain links or
     structured relationships;
   - `quick-portals`: existing Types, folders, and saved views.
3. Place relationship health beside the constellation as part of `knowledge-map`,
   rather than registering a new standalone dashboard widget.
4. Keep navigation read-only and route every note, Type, folder, and view through the
   existing workbench navigation adapter.

## Data feasibility

The production implementation uses only the feature-owned read-only `WorkbenchModel`:

- node labels, sizes, and per-Type connection coverage: `knowledgeClusters`;
- knowledge stream: `knowledgeStreamEntries`;
- quick destinations: `typeSummaries`, `folderSummaries`, and `savedViewSummaries`;
- relationship totals: `relationshipSummary`;
- isolated-note count: `summary.noteCount - relationshipSummary.linkedEntryCount`.

Constellation lines represent the navigation hierarchy from the whole vault to each
Type. They do not claim inferred semantic similarity or Type-to-Type relationships.
That distinction must remain visible in the legend.

## Deliberate limits

- No force-directed graph, canvas dependency, physics simulation, or drag-and-drop.
- No AI clustering, generated labels, semantic embeddings, or network request.
- No new scan, database, Rust command, or persisted graph cache.
- No workbench-specific color palette; production consumes Tolaria semantic tokens.
- Illustrative values in the proposal are not production defaults.

## Change control

The Type-centered constellation is the dominant Knowledge view. Connection overview and
recent knowledge flow occupy the secondary column, followed by full-width Type, folder,
and saved-view portals. Material hierarchy or interaction changes require another
versioned proposal and explicit product-owner acceptance.

## Implementation invariants

The production constellation must preserve these visual contracts at desktop
sizes:

- the constellation stage owns a visible 28 px semantic-token grid, independent
  from the quieter 40 px workbench background grid;
- the center node and up to six Type nodes render inside a node-only field above
  the inspector, so no node can be cropped by the stage or obscured by the
  inspector;
- six available Type clusters occupy six stable constellation slots and remain
  fully enclosed by their circular controls;
- the node field keeps the two orbital rings, hierarchy paths, center glow, and
  selected-node emphasis from the accepted static reference;
- the Knowledge header uses the `KNOWLEDGE SIGNAL / 02` context marker while the
  Focus header retains its existing mode description.

The 2026-09-03 parity correction addressed a missing stage grid, unsafe
percentage positions, equal-sized nodes touching the inspector, and generic
header context. Browser QA now checks the target 2022 × 1280 viewport in both
theme modes and verifies that all seven rendered circles (one center plus six
Types) stay within the node field.
