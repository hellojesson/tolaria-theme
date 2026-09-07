import { useCallback, useEffect, useState } from 'react'
import { SelectControl } from '../../../components/SettingsControls'
import { createTranslator, type TranslationKey } from '../../../lib/i18n'
import { trackEvent } from '../../../lib/telemetry'
import { workbenchTemplateRegistry } from '../builtInWorkbenchTemplates'
import {
  readWorkbenchPreferences,
  subscribeWorkbenchPreferences,
  writeWorkbenchPreferences,
  type WorkbenchPreferenceStorage,
} from '../core/workbenchPreferences'
import type { WorkbenchTemplateRegistry } from '../core/workbenchTypes'

type Translate = ReturnType<typeof createTranslator>

export interface WorkbenchStyleSettingsProps {
  readonly eventTarget?: EventTarget
  readonly registry?: WorkbenchTemplateRegistry
  readonly storage?: WorkbenchPreferenceStorage
  readonly t: Translate
}

export function WorkbenchStyleSettings({
  eventTarget = window,
  registry = workbenchTemplateRegistry,
  storage = window.localStorage,
  t,
}: WorkbenchStyleSettingsProps) {
  const [preferences, setPreferences] = useState(() => readWorkbenchPreferences(storage, registry))

  useEffect(
    () => subscribeWorkbenchPreferences(eventTarget, setPreferences, registry),
    [eventTarget, registry],
  )

  const selectTemplate = useCallback((templateId: string) => {
    const template = registry.get(templateId)
    if (!template || template.id === preferences.templateId) return
    const persisted = writeWorkbenchPreferences(storage, {
      schemaVersion: template.schemaVersion,
      templateId: template.id,
      activeViewId: template.defaultViewId,
    }, registry, eventTarget)
    if (persisted) trackEvent('workbench_template_selected', { template_id: template.id })
  }, [eventTarget, preferences.templateId, registry, storage])

  return (
    <SelectControl
      ariaLabel={t('settings.workbenchStyle.selectAria')}
      value={preferences.templateId}
      onValueChange={selectTemplate}
      options={registry.list().map((template) => ({
        value: template.id,
        label: t(template.labelKey as TranslationKey),
      }))}
      testId="settings-workbench-style"
    />
  )
}
