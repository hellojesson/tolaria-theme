import type { ResolvedThemeMode } from '../../lib/themeMode'
import { BUILT_IN_THEME_PACKAGES, findBuiltInThemePackage } from './builtInThemes'
import {
  SUPPORTED_THEME_TOKENS,
  parseThemePackage,
  parseThemePackageJson,
  type ThemePackage,
} from './themePackage'
import {
  EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY,
  EDITOR_FONT_PREFERENCE_CHANGE_EVENT,
  EDITOR_FONT_PREFERENCE_STORAGE_KEY,
  applyStoredEditorFont,
} from './editorFontPreferences'

export const OFFICIAL_THEME_EXTENSION_ID = 'official'
export const THEME_EXTENSION_SELECTION_STORAGE_KEY = 'tolaria.theme-extension.selection.v1'
export const THEME_EXTENSION_IMPORTS_STORAGE_KEY = 'tolaria.theme-extension.imports.v1'
export const THEME_EXTENSION_CHANGE_EVENT = 'tolaria:theme-extension-change'

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ThemeDocument = Pick<Document, 'documentElement'>

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
    // Local storage can be unavailable in restricted browser contexts.
    return false
  }
}

function dispatchThemeExtensionChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(THEME_EXTENSION_CHANGE_EVENT))
}

export function readThemeExtensionSelection(storage: ThemeStorage): string {
  const value = safeGet(storage, THEME_EXTENSION_SELECTION_STORAGE_KEY)
  return value && value.length <= 64 ? value : OFFICIAL_THEME_EXTENSION_ID
}

export function writeThemeExtensionSelection(storage: ThemeStorage, id: string): void {
  safeSet(storage, THEME_EXTENSION_SELECTION_STORAGE_KEY, id)
  dispatchThemeExtensionChange()
}

export function readImportedThemePackages(storage: ThemeStorage): readonly ThemePackage[] {
  const stored = safeGet(storage, THEME_EXTENSION_IMPORTS_STORAGE_KEY)
  if (!stored) return []

  try {
    const values = JSON.parse(stored) as unknown
    if (!Array.isArray(values)) return []
    return values.flatMap((value) => {
      try {
        const theme = parseThemePackage(value)
        return findBuiltInThemePackage(theme.id) ? [] : [theme]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

export function listThemePackages(storage: ThemeStorage): readonly ThemePackage[] {
  return [...BUILT_IN_THEME_PACKAGES, ...readImportedThemePackages(storage)]
}

export function installImportedThemePackage(storage: ThemeStorage, json: string): ThemePackage {
  const theme = parseThemePackageJson(json)
  if (findBuiltInThemePackage(theme.id)) {
    throw new Error('Imported theme id conflicts with a bundled theme.')
  }

  const imports = readImportedThemePackages(storage).filter((item) => item.id !== theme.id)
  if (!safeSet(storage, THEME_EXTENSION_IMPORTS_STORAGE_KEY, JSON.stringify([...imports, theme]))) {
    throw new Error('Theme storage is unavailable.')
  }
  dispatchThemeExtensionChange()
  return theme
}

export function findThemePackage(storage: ThemeStorage, id: string): ThemePackage | null {
  return findBuiltInThemePackage(id) ?? readImportedThemePackages(storage).find((theme) => theme.id === id) ?? null
}

export function applyThemeExtension(
  documentObject: ThemeDocument,
  theme: ThemePackage | null,
  mode: ResolvedThemeMode,
): void {
  const root = documentObject.documentElement
  for (const token of SUPPORTED_THEME_TOKENS) root.style.removeProperty(token)

  if (!theme) {
    root.removeAttribute('data-theme-extension')
    return
  }

  for (const [token, color] of Object.entries(theme.variants[mode])) {
    root.style.setProperty(token, color)
  }
  root.setAttribute('data-theme-extension', theme.id)
}

function readResolvedMode(documentObject: ThemeDocument): ResolvedThemeMode {
  return documentObject.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function applyStoredThemeExtension(
  documentObject: ThemeDocument,
  storage: ThemeStorage,
  mode: ResolvedThemeMode = readResolvedMode(documentObject),
): string {
  const id = readThemeExtensionSelection(storage)
  const theme = id === OFFICIAL_THEME_EXTENSION_ID ? null : findThemePackage(storage, id)
  applyThemeExtension(documentObject, theme, mode)
  applyStoredEditorFont(documentObject, storage, theme?.typography?.editorFontPreset)
  return theme?.id ?? OFFICIAL_THEME_EXTENSION_ID
}

export function subscribeToThemeExtensionChanges(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === THEME_EXTENSION_SELECTION_STORAGE_KEY
      || event.key === THEME_EXTENSION_IMPORTS_STORAGE_KEY
      || event.key === EDITOR_FONT_PREFERENCE_STORAGE_KEY
      || event.key === EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY
    ) listener()
  }
  window.addEventListener(THEME_EXTENSION_CHANGE_EVENT, listener)
  window.addEventListener(EDITOR_FONT_PREFERENCE_CHANGE_EVENT, listener)
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener(THEME_EXTENSION_CHANGE_EVENT, listener)
    window.removeEventListener(EDITOR_FONT_PREFERENCE_CHANGE_EVENT, listener)
    window.removeEventListener('storage', handleStorage)
  }
}
