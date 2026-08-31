---
type: ADR
id: "0178"
title: "Pluggable theme extensions over resolved app modes"
status: active
date: 2026-08-28
---

## Context

ADR-0081 and ADR-0112 define an app-owned semantic color contract and keep `data-theme` resolved to `light` or `dark`, including when the stored preference is System. Tolaria now needs installable visual themes without restoring the removed vault-authored CSS system or coupling third-party theme state to the upstream settings model.

The extension must remain easy to carry across upstream Tolaria updates. It must not execute theme code, accept arbitrary CSS, change vault content, or replace the official Light, Dark, and System behavior.

## Decision

**Theme extensions are a narrow, installation-local overlay on Tolaria's resolved semantic color tokens.**

1. The official `theme_mode` setting remains the only source for Light, Dark, and System. It resolves first and continues to own `data-theme` and the shadcn `.dark` class.
2. A versioned JSON theme package supplies both `light` and `dark` token variants. The extension runtime selects the variant matching the resolved official mode.
3. Imported packages may set only an explicit allowlist of semantic color tokens and only six- or eight-digit hexadecimal colors. CSS selectors, URLs, scripts, fonts, layout values, and arbitrary properties are rejected.
4. Extension selection and imported packages use namespaced localStorage keys. They do not widen Rust `Settings`, change a vault, or enter Git synchronization.
5. Startup applies the stored overlay immediately after the official pre-React theme mode. `useThemeExtensionRuntime` reapplies it when System or the explicit base mode resolves differently and propagates changes to secondary windows.
6. The native file boundary reads only regular UTF-8 `.json` files no larger than 128 KB and performs a coarse schema check. The renderer then performs the complete token validation.
7. Missing, corrupt, or removed extensions fall back to the official theme and clear every extension-owned inline token.

Three portable JSON packages ship initially: Codex Rosé Pine, Nord, and Blue Topaz. Each contains independent light and dark variants. Their palette attributions remain next to the extension implementation.

## Alternatives considered

- **Add custom themes to the upstream `Settings` model**: centralizes persistence, but widens frontend, Rust, migration, and synchronization surfaces for a downstream feature.
- **Load arbitrary CSS files**: maximally flexible, but exposes the entire DOM contract, permits remote resource loading, and is brittle across upstream markup changes.
- **Encode every custom theme in `src/index.css`**: simple at runtime, but couples each extension to the official stylesheet and makes installation impossible without rebuilding CSS.
- **Replace `data-theme` with custom theme ids**: breaks the stable resolved light/dark contract used by shadcn, Tailwind, editor integrations, and System mode.

## Consequences

- Upstream theme-mode work remains authoritative; the downstream integration surface is one startup call, one runtime hook, one Settings component, and one bounded native read command.
- Theme authors can change colors but cannot change typography, spacing, component structure, or behavior in schema version 1.
- Imported packages are local to the WebView installation. Clearing application storage removes them.
- A future schema can add safe tokens deliberately, but existing packages remain versioned and fail closed when unsupported.
