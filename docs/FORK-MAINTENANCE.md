# Fork maintenance and upstream merge notes

This file records downstream changes that should be reviewed deliberately when merging a newer `refactoringhq/tolaria` release. It is a merge aid, not a replacement for the architectural decisions in `docs/adr/`.

## Patch register

| Patch | Base | Purpose | Primary references |
|---|---|---|---|
| `FORK-THEME-001` | `v2026-08-19` | Pluggable color and editor-font theme extensions | ADR-0178, ADR-0179, `docs/THEME-EXTENSIONS.md` |
| `FORK-UI-001` | `v2026-08-19` | Keep code-block language controls attached during zoom and scrolling | This document |

## FORK-THEME-001: extension control-color compatibility

### Status

- Updated: 2026-09-01
- Scope: renderer-only theme adapter
- Upstream area: shadcn form-control foreground inheritance
- Stable package id: `codex-rose-pine` (retained for stored-selection compatibility)
- User-facing package name: `Rosé Pine`

### Problem and downstream decision

Tolaria's `SelectTrigger`, `Input`, outline `Button`, and ghost `Button` primitives do not set a base foreground color. Their native elements therefore derive text from the official `color-scheme`. A dark extension palette used over Tolaria's Light or System-resolved-light mode can render the application dark while those native defaults stay dark, making selected values and icons unreadable.

Keep the fix inside `src/features/theme-extensions`: while `data-theme-extension` is present, `themeControlCompatibility.css` binds only those otherwise-uncolored shadcn slots to `var(--foreground)`. Explicit semantic variants such as primary, destructive, muted sidebar items, and popover options continue to own their existing colors. The official theme has no `data-theme-extension`, so its behavior remains untouched.

Do not rename the internal `codex-rose-pine` id or its JSON filename during routine cleanup. Existing installations persist that id in localStorage; only the user-facing name was changed to `Rosé Pine`.

### Touched files

- `src/features/theme-extensions/themes/codex-rose-pine.json`
- `src/features/theme-extensions/useThemeExtensionRuntime.ts`
- `src/features/theme-extensions/themeControlCompatibility.css`
- `src/features/theme-extensions/themeControlCompatibility.test.ts`
- `src/components/SettingsPanel.test.tsx`

### Upstream merge checklist

1. If upstream primitives begin setting `text-foreground` themselves, verify all extension themes in both base modes, then remove redundant selectors from the compatibility stylesheet.
2. If shadcn changes `data-slot` or `data-variant` attributes, update only this adapter stylesheet and its regression test.
3. Verify Catppuccin Frappé, Macchiato, and Mocha with Tolaria Light, Dark, and System modes; selected theme, editor font, language, date-format, note-width, import, cancel, and close controls must remain readable.
4. Preserve the `codex-rose-pine` package id unless a storage migration is added.

### Local editor-font preset additions

The downstream preset contract also includes `lxgw-wenkai` (`LXGW WenKai`) and `kaiti-sc` (`Kaiti SC`). Both resolve through the existing local-only `FontFace(..., local(...))` availability check and the single `--tolaria-editor-font-family` adapter; no font file, URL, download path, or native command was added. Keep their portable fallbacks (`Kaiti SC` / `STKaiti` / `KaiTi`) when rebasing, and preserve the preset ids because explicit user selections are stored in localStorage.

The calligraphic presets select separate extension-owned typography profiles. `lxgw-wenkai` uses `lxgw-wenkai-emphasis`: normal text remains at the editor's inherited `400`, and strong text requests weight `600`, size `1.025em`, full primary color, and restrained `0.008em` tracking. With only LXGW WenKai Regular and Medium installed, CSS font matching resolves that request to the closest available native Medium face. `kaiti-sc` uses `kaiti-readable-emphasis`: body color mixes 70% primary text with 30% heading color for theme-aware contrast, while strong text requests `600` and `1.025em`, uses the heading color, and locally enables weight synthesis when the selected Kai face has no usable bold variant. No font asset is bundled. The profiles apply their values through nine namespaced `--tolaria-editor-*` variables. `EditorTheme.css` contains the only upstream-facing seam: editor body, heading, and `strong` declarations read those variables first and retain their existing official variables as fallbacks. Switching to any other preset or custom font removes all nine overrides, so the official typography remains byte-for-byte effective when the profile is inactive.

When rebasing, preserve the nested fallback shape in `EditorTheme.css`, for example `var(--tolaria-editor-strong-font-weight, var(--inline-styles-bold-font-weight))`. Do not replace it with extension-specific BlockNote DOM selectors; the CSS-variable seam is intentionally smaller and more stable across editor upgrades.

