export const THEME_EDITOR_FONT_PRESET_IDS = [
  'system',
  'pingfang-sc',
  'source-han-sans-sc',
  'source-han-serif-sc',
] as const

export type ThemeEditorFontPresetId = typeof THEME_EDITOR_FONT_PRESET_IDS[number]

const THEME_EDITOR_FONT_PRESET_ID_SET = new Set<string>(THEME_EDITOR_FONT_PRESET_IDS)

export function isThemeEditorFontPresetId(value: unknown): value is ThemeEditorFontPresetId {
  return typeof value === 'string' && THEME_EDITOR_FONT_PRESET_ID_SET.has(value)
}
