import { describe, expect, it, vi } from 'vitest'
import {
  EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY,
  EDITOR_FONT_PREFERENCE_STORAGE_KEY,
  applyStoredEditorFont,
  detectLocalFontAvailability,
  readEditorFontPreference,
  writeEditorFontPreference,
} from './editorFontPreferences'

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
