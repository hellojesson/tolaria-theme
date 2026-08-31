import type { ThemeEditorFontPresetId } from './themeFontContract'

export const EDITOR_FONT_PREFERENCE_STORAGE_KEY = 'tolaria.theme-extension.editor-font.v1'
export const EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY = 'tolaria.theme-extension.editor-font.custom-name.v1'
export const EDITOR_FONT_PREFERENCE_CHANGE_EVENT = 'tolaria:editor-font-preference-change'
export const EDITOR_FONT_CSS_VARIABLE = '--tolaria-editor-font-family'

export const EDITOR_FONT_PREFERENCE_IDS = [
  'follow-theme',
  ...(['system', 'pingfang-sc', 'source-han-sans-sc', 'source-han-serif-sc'] as const),
  'custom',
] as const

export type EditorFontPreferenceId = typeof EDITOR_FONT_PREFERENCE_IDS[number]
export type FontAvailability = 'available' | 'unavailable' | 'unknown'

export interface EditorFontPreference {
  id: EditorFontPreferenceId
  customName: string
}

export interface EditorFontPreset {
  id: ThemeEditorFontPresetId
  localFontName: string | null
  cssStack: string
}

export const EDITOR_FONT_PRESETS: readonly EditorFontPreset[] = [
  {
    id: 'system',
    localFontName: null,
    cssStack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: 'pingfang-sc',
    localFontName: 'PingFang SC',
    cssStack: "'PingFang SC', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  {
    id: 'source-han-sans-sc',
    localFontName: 'Source Han Sans SC',
    cssStack: "'Source Han Sans SC', 'PingFang SC', system-ui, -apple-system, sans-serif",
  },
  {
    id: 'source-han-serif-sc',
    localFontName: 'Source Han Serif SC',
    cssStack: "'Source Han Serif SC', 'Songti SC', 'STSong', serif",
  },
]

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ThemeDocument = Pick<Document, 'documentElement'>
type LocalFontLoader = (fontName: string) => Promise<void>

const EDITOR_FONT_PREFERENCE_ID_SET = new Set<string>(EDITOR_FONT_PREFERENCE_IDS)
const LOCAL_FONT_NAME_PATTERN = /^[\p{L}\p{N} ._-]+$/u
const MAX_LOCAL_FONT_NAME_LENGTH = 80

function safeGet(storage: ThemeStorage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: ThemeStorage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemove(storage: ThemeStorage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function dispatchEditorFontPreferenceChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EDITOR_FONT_PREFERENCE_CHANGE_EVENT))
}

export function normalizeLocalFontName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || codePoint === 127
  })) return null
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (
    normalized.length === 0
    || normalized.length > MAX_LOCAL_FONT_NAME_LENGTH
    || !LOCAL_FONT_NAME_PATTERN.test(normalized)
  ) return null
  return normalized
}

export function isEditorFontPreferenceId(value: unknown): value is EditorFontPreferenceId {
  return typeof value === 'string' && EDITOR_FONT_PREFERENCE_ID_SET.has(value)
}

export function readEditorFontPreference(storage: ThemeStorage): EditorFontPreference {
  const storedId = safeGet(storage, EDITOR_FONT_PREFERENCE_STORAGE_KEY)
  if (!isEditorFontPreferenceId(storedId)) {
    return { id: 'follow-theme', customName: '' }
  }

  const id = storedId
  if (id !== 'custom') return { id, customName: '' }

  const customName = normalizeLocalFontName(safeGet(storage, EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY))
  return customName
    ? { id, customName }
    : { id: 'follow-theme', customName: '' }
}

export function writeEditorFontPreference(
  storage: ThemeStorage,
  preference: EditorFontPreference,
): boolean {
  if (!isEditorFontPreferenceId(preference.id)) return false

  if (preference.id === 'custom') {
    const customName = normalizeLocalFontName(preference.customName)
    if (!customName) return false
    if (!safeSet(storage, EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY, customName)) return false
  } else {
    safeRemove(storage, EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY)
  }

  if (!safeSet(storage, EDITOR_FONT_PREFERENCE_STORAGE_KEY, preference.id)) return false
  dispatchEditorFontPreferenceChange()
  return true
}

export function findEditorFontPreset(id: ThemeEditorFontPresetId): EditorFontPreset {
  return EDITOR_FONT_PRESETS.find((preset) => preset.id === id) ?? EDITOR_FONT_PRESETS[0]
}

function quoteFontFamilyName(fontName: string): string {
  return `"${fontName.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function customFontStack(fontName: string): string {
  return `${quoteFontFamilyName(fontName)}, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
}

export function applyStoredEditorFont(
  documentObject: ThemeDocument,
  storage: ThemeStorage,
  themePreset?: ThemeEditorFontPresetId,
): 'official' | ThemeEditorFontPresetId | 'custom' {
  const root = documentObject.documentElement
  const preference = readEditorFontPreference(storage)

  if (preference.id === 'follow-theme' && !themePreset) {
    root.style.removeProperty(EDITOR_FONT_CSS_VARIABLE)
    return 'official'
  }

  if (preference.id === 'custom') {
    root.style.setProperty(EDITOR_FONT_CSS_VARIABLE, customFontStack(preference.customName))
    return 'custom'
  }

  const resolvedPreset = preference.id === 'follow-theme' ? themePreset : preference.id
  const preset = findEditorFontPreset(resolvedPreset ?? 'system')
  root.style.setProperty(EDITOR_FONT_CSS_VARIABLE, preset.cssStack)
  return preset.id
}

async function loadLocalFont(fontName: string): Promise<void> {
  if (typeof FontFace === 'undefined') throw new Error('Local font detection is unavailable.')
  const sourceName = fontName.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
  const face = new FontFace('Tolaria Local Font Probe', `local("${sourceName}")`)
  await face.load()
}

export async function detectLocalFontAvailability(
  fontName: string,
  loader: LocalFontLoader = loadLocalFont,
): Promise<FontAvailability> {
  const normalized = normalizeLocalFontName(fontName)
  if (!normalized) return 'unavailable'
  if (loader === loadLocalFont && typeof FontFace === 'undefined') return 'unknown'

  try {
    await loader(normalized)
    return 'available'
  } catch {
    return 'unavailable'
  }
}
