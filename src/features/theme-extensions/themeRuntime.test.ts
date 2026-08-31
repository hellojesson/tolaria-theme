import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUILT_IN_THEME_PACKAGES } from './builtInThemes'
import {
  OFFICIAL_THEME_EXTENSION_ID,
  THEME_EXTENSION_SELECTION_STORAGE_KEY,
  applyStoredThemeExtension,
  applyThemeExtension,
  installImportedThemePackage,
  readImportedThemePackages,
  readThemeExtensionSelection,
  writeThemeExtensionSelection,
} from './themeRuntime'

function makeStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial))
  return {
    get length() { return values.size },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => { values.delete(key) }),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
  }
}

describe('theme extension runtime', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme-extension')
    document.documentElement.removeAttribute('style')
  })

  it('applies the variant matching Tolaria resolved mode', () => {
    const theme = BUILT_IN_THEME_PACKAGES[0]

    applyThemeExtension(document, theme, 'light')
    expect(document.documentElement).toHaveAttribute('data-theme-extension', theme.id)
    expect(document.documentElement.style.getPropertyValue('--surface-app')).toBe(theme.variants.light['--surface-app'])

    applyThemeExtension(document, theme, 'dark')
    expect(document.documentElement.style.getPropertyValue('--surface-app')).toBe(theme.variants.dark['--surface-app'])
  })

  it('removes extension overrides when the official theme is selected', () => {
    applyThemeExtension(document, BUILT_IN_THEME_PACKAGES[1], 'dark')
    applyThemeExtension(document, null, 'dark')

    expect(document.documentElement).not.toHaveAttribute('data-theme-extension')
    expect(document.documentElement.style.getPropertyValue('--surface-app')).toBe('')
  })

  it('persists selection independently from the official light/dark/system setting', () => {
    const storage = makeStorage()
    writeThemeExtensionSelection(storage, 'nord')

    expect(readThemeExtensionSelection(storage)).toBe('nord')
    expect(storage.setItem).toHaveBeenCalledWith(THEME_EXTENSION_SELECTION_STORAGE_KEY, 'nord')
  })

  it('bootstraps a stored theme and safely falls back when it is unavailable', () => {
    const storage = makeStorage({ [THEME_EXTENSION_SELECTION_STORAGE_KEY]: 'blue-topaz' })
    expect(applyStoredThemeExtension(document, storage, 'dark')).toBe('blue-topaz')
    expect(document.documentElement).toHaveAttribute('data-theme-extension', 'blue-topaz')

    const missingStorage = makeStorage({ [THEME_EXTENSION_SELECTION_STORAGE_KEY]: 'missing' })
    expect(applyStoredThemeExtension(document, missingStorage, 'light')).toBe(OFFICIAL_THEME_EXTENSION_ID)
    expect(document.documentElement).not.toHaveAttribute('data-theme-extension')
  })

  it('installs a validated imported package and reports unavailable storage', () => {
    const storage = makeStorage()
    const imported = { ...BUILT_IN_THEME_PACKAGES[0], id: 'team-ocean', name: 'Team Ocean' }

    expect(installImportedThemePackage(storage, JSON.stringify(imported))).toEqual(imported)
    expect(readImportedThemePackages(storage)).toEqual([imported])

    const unavailableStorage = makeStorage()
    vi.mocked(unavailableStorage.setItem).mockImplementation(() => { throw new Error('quota') })
    expect(() => installImportedThemePackage(unavailableStorage, JSON.stringify(imported))).toThrow(/storage/i)
  })
})
