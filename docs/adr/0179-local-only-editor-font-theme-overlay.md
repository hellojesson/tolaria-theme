---
type: ADR
id: "0179"
title: "Local-only editor font preferences in the theme overlay"
status: active
date: 2026-08-31
supersedes: "0178"
---

## Context

ADR-0178 introduced installable theme extensions as a downstream, installation-local color overlay. Its initial contract rejected typography so imported themes could not depend on external resources or the editor DOM. Chinese-heavy users need an explicit choice among macOS system typography, PingFang SC, Source Han Sans SC, and Source Han Serif SC without increasing the application bundle or weakening the theme boundary.

The integration must remain portable across upstream Tolaria updates. It must preserve the official Light, Dark, and System modes, accept existing color-only theme packages, avoid font downloads, and fall back safely when a named local font is unavailable.

## Decision

**Theme extensions remain a constrained semantic overlay, with an optional local-only editor-font preset layered through one app-owned CSS custom property.**

1. The official `theme_mode` setting continues to own resolved Light, Dark, and System behavior. Extension color variants still apply only after that mode resolves.
2. Theme package schema version 1 gains an additive optional `typography.editorFontPreset` field. The value must be one of `system`, `pingfang-sc`, `source-han-sans-sc`, or `source-han-serif-sc`; arbitrary CSS, URLs, font bytes, and font-family strings remain invalid.
3. Existing color-only packages stay valid. Older Tolaria builds can ignore the optional top-level typography field and still apply both color variants.
4. The rich editor's existing `--editor-font-family` value delegates to `--tolaria-editor-font-family` with the corrected bundled `Inter Variable` stack as its fallback. Theme code therefore does not import or depend on BlockNote components.
5. The installation-local preference is stored under namespaced `tolaria.theme-extension.editor-font.*.v1` localStorage keys. An explicit user choice overrides the selected theme's recommendation; `follow-theme` restores the recommendation or the official fallback.
6. A custom choice stores only a validated local font family name. Font names are length- and character-bounded before being quoted into a CSS family stack.
7. Availability checks use the browser `FontFace` API with `local(...)`. They never fetch, install, copy, or embed a font. Missing fonts render through explicit system fallbacks.
8. The three bundled themes recommend Source Han Serif SC, Source Han Sans SC, and PingFang SC respectively. Recommendations are independent of light/dark variants because glyph selection does not alter the official mode contract.

## Alternatives considered

- **Bundle CJK WOFF2 files:** deterministic across machines, but materially increases application size and conflicts with the local-only requirement.
- **Accept arbitrary theme font-family strings:** more flexible, but widens the imported theme language and makes validation and long-term compatibility harder.
- **Add font fields to Rust `Settings`:** central persistence, but couples the downstream feature to upstream settings migrations and native serialization.
- **Set BlockNote component styles directly:** quick to implement, but depends on editor component structure and raises the cost of upstream merges.

## Consequences

- Official typography remains unchanged until a user selects a preset or follows a theme with a recommendation.
- Theme packages cannot distribute fonts; appearance depends on fonts already installed on the current machine and therefore remains installation-local.
- Upstream integration stays limited to the existing startup/runtime call, one CSS-variable fallback in `theme.json`, and one Settings row.
- Future local-font presets can be added to the shared allowlist without changing editor components or the native import command.
