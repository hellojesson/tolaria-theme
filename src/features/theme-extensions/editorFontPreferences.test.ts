import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY,
  EDITOR_FONT_PREFERENCE_STORAGE_KEY,
  applyStoredEditorFont,
  detectLocalFontAvailability,
  readEditorFontPreference,
  writeEditorFontPreference,
} from './editorFontPreferences'
import { EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES } from './editorFontTypographyProfile'

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

describe('editor font preferences', () => {
  function clearTypographyVariables(): void {
    for (const variable of EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES) {
      document.documentElement.style.removeProperty(variable)
    }
  }

  afterEach(clearTypographyVariables)

  it('defaults to following the selected theme without overriding official typography', () => {
    const storage = makeStorage()

    expect(readEditorFontPreference(storage)).toEqual({ id: 'follow-theme', customName: '' })
    expect(applyStoredEditorFont(document, storage)).toBe('official')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toBe('')
  })

  it('lets an explicit local preference override the theme recommendation', () => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id: 'source-han-sans-sc', customName: '' })

    expect(applyStoredEditorFont(document, storage, 'source-han-serif-sc')).toBe('source-han-sans-sc')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toContain(
      'Source Han Sans SC',
    )
  })

  it('uses a safe theme recommendation only while following the theme', () => {
    const storage = makeStorage()

    expect(applyStoredEditorFont(document, storage, 'pingfang-sc')).toBe('pingfang-sc')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toContain('PingFang SC')
  })

  it.each([
    ['lxgw-wenkai', 'LXGW WenKai'],
    ['kaiti-sc', 'Kaiti SC'],
  ] as const)('applies the %s local-only preset with a portable fallback', (id, family) => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id, customName: '' })

    expect(applyStoredEditorFont(document, storage)).toBe(id)
    const stack = document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')
    expect(stack).toContain(family)
    expect(stack).toMatch(/STKaiti|PingFang SC/)
  })

  it('gives LXGW WenKai strong text a distinct native-medium emphasis', () => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id: 'lxgw-wenkai', customName: '' })

    applyStoredEditorFont(document, storage)

    const style = document.documentElement.style
    expect(style.getPropertyValue('--tolaria-editor-strong-font-weight')).toBe('600')
    expect(style.getPropertyValue('--tolaria-editor-strong-font-size')).toBe('1.025em')
    expect(style.getPropertyValue('--tolaria-editor-strong-color')).toBe('var(--text-primary)')
    expect(style.getPropertyValue('--tolaria-editor-strong-letter-spacing')).toBe('0.008em')
    expect(style.getPropertyValue('--tolaria-editor-heading-font-weight')).toBe('500')
    expect(style.getPropertyValue('--tolaria-editor-heading-color')).toContain('color-mix')
    expect(style.getPropertyValue('--tolaria-editor-heading-letter-spacing')).toBe('0.01em')
  })

  it('keeps the softer calligraphic typography profile for Kaiti SC', () => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id: 'kaiti-sc', customName: '' })

    applyStoredEditorFont(document, storage)

    const style = document.documentElement.style
    expect(style.getPropertyValue('--tolaria-editor-strong-font-weight')).toBe('500')
    expect(style.getPropertyValue('--tolaria-editor-strong-font-size')).toBe('inherit')
    expect(style.getPropertyValue('--tolaria-editor-strong-color')).toContain('color-mix')
    expect(style.getPropertyValue('--tolaria-editor-strong-letter-spacing')).toBe('0.018em')
  })

  it('clears the calligraphic profile when switching to an official-weight preset', () => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id: 'lxgw-wenkai', customName: '' })
    applyStoredEditorFont(document, storage)

    writeEditorFontPreference(storage, { id: 'pingfang-sc', customName: '' })
    applyStoredEditorFont(document, storage)

    for (const variable of EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES) {
      expect(document.documentElement.style.getPropertyValue(variable)).toBe('')
    }
  })

  it('normalizes custom local font names and rejects unsafe stored values', () => {
    const storage = makeStorage()
    writeEditorFontPreference(storage, { id: 'custom', customName: '  My Local Font  ' })

    expect(storage.setItem).toHaveBeenCalledWith(EDITOR_FONT_PREFERENCE_STORAGE_KEY, 'custom')
    expect(storage.setItem).toHaveBeenCalledWith(EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY, 'My Local Font')
    expect(applyStoredEditorFont(document, storage)).toBe('custom')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toMatch(
      /^"My Local Font",/,
    )

    const unsafe = makeStorage({
      [EDITOR_FONT_PREFERENCE_STORAGE_KEY]: 'custom',
      [EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY]: 'Bad\nFont',
    })
    expect(readEditorFontPreference(unsafe)).toEqual({ id: 'follow-theme', customName: '' })
  })

  it('detects local fonts through an injectable local-only loader', async () => {
    const loader = vi.fn(async () => undefined)

    await expect(detectLocalFontAvailability('Source Han Sans SC', loader)).resolves.toBe('available')
    expect(loader).toHaveBeenCalledWith('Source Han Sans SC')

    await expect(detectLocalFontAvailability('Missing Font', async () => {
      throw new Error('not installed')
    })).resolves.toBe('unavailable')
  })
})
