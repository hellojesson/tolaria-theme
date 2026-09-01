import { describe, expect, it } from 'vitest'
import { BUILT_IN_THEME_PACKAGES } from './builtInThemes'
import { parseThemePackage } from './themePackage'

describe('theme typography contract', () => {
  it('accepts a local editor font preset as an optional additive field', () => {
    const theme = {
      ...BUILT_IN_THEME_PACKAGES[0],
      typography: { editorFontPreset: 'lxgw-wenkai' },
    }

    expect(parseThemePackage(theme)).toEqual(theme)
  })

  it('rejects arbitrary font declarations and unknown typography fields', () => {
    const theme = BUILT_IN_THEME_PACKAGES[0]

    expect(() => parseThemePackage({
      ...theme,
      typography: { editorFontPreset: 'url(https://example.com/font.woff2)' },
    })).toThrow(/font preset/i)

    expect(() => parseThemePackage({
      ...theme,
      typography: { editorFontPreset: 'system', remoteFontUrl: 'https://example.com/font.woff2' },
    })).toThrow(/typography field/i)
  })

  it('gives every bundled extension a portable local-font recommendation', () => {
    expect(BUILT_IN_THEME_PACKAGES.map((theme) => theme.typography?.editorFontPreset)).toEqual([
      'source-han-serif-sc',
      'source-han-sans-sc',
      'pingfang-sc',
      'source-han-sans-sc',
      'source-han-sans-sc',
      'source-han-sans-sc',
      'source-han-sans-sc',
    ])
  })
})
