import { describe, expect, it } from 'vitest'
import { BUILT_IN_THEME_PACKAGES } from './builtInThemes'
import { parseThemePackage } from './themePackage'

const CATPPUCCIN_THEME_IDS = [
  'catppuccin-latte',
  'catppuccin-frappe',
  'catppuccin-macchiato',
  'catppuccin-mocha',
] as const

describe('Catppuccin theme packages', () => {
  it('ships all four official flavors as independent theme packages', () => {
    const themes = CATPPUCCIN_THEME_IDS.map((id) => (
      BUILT_IN_THEME_PACKAGES.find((theme) => theme.id === id)
    ))

    expect(themes.every(Boolean)).toBe(true)
    for (const theme of themes) {
      expect(parseThemePackage(theme)).toBe(theme)
      expect(theme?.typography?.editorFontPreset).toBe('source-han-sans-sc')
    }
  })

  it('preserves each official flavor while deepening its background in dark mode', () => {
    const expectedColors = {
      'catppuccin-latte': ['#EFF1F5', '#E6E9EF', '#4C4F69', '#1E66F5'],
      'catppuccin-frappe': ['#303446', '#292C3C', '#C6D0F5', '#8CAAEE'],
      'catppuccin-macchiato': ['#24273A', '#1E2030', '#CAD3F5', '#8AADF4'],
      'catppuccin-mocha': ['#1E1E2E', '#181825', '#CDD6F4', '#89B4FA'],
    } as const

    for (const [id, [base, deepBase, text, blue]] of Object.entries(expectedColors)) {
      const theme = BUILT_IN_THEME_PACKAGES.find((candidate) => candidate.id === id)
      expect(theme?.variants.light['--surface-app']).toBe(base)
      expect(theme?.variants.dark['--surface-app']).toBe(deepBase)
      expect(theme?.variants.light['--text-primary']).toBe(text)
      expect(theme?.variants.dark['--text-primary']).toBe(text)
      expect(theme?.variants.light['--accent-blue']).toBe(blue)
      expect(theme?.variants.dark['--accent-blue']).toBe(blue)
    }
  })
})
