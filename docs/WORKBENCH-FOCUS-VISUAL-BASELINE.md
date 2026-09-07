# Workbench Focus visual baseline

Status: **Accepted**  
Accepted on: 2026-09-07  
Applies to: `command-center` Focus view, schema `1`  
Baseline version: `focus-v7-compact`

The accepted interactive reference is
[`workbench/command-center-focus-orbit-pulse-v7-compact-preview.html`](workbench/command-center-focus-orbit-pulse-v7-compact-preview.html).
Its SHA-256 digest at acceptance is:

```text
315a982d8d1ad3704e0ae1293a3055ba0d7d74665b21ba68c3f121b31d22f2c0
```

This supplemental contract freezes only the first Focus card and the adjacent
Daily Pulse card. The shared header, Recent Notes, Quick Portals, Knowledge view,
and Projects view remain governed by their existing accepted baselines and must
not change as part of this implementation.

## Locked desktop composition

- Keep the two cards in the established wide-screen split with a `20px` gap.
- Both cards are exactly `368px` high at the desktop breakpoint and remain equal
  height without internal overflow.
- The first card preserves the V7 information order: local-summary header, live
  status, priority title and evidence, factual metrics, primary and secondary
  actions, orbit signal, evidence rows, and the compact single-row rationale.
- Daily Pulse preserves the V7 information order: title and live state, radar
  indicator, three factual metrics, and the compact read-only snapshot footer.
- Narrow layouts may stack the cards, but must preserve their reading order and
  must not hide actions, evidence, or pulse metrics.

## Visual and data rules

- Use Tolaria semantic theme tokens only; Light, Dark, System, and extension
  themes remain the color authority.
- Orbit and pulse motion stays decorative, slow, and disabled by the user's
  reduced-motion preference.
- Titles, statuses, timestamps, relationship counts, and vault totals come from
  the read-only workbench model. Do not introduce inferred productivity scores.
- Existing navigation adapters remain the only route back into Tolaria notes and
  collections.

## Prohibited drift

Without a newly accepted baseline, do not alter the header, lower Focus cards,
Knowledge view, or Projects view; change the two-card height or spacing; replace
the orbit/radar language; add a workbench-specific palette; or invent metrics to
fill visual space.
