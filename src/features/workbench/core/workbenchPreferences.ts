import {
  WORKBENCH_TEMPLATE_SCHEMA_VERSION,
  type WorkbenchPreferencesV1,
  type WorkbenchTemplateRegistry,
} from './workbenchTypes'
import { workbenchTemplateRegistry } from '../builtInWorkbenchTemplates'

export const WORKBENCH_PREFERENCES_STORAGE_KEY = 'tolaria.workbench.preferences.v1'
export const WORKBENCH_PREFERENCES_CHANGED_EVENT = 'tolaria:workbench-preferences-changed'

export type WorkbenchPreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>
type WorkbenchPreferencesListener = (preferences: WorkbenchPreferencesV1) => void

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function defaultWorkbenchPreferences(
  registry: WorkbenchTemplateRegistry = workbenchTemplateRegistry,
): WorkbenchPreferencesV1 {
  const template = registry.defaultTemplate()
  return {
    schemaVersion: WORKBENCH_TEMPLATE_SCHEMA_VERSION,
    templateId: template.id,
    activeViewId: template.defaultViewId,
  }
}

export function normalizeWorkbenchPreferences(
  value: unknown,
  registry: WorkbenchTemplateRegistry = workbenchTemplateRegistry,
): WorkbenchPreferencesV1 {
  if (!isRecord(value) || value.schemaVersion !== WORKBENCH_TEMPLATE_SCHEMA_VERSION) {
    return defaultWorkbenchPreferences(registry)
  }

  const template = typeof value.templateId === 'string'
    ? registry.get(value.templateId)
    : undefined
  if (!template) return defaultWorkbenchPreferences(registry)

  const activeViewId = typeof value.activeViewId === 'string'
    && template.views.some((view) => view.id === value.activeViewId)
    ? value.activeViewId
    : template.defaultViewId

  return {
    schemaVersion: WORKBENCH_TEMPLATE_SCHEMA_VERSION,
    templateId: template.id,
    activeViewId,
  }
}

function parseWorkbenchPreferences(
  stored: string | null,
  registry: WorkbenchTemplateRegistry,
): WorkbenchPreferencesV1 {
  if (!stored) return defaultWorkbenchPreferences(registry)
  try {
    return normalizeWorkbenchPreferences(JSON.parse(stored), registry)
  } catch {
    return defaultWorkbenchPreferences(registry)
  }
}

export function readWorkbenchPreferences(
  storage: WorkbenchPreferenceStorage,
  registry: WorkbenchTemplateRegistry = workbenchTemplateRegistry,
): WorkbenchPreferencesV1 {
  try {
    return parseWorkbenchPreferences(storage.getItem(WORKBENCH_PREFERENCES_STORAGE_KEY), registry)
  } catch {
    return defaultWorkbenchPreferences(registry)
  }
}

function preferencesFromEvent(
  event: Event,
  registry: WorkbenchTemplateRegistry,
): WorkbenchPreferencesV1 | null {
  if (event.type === WORKBENCH_PREFERENCES_CHANGED_EVENT) {
    return normalizeWorkbenchPreferences((event as CustomEvent<unknown>).detail, registry)
  }
  if (event.type !== 'storage') return null

  const storageEvent = event as StorageEvent
  if (storageEvent.key !== WORKBENCH_PREFERENCES_STORAGE_KEY) return null
  return parseWorkbenchPreferences(storageEvent.newValue, registry)
}

export function subscribeWorkbenchPreferences(
  eventTarget: EventTarget,
  listener: WorkbenchPreferencesListener,
  registry: WorkbenchTemplateRegistry = workbenchTemplateRegistry,
): () => void {
  const handleEvent: EventListener = (event) => {
    const preferences = preferencesFromEvent(event, registry)
    if (preferences) listener(preferences)
  }
  eventTarget.addEventListener(WORKBENCH_PREFERENCES_CHANGED_EVENT, handleEvent)
  eventTarget.addEventListener('storage', handleEvent)
  return () => {
    eventTarget.removeEventListener(WORKBENCH_PREFERENCES_CHANGED_EVENT, handleEvent)
    eventTarget.removeEventListener('storage', handleEvent)
  }
}

export function writeWorkbenchPreferences(
  storage: WorkbenchPreferenceStorage,
  value: unknown,
  registry: WorkbenchTemplateRegistry = workbenchTemplateRegistry,
  eventTarget?: EventTarget,
): boolean {
  const preferences = normalizeWorkbenchPreferences(value, registry)
  try {
    storage.setItem(WORKBENCH_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    return false
  }

  eventTarget?.dispatchEvent(new CustomEvent<WorkbenchPreferencesV1>(
    WORKBENCH_PREFERENCES_CHANGED_EVENT,
    { detail: preferences },
  ))
  return true
}
