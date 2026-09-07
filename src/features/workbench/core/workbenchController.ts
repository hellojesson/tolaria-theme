import { workbenchTemplateRegistry } from '../builtInWorkbenchTemplates'
import {
  normalizeWorkbenchPreferences,
  readWorkbenchPreferences,
  subscribeWorkbenchPreferences,
  writeWorkbenchPreferences,
  type WorkbenchPreferenceStorage,
} from './workbenchPreferences'
import type {
  WorkbenchPreferencesV1,
  WorkbenchTemplateDefinition,
  WorkbenchTemplateRegistry,
  WorkbenchTemplateView,
} from './workbenchTypes'

export type WorkbenchPreferenceUpdateResult =
  | 'invalid'
  | 'unchanged'
  | 'updated'
  | 'updated-session-only'

export interface WorkbenchControllerSnapshot {
  readonly isOpen: boolean
  readonly preferences: WorkbenchPreferencesV1
  readonly template: WorkbenchTemplateDefinition
  readonly activeView: WorkbenchTemplateView
}

export interface WorkbenchController {
  close(): void
  destroy(): void
  getSnapshot(): WorkbenchControllerSnapshot
  open(): void
  selectTemplate(templateId: string): WorkbenchPreferenceUpdateResult
  selectView(viewId: string): WorkbenchPreferenceUpdateResult
  subscribe(listener: () => void): () => void
  toggle(): void
}

export interface WorkbenchControllerOptions {
  readonly storage: WorkbenchPreferenceStorage
  readonly registry?: WorkbenchTemplateRegistry
  readonly eventTarget?: EventTarget
}

interface WorkbenchControllerState {
  readonly storage: WorkbenchPreferenceStorage
  readonly registry: WorkbenchTemplateRegistry
  readonly eventTarget?: EventTarget
  readonly listeners: Set<() => void>
  snapshot: WorkbenchControllerSnapshot
  unsubscribePreferences: () => void
}

function resolveActiveView(
  template: WorkbenchTemplateDefinition,
  preferences: WorkbenchPreferencesV1,
): WorkbenchTemplateView {
  const activeView = template.views.find((view) => view.id === preferences.activeViewId)
  if (!activeView) throw new Error(`Workbench view is unavailable: ${preferences.activeViewId}`)
  return activeView
}

function createSnapshot(
  isOpen: boolean,
  preferences: WorkbenchPreferencesV1,
  registry: WorkbenchTemplateRegistry,
): WorkbenchControllerSnapshot {
  const normalized = normalizeWorkbenchPreferences(preferences, registry)
  const template = registry.resolve(normalized.templateId)
  return Object.freeze({
    isOpen,
    preferences: normalized,
    template,
    activeView: resolveActiveView(template, normalized),
  })
}

function preferencesMatch(
  left: WorkbenchPreferencesV1,
  right: WorkbenchPreferencesV1,
): boolean {
  return left.schemaVersion === right.schemaVersion
    && left.templateId === right.templateId
    && left.activeViewId === right.activeViewId
}

function updateSnapshot(
  state: WorkbenchControllerState,
  next: WorkbenchControllerSnapshot,
): void {
  if (
    state.snapshot.isOpen === next.isOpen
    && preferencesMatch(state.snapshot.preferences, next.preferences)
  ) return

  state.snapshot = next
  for (const listener of state.listeners) listener()
}

function setOpen(state: WorkbenchControllerState, isOpen: boolean): void {
  updateSnapshot(state, createSnapshot(isOpen, state.snapshot.preferences, state.registry))
}

function applyPreferences(
  state: WorkbenchControllerState,
  preferences: WorkbenchPreferencesV1,
): void {
  updateSnapshot(state, createSnapshot(state.snapshot.isOpen, preferences, state.registry))
}

function persistPreferences(
  state: WorkbenchControllerState,
  preferences: WorkbenchPreferencesV1,
): WorkbenchPreferenceUpdateResult {
  const normalized = normalizeWorkbenchPreferences(preferences, state.registry)
  if (preferencesMatch(state.snapshot.preferences, normalized)) return 'unchanged'
  const persisted = writeWorkbenchPreferences(
    state.storage,
    normalized,
    state.registry,
    state.eventTarget,
  )
  applyPreferences(state, normalized)
  return persisted ? 'updated' : 'updated-session-only'
}

function selectTemplate(
  state: WorkbenchControllerState,
  templateId: string,
): WorkbenchPreferenceUpdateResult {
  const template = state.registry.get(templateId)
  if (!template) return 'invalid'
  if (template.id === state.snapshot.preferences.templateId) return 'unchanged'
  return persistPreferences(state, {
    schemaVersion: template.schemaVersion,
    templateId: template.id,
    activeViewId: template.defaultViewId,
  })
}

function selectView(
  state: WorkbenchControllerState,
  viewId: string,
): WorkbenchPreferenceUpdateResult {
  if (!state.snapshot.template.views.some((view) => view.id === viewId)) return 'invalid'
  return persistPreferences(state, { ...state.snapshot.preferences, activeViewId: viewId })
}

export function createWorkbenchController(
  options: WorkbenchControllerOptions,
): WorkbenchController {
  const registry = options.registry ?? workbenchTemplateRegistry
  const state: WorkbenchControllerState = {
    storage: options.storage,
    registry,
    eventTarget: options.eventTarget,
    listeners: new Set(),
    snapshot: createSnapshot(false, readWorkbenchPreferences(options.storage, registry), registry),
    unsubscribePreferences: () => undefined,
  }
  if (options.eventTarget) {
    state.unsubscribePreferences = subscribeWorkbenchPreferences(
      options.eventTarget,
      (preferences) => applyPreferences(state, preferences),
      registry,
    )
  }

  return Object.freeze({
    close: () => setOpen(state, false),
    destroy: () => {
      state.unsubscribePreferences()
      state.listeners.clear()
    },
    getSnapshot: () => state.snapshot,
    open: () => setOpen(state, true),
    selectTemplate: (templateId: string) => selectTemplate(state, templateId),
    selectView: (viewId: string) => selectView(state, viewId),
    subscribe: (listener: () => void) => {
      state.listeners.add(listener)
      return () => {
        state.listeners.delete(listener)
      }
    },
    toggle: () => setOpen(state, !state.snapshot.isOpen),
  })
}
