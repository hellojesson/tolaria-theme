---
type: ADR
id: "0180"
title: "Pluggable renderer-only workbench template shell"
status: accepted
date: 2026-09-02
---

## Context

Tolaria exposes notes through a four-panel renderer shell backed by an already-loaded
`VaultEntry[]` graph, saved views, folder trees, and canonical selection/navigation
callbacks. A user-facing workbench should summarize and navigate that graph through
role-oriented layouts without replacing the official note workflow.

The downstream implementation must remain inexpensive to rebase over upstream Tolaria.
It also needs to leave room for additional professional templates and later constrained
component customization. Copying the sidebar/editor shell, adding another vault scan,
placing workbench fields in note frontmatter, or baking palette colors into each layout
would create competing sources of truth and a wide merge surface.

## Decision

**Introduce the workbench as a renderer-only feature with a versioned template registry,
a read-only data adapter, and one narrow host seam in the existing application shell.**

1. The first registered template is `command-center` (Intelligent Command Center),
   schema version 1. Its `focus`, `knowledge`, and `projects` screens are internal views,
   not separate templates.
2. Tolaria keeps the official Sidebar and StatusBar mounted. Opening the workbench
   replaces only the NoteList/PulseView plus Editor region. Closing restores those
   official surfaces without changing their selection, tabs, or navigation history.
3. The status-bar entry is a global action immediately before Contribute in the
   bottom-right secondary group. It uses existing shadcn/button, tooltip, localization,
   and compact-status behavior.
4. Templates receive a bounded, deterministic model derived from the existing
   `VaultEntry[]`, `ViewFile[]`, and `FolderNode[]`. The adapter reuses canonical
   collection/filter utilities and performs no IPC, filesystem scan, note-body load, or
   write.
5. Templates navigate only through host-provided `openSelection`, `openEntry`, and
   `close` callbacks. They do not import application state owners or mutate tabs.
6. Template definitions have stable template, internal-view, and widget ids plus an
   immutable default placement manifest. Phase one does not expose layout editing.
7. Template selection and the last internal view use a validated namespaced renderer
   preference, `tolaria.workbench.preferences.v1`. Open/closed state is transient and
   starts closed. No phase-one field is added to Rust Settings, VaultConfig, or vault
   content.
8. Templates use only Tolaria semantic CSS tokens. Official Light, Dark, and System
   modes and the selected theme extension remain the sole color authorities.
9. Phase one makes no automatic AI/model request. Summary text is generated locally
   from metadata. AI-assisted briefings require a later decision with explicit privacy,
   cost, failure, and offline behavior.
10. Future customization, if justified by usage, is constrained to template-declared
    reorder, visibility, and bounded sizing with a restore-default action. Arbitrary
    canvas positioning and executable template code are excluded.

## Alternatives considered

- **Duplicate a complete dashboard shell:** offers total layout freedom, but duplicates
  Sidebar and navigation behavior and would drift after upstream changes.
- **Add Workbench as a Sidebar selection kind:** reuses navigation state, but incorrectly
  models an application-level surface as a vault collection and widens every exhaustive
  `SidebarSelection` switch.
- **Open a dedicated native window:** isolates the feature, but duplicates context
  transfer and window lifecycle work while weakening direct navigation back into notes.
- **Persist settings in the native Settings structure:** centralizes configuration, but
  widens Rust serialization, mock handlers, migrations, and upstream settings code for
  a downstream renderer-only preference.
- **Allow free-form drag-and-drop in the first release:** maximizes flexibility, but adds
  responsive-layout, collision, persistence, migration, accessibility, and dependency
  cost before usage demonstrates value.
- **Give templates their own palettes:** makes each template visually self-contained,
  but conflicts with Tolaria's semantic theme contract and the extension theme work.

## Consequences

- The upstream-facing implementation is limited primarily to `App.tsx`, StatusBar prop
  forwarding/order, one Settings Appearance row, and localization catalogs.
- Workbench templates remain independently testable and cannot become a second source of
  vault truth.
- Existing theme extensions recolor the workbench automatically without template-specific
  integration.
- The first release is intentionally fixed-layout, while stable widget placement metadata
  provides a compatible base for later constrained overrides.
- A renderer localStorage preference is not synchronized between installations. The
  storage scope for future user-authored layouts remains an explicit phase-two decision.
- The static prototype's example labels must be replaced by data-derived values and safe
  empty states during implementation.

## Follow-up

Implementation details, contracts, target file structure, tests, and upstream merge
checks are maintained in `docs/WORKBENCH-TEMPLATES.md`.