## FORK-UI-001: editor-local code-language control layer

### Status

- Added: 2026-09-01
- Scope: renderer-only UI correctness fix
- Upstream area: BlockNote code-block language selector adaptation
- Upstream implementation observed in commit: `347936bb` (`fix: replace stale code block language picker`)
- Theme coupling: none; the fix applies to official and extension themes equally

### Problem and evidence

`CodeBlockLanguageControls` hid BlockNote's native `<select>`, measured it with `getBoundingClientRect()`, and rendered the visible shadcn control into `document.body` as `position: fixed`. This created two coordinate systems:

1. the native selector moved with `.editor-scroll-area` and root application zoom;
2. the visible control copied viewport coordinates asynchronously and was then scaled again by the zoomed root.

At 100% zoom the settled controls matched. At 110% zoom, runtime QA measured approximately 125 px horizontal and 47 px vertical displacement on the first visible block; a lower block had about 80 px vertical displacement. Scrolling changed those deltas, producing the visible floating behavior. Even at 100%, scroll-event plus `requestAnimationFrame` plus React state introduced a possible one-frame chase.

### Downstream decision

Render the shadcn pickers in one editor-local overlay layer outside the ProseMirror-owned block DOM. Each picker uses coordinates relative to `.editor__blocknote-container`; viewport measurements are converted back to local CSS coordinates with the current root zoom. Because the layer lives inside the same editor scroll tree, scrolling moves it and the native controls in one browser layout/compositor operation. The hidden native selectors continue to reserve the expected control dimensions.

The picker must not be inserted directly into the native selector's parent. ProseMirror owns that subtree and removes foreign children during DOM reconciliation, which makes a direct block-host portal disappear at runtime even though a jsdom-only test can pass.

Do not restore:

- body-level portal positioning;
- raw viewport coordinates in React state without conversion to editor-local CSS coordinates;
- document scroll listeners used only to chase the native selector;
- direct portals into ProseMirror-owned block content.

Editor-local anchoring is the invariant. Window resize, `laputa-zoom-change`, editor changes, and relevant DOM mutations may recompute local positions, but ordinary editor scrolling must not require React state updates.

### Touched files

- `src/components/codeBlockLanguageControls.tsx`
- `src/components/codeBlockLanguageControls.test.tsx`
- `src/components/EditorTheme.css`
- `tests/smoke/editor-code-block-theme.spec.ts`
- `docs/ARCHITECTURE.md`
- `docs/FORK-MAINTENANCE.md`

### Regression contract

- The visible picker is a descendant of `.editor__code-block-language-layer`, and that layer is inside `.editor__blocknote-container` but outside `.bn-editor`/ProseMirror content.
- The visible picker remains enabled/disabled according to the current editor state.
- Language changes still call `editor.updateBlock()` for the live block id.
- At 110% application zoom, before and after editor scrolling, the visible and native control origins differ by no more than 0.5 px.
- The Radix select menu may still portal globally; Tolaria's existing Radix zoom compensation owns that separate popup surface.

### Verification

Run at minimum:

```bash
pnpm exec vitest run src/components/codeBlockLanguageControls.test.tsx --maxWorkers=1
pnpm dev --port 5201
BASE_URL=http://localhost:5201 pnpm exec playwright test tests/smoke/editor-code-block-theme.spec.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Manual/native QA should open a long note containing several code blocks, set the application zoom to 110% or 125%, then scroll continuously. The language labels must remain fixed to the upper-left control row of their own blocks.

### Upstream merge checklist

1. Inspect the newer upstream versions of `codeBlockLanguageControls.tsx` and the code-block rules in `EditorTheme.css` before resolving conflicts.
2. If upstream still portals the visible picker to `document.body`, retain or reapply `FORK-UI-001` and run the regression contract above.
3. If upstream now renders a working interactive selector directly inside each code block, run the tests against the upstream implementation. Remove this patch only when local anchoring and editable/read-only transitions remain covered.
4. If BlockNote changes the native selector DOM shape, update `NATIVE_LANGUAGE_CONTROL_SELECTOR` and the editor-root lookup together; do not fall back to viewport polling.
5. Confirm the global Radix popup zoom compensation remains separate from the editor-local trigger positioning.
6. Record the upstream version, conflict resolution, and test result in this section or add a successor patch entry.

### Removal criteria

This patch can be removed when upstream provides an equivalent scroll-local interactive picker, or removes the stale-selector workaround entirely, while satisfying every item in the regression contract.
