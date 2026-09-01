import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const compatibilityCss = readFileSync(
  'src/features/theme-extensions/themeControlCompatibility.css',
  'utf8',
).replace(/\s+/gu, ' ')

describe('theme extension control compatibility', () => {
  it('keeps inherited control values readable while an extension theme is active', () => {
    expect(compatibilityCss).toContain(
      ':root[data-theme-extension] [data-slot="select-trigger"]',
    )
    expect(compatibilityCss).toContain(
      ':root[data-theme-extension] [data-slot="input"]',
    )
    expect(compatibilityCss).toContain(
      ':root[data-theme-extension] [data-slot="button"][data-variant="outline"]',
    )
    expect(compatibilityCss).toContain(
      ':root[data-theme-extension] [data-slot="button"][data-variant="ghost"]',
    )
    expect(compatibilityCss).toContain('color: var(--foreground);')
  })
})
