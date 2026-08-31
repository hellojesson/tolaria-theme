import { UploadSimple } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { createTranslator } from '../../lib/i18n'
import { trackEvent } from '../../lib/telemetry'
import { SelectControl } from '../../components/SettingsControls'
import { Button } from '../../components/ui/button'
import { ThemeImportUnavailableError, pickThemeExtensionFile } from './themeFileImport'
import {
  OFFICIAL_THEME_EXTENSION_ID,
  applyStoredThemeExtension,
  installImportedThemePackage,
  listThemePackages,
  readImportedThemePackages,
  readThemeExtensionSelection,
  subscribeToThemeExtensionChanges,
  writeThemeExtensionSelection,
} from './themeRuntime'

type Translate = ReturnType<typeof createTranslator>
type ImportStatus = { kind: 'error' | 'success'; message: string } | null

function readViewState() {
  const themes = listThemePackages(window.localStorage)
  const storedSelection = readThemeExtensionSelection(window.localStorage)
  const selectedId = storedSelection === OFFICIAL_THEME_EXTENSION_ID
    || themes.some((theme) => theme.id === storedSelection)
    ? storedSelection
    : OFFICIAL_THEME_EXTENSION_ID
  return { selectedId, themes }
}

export function ThemeExtensionSettings({ t }: { t: Translate }) {
  const [viewState, setViewState] = useState(readViewState)
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<ImportStatus>(null)

  const refresh = useCallback(() => setViewState(readViewState()), [])
  useEffect(() => subscribeToThemeExtensionChanges(refresh), [refresh])

  const selectTheme = (id: string) => {
    const importedIds = new Set(readImportedThemePackages(window.localStorage).map((theme) => theme.id))
    writeThemeExtensionSelection(window.localStorage, id)
    applyStoredThemeExtension(document, window.localStorage)
    trackEvent('theme_extension_selected', {
      theme_kind: id === OFFICIAL_THEME_EXTENSION_ID
        ? 'official'
        : importedIds.has(id) ? 'imported' : 'bundled',
    })
    refresh()
  }

  const importTheme = async () => {
    setImporting(true)
    setStatus(null)
    try {
      const content = await pickThemeExtensionFile(
        t('settings.themeExtension.dialogTitle'),
        t('settings.themeExtension.fileFilter'),
      )
      if (!content) return

      const theme = installImportedThemePackage(window.localStorage, content)
      writeThemeExtensionSelection(window.localStorage, theme.id)
      applyStoredThemeExtension(document, window.localStorage)
      setStatus({
        kind: 'success',
        message: t('settings.themeExtension.importSuccess', { name: theme.name }),
      })
      trackEvent('theme_extension_imported', { outcome: 'success' })
      refresh()
    } catch (error) {
      const message = error instanceof ThemeImportUnavailableError
        ? t('settings.themeExtension.importUnavailable')
        : t('settings.themeExtension.importError')
      setStatus({ kind: 'error', message })
      trackEvent('theme_extension_imported', { outcome: 'failed' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SelectControl
            ariaLabel={t('settings.themeExtension.selectAria')}
            value={viewState.selectedId}
            onValueChange={selectTheme}
            options={[
              { value: OFFICIAL_THEME_EXTENSION_ID, label: t('settings.themeExtension.official') },
              ...viewState.themes.map((theme) => ({ value: theme.id, label: theme.name })),
            ]}
            testId="settings-theme-extension"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={importing}
          onClick={() => void importTheme()}
          data-testid="settings-theme-extension-import"
        >
          <UploadSimple size={14} />
          {importing ? t('settings.themeExtension.importing') : t('settings.themeExtension.import')}
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {t('settings.themeExtension.description')}
      </p>
      {status ? (
        <p
          className={status.kind === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
          role={status.kind === 'error' ? 'alert' : 'status'}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  )
}
