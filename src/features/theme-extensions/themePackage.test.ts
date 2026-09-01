import { describe, expect, it } from 'vitest'
import { BUILT_IN_THEME_PACKAGES } from './builtInThemes'
import { parseThemePackage } from './themePackage'

const validPackage = {
  schemaVersion: 1,
  id: 'example.theme',
  name: 'Example Theme',
  author: 'Example Author',
  variants: {
    light: {
      '--surface-app': '#fffaf0',
      '--surface-sidebar': '#f4ead8',
      '--surface-editor': '#fffaf0',
      '--text-primary': '#2d251f',
      '--text-secondary': '#75675c',
      '--border-default': '#dfd1c1',
      '--accent-blue': '#4b6bfb',
      '--accent-blue-hover': '#3653d8',
      '--accent-blue-light': '#4b6bfb1f',
    },
    dark: {
      '--surface-app': '#191724',
      '--surface-sidebar': '#15131f',
      '--surface-editor': '#191724',
      '--text-primary': '#e0def4',
      '--text-secondary': '#908caa',
      '--border-default': '#403d52',
      '--accent-blue': '#9ccfd8',
      '--accent-blue-hover': '#c4a7e7',
      '--accent-blue-light': '#9ccfd829',
    },
  },
}

describe('theme package contract', () => {
  it('accepts a versioned package with light and dark variants', () => {
    expect(parseThemePackage(validPackage)).toEqual(validPackage)
  })

  it('rejects a package without both variants', () => {
    expect(() => parseThemePackage({
      ...validPackage,
      variants: { light: validPackage.variants.light },
    })).toThrow(/dark/i)
  })

  it('rejects unsafe and unknown CSS declarations', () => {
    expect(() => parseThemePackage({
      ...validPackage,
      variants: {
        ...validPackage.variants,
        light: { ...validPackage.variants.light, '--surface-card': 'url(https://example.com/pixel)' },
      },
    })).toThrow(/color/i)

    expect(() => parseThemePackage({
      ...validPackage,
      variants: {
        ...validPackage.variants,
        light: { ...validPackage.variants.light, '--not-a-tolaria-token': '#ffffff' },
      },
    })).toThrow(/token/i)
  })

  it('ships valid built-in packages with two variants each', () => {
    expect(BUILT_IN_THEME_PACKAGES.map((theme) => theme.id)).toEqual([
      'codex-rose-pine',
      'nord',
      'blue-topaz',
      'catppuccin-latte',
      'catppuccin-frappe',
      'catppuccin-macchiato',
      'catppuccin-mocha',
    ])
    for (const theme of BUILT_IN_THEME_PACKAGES) {
      expect(parseThemePackage(theme)).toBe(theme)
      expect(Object.keys(theme.variants.light).length).toBeGreaterThan(20)
      expect(Object.keys(theme.variants.dark).length).toBeGreaterThan(20)
    }
  })
})
