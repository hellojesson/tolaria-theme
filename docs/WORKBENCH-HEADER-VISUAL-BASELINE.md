# Workbench compact header visual baseline

Status: **Accepted**  
Accepted on: 2026-09-04  
Applies to: `command-center` shared header, template schema `1`

The accepted interactive reference is
[`workbench/command-center-compact-header-v1-visual-baseline.html`](workbench/command-center-compact-header-v1-visual-baseline.html).
Its SHA-256 digest at acceptance is:

```text
4593ef4d986829cc974243f3ecf3e115f3d41a592267d116e367cca2a23d4746
```

This supplemental baseline replaces only the shared Command Center header layout.
The accepted Focus, Knowledge, and Projects page compositions remain unchanged.

## Required composition

1. Keep the brand and close action on the first compact row.
2. Keep the time-aware greeting and local date on the left of the context row.
3. Present Weather, Almanac, and Today's Thought as one horizontal context rail at
   normal desktop widths. The quote keeps its local refresh action.
4. Keep Focus, Knowledge, and Projects as three prominent, equal-width destinations,
   while reducing their vertical padding. Every destination retains its number, name,
   and purpose description.
5. Keep the current-mode or view-signal label and source description in the final quiet
   status row.
6. Use an opaque semantic `background` surface for the shared header. The header must
   not expose or create a grid pattern; grid ornament belongs to the page region below.
7. Align the visible left and right edges of the header navigation and status row with
   the active page's `90rem` content grid at wide desktop widths.

## Accepted refinement

The product owner approved three non-structural refinements on 2026-09-04:

- align the header and page content edges;
- keep the selected destination's soft fill and two-pixel bottom indicator while
  removing its redundant colored outline;
- soften internal context-rail dividers and give the quote refresh action a semantic
  primary-color hover response.

These refinements do not reopen or alter any page composition.

The product owner also approved a dark-surface legibility refinement on
2026-09-04. Navigation destinations retain the same structure and compact footprint,
but use a `44px` minimum pointer target, a stronger semantic card surface, subtly
visible inactive segments, and a higher-contrast selected fill. All values continue to
derive from Tolaria semantic theme tokens; this is not a theme-id-specific override.

## Responsive interpretation

- At medium widths, greeting and context rail may form two rows. Weather and Almanac
  remain peers, with Today's Thought spanning the available width beneath them.
- At narrow widths, the three context items and the three navigation destinations may
  stack. Reading order and all existing actions remain unchanged.
- Compactness must not reduce keyboard focus visibility, accessible names, or practical
  pointer target size.

## Frozen page boundary

This baseline authorizes changes only to `CommandCenterHeader` and its local
`DailyContext` presentation. It does not authorize changes to:

- Focus cards, Daily Brief, Daily Pulse, Recent Notes, or Quick Portals;
- Knowledge Constellation, Relationship Health, Knowledge Stream, or Knowledge Portals;
- Project Execution Board, Execution Pulse, Next Step Queue, or Project Signal Stream;
- workbench data models, navigation adapters, persistence, or template registration.

## Theme contract

All colors, borders, shadows, and active states consume Tolaria semantic tokens. Light,
Dark, System, and installed extension themes remain the only color authority. No header
palette or theme-id branch may be introduced.

## Change control

Material changes to this hierarchy, the horizontal context rail, navigation prominence,
or the no-grid header rule require a new versioned reference and explicit product-owner
acceptance.
