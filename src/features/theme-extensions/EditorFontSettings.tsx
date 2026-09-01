import { useCallback, useEffect, useMemo, useState } from 'react'
import type { createTranslator } from '../../lib/i18n'
import { trackEvent } from '../../lib/telemetry'
import { SelectControl } from '../../components/SettingsControls'
import { Input } from '../../components/ui/input'
import {
  EDITOR_FONT_PRESETS,
  EDITOR_FONT_PREFERENCE_IDS,
  detectLocalFontAvailability,
  findEditorFontPreset,
  isEditorFontPreferenceId,
  normalizeLocalFontName,
  readEditorFontPreference,
  writeEditorFontPreference,
  type EditorFontPreference,
  type EditorFontPreferenceId,
  type FontAvailability,
} from './editorFontPreferences'
import type { ThemeEditorFontPresetId } from './themeFontContract'
import {
  OFFICIAL_THEME_EXTENSION_ID,
  applyStoredThemeExtension,
  findThemePackage,
  readThemeExtensionSelection,
  subscribeToThemeExtensionChanges,
} from './themeRuntime'

type Translate = ReturnType<typeof createTranslator>
type AvailabilityMap = Partial<Record<ThemeEditorFontPresetId | 'custom', FontAvailability>>

function fontPreferenceLabel(id: EditorFontPreferenceId, t: Translate): string {
  const labels: Record<EditorFontPreferenceId, string> = {
    'follow-theme': t('settings.editorFont.followTheme'),
    system: t('settings.editorFont.system'),
    'pingfang-sc': t('settings.editorFont.pingfang'),
    'source-han-sans-sc': t('settings.editorFont.sourceHanSans'),
    'source-han-serif-sc': t('settings.editorFont.sourceHanSerif'),
    'lxgw-wenkai': t('settings.editorFont.lxgwWenKai'),
    'kaiti-sc': t('settings.editorFont.kaitiSc'),
    custom: t('settings.editorFont.custom'),
  }
  return labels[id]
}

function selectedThemeFontPreset(storage: Storage): ThemeEditorFontPresetId | undefined {
  const themeId = readThemeExtensionSelection(storage)
  if (themeId === OFFICIAL_THEME_EXTENSION_ID) return undefined
  return findThemePackage(storage, themeId)?.typography?.editorFontPreset
}

function availabilityLabel(availability: FontAvailability | undefined, t: Translate): string | null {
  if (!availability) return null
  if (availability === 'available') return t('settings.editorFont.available')
  if (availability === 'unavailable') return t('settings.editorFont.unavailable')
  return t('settings.editorFont.unknown')
}

function resolvedLocalFontName(
  preference: EditorFontPreference,
  themePreset: ThemeEditorFontPresetId | undefined,
): string | null {
  if (preference.id === 'custom') return normalizeLocalFontName(preference.customName)
  const presetId = preference.id === 'follow-theme' ? themePreset : preference.id
  if (!presetId) return null
  return findEditorFontPreset(presetId).localFontName
}

export function EditorFontSettings({ t }: { t: Translate }) {
  const [preference, setPreference] = useState(() => readEditorFontPreference(window.localStorage))
  const [themePreset, setThemePreset] = useState(() => selectedThemeFontPreset(window.localStorage))
  const [availability, setAvailability] = useState<AvailabilityMap>({})

  const refresh = useCallback(() => {
    setPreference(readEditorFontPreference(window.localStorage))
    setThemePreset(selectedThemeFontPreset(window.localStorage))
  }, [])

  useEffect(() => {
    applyStoredThemeExtension(document, window.localStorage)
    return subscribeToThemeExtensionChanges(refresh)
  }, [refresh])

  useEffect(() => {
    let active = true
    const checks = EDITOR_FONT_PRESETS.flatMap((preset) => preset.localFontName
      ? [detectLocalFontAvailability(preset.localFontName).then((status) => [preset.id, status] as const)]
      : [])
    void Promise.all(checks).then((entries) => {
      if (active) setAvailability((current) => ({ ...current, ...Object.fromEntries(entries) }))
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (preference.id !== 'custom') return
    const customName = normalizeLocalFontName(preference.customName)
    if (!customName) return
    let active = true
    void detectLocalFontAvailability(customName).then((status) => {
      if (active) setAvailability((current) => ({ ...current, custom: status }))
    })
    return () => { active = false }
  }, [preference])

  const selectedAvailability = useMemo(() => {
    if (preference.id === 'custom') return availability.custom
    if (preference.id === 'follow-theme') return themePreset ? availability[themePreset] : undefined
    return availability[preference.id]
  }, [availability, preference.id, themePreset])

  const persistPreference = useCallback((next: EditorFontPreference) => {
    if (!writeEditorFontPreference(window.localStorage, next)) return false
    applyStoredThemeExtension(document, window.localStorage)
    setPreference(readEditorFontPreference(window.localStorage))
    trackEvent('editor_font_selected', { preference: next.id })
    return true
  }, [])

  const selectPreference = (id: string) => {
    if (!isEditorFontPreferenceId(id)) return
    const nextId = id
    if (nextId === 'custom') {
      setPreference((current) => ({ id: 'custom', customName: current.customName }))
      return
    }
    persistPreference({ id: nextId, customName: '' })
  }

  const commitCustomName = () => {
    const normalized = normalizeLocalFontName(preference.customName)
    if (!normalized) return
    persistPreference({ id: 'custom', customName: normalized })
  }

  const localFontName = resolvedLocalFontName(preference, themePreset)
  const statusLabel = availabilityLabel(selectedAvailability, t)
  const themeRecommendation = preference.id === 'follow-theme' && themePreset
    ? fontPreferenceLabel(themePreset, t)
    : null

  return (
    <div className="space-y-2">
      <SelectControl
        ariaLabel={t('settings.editorFont.selectAria')}
        value={preference.id}
        onValueChange={selectPreference}
        options={EDITOR_FONT_PREFERENCE_IDS.map((id) => ({ value: id, label: fontPreferenceLabel(id, t) }))}
        testId="settings-editor-font"
      />
      {preference.id === 'custom' ? (
        <Input
          value={preference.customName}
          aria-label={t('settings.editorFont.customNameAria')}
          placeholder={t('settings.editorFont.customNamePlaceholder')}
          onChange={(event) => setPreference({ id: 'custom', customName: event.target.value })}
          onBlur={commitCustomName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          data-testid="settings-editor-font-custom-name"
          className="w-full bg-transparent"
        />
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground" role="status">
        {themeRecommendation
          ? t('settings.editorFont.themeRecommendation', { name: themeRecommendation })
          : localFontName
            ? t('settings.editorFont.selectedLocalFont', { name: localFontName })
            : t('settings.editorFont.systemSummary')}
        {statusLabel ? ` · ${statusLabel}` : ''}
      </p>
    </div>
  )
}
