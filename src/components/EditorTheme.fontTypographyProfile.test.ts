import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const editorThemeCss = readFileSync(
  'src/components/EditorTheme.css',
  'utf8',
).replace(/\s+/gu, ' ')

describe('editor font typography profile adapters', () => {
  it('lets local-font profiles improve body contrast with an official fallback', () => {
    expect(editorThemeCss).toContain(
      'color: var(--tolaria-editor-body-color, var(--colors-text));',
    )
  })

  it('lets calligraphic presets soften every heading without replacing official defaults', () => {
    expect(editorThemeCss.match(
      /font-weight: var\(--tolaria-editor-heading-font-weight, var\(--headings-h[1-4]-font-weight\)\);/gu,
    )).toHaveLength(4)
    expect(editorThemeCss.match(
      /color: var\(--tolaria-editor-heading-color, var\(--headings-h[1-4]-color\)\);/gu,
    )).toHaveLength(4)
    expect(editorThemeCss.match(
      /letter-spacing: var\(--tolaria-editor-heading-letter-spacing, var\(--headings-h[1-4]-letter-spacing\)\);/gu,
    )).toHaveLength(4)
  })

  it('lets calligraphic presets soften strong text with official fallbacks', () => {
    expect(editorThemeCss).toContain(
      'font-weight: var(--tolaria-editor-strong-font-weight, var(--inline-styles-bold-font-weight));',
    )
    expect(editorThemeCss).toContain(
      'font-size: var(--tolaria-editor-strong-font-size, inherit);',
    )
    expect(editorThemeCss).toContain(
      'font-synthesis: var(--tolaria-editor-strong-font-synthesis, inherit);',
    )
    expect(editorThemeCss).toContain(
      'color: var(--tolaria-editor-strong-color, var(--inline-styles-bold-color));',
    )
    expect(editorThemeCss).toContain(
      'letter-spacing: var(--tolaria-editor-strong-letter-spacing, normal);',
    )
  })
})
