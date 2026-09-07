export { buildWorkbenchModel } from './core/buildWorkbenchModel'
export {
  createWorkbenchController,
  type WorkbenchController,
  type WorkbenchControllerOptions,
  type WorkbenchControllerSnapshot,
  type WorkbenchPreferenceUpdateResult,
} from './core/workbenchController'
export {
  WORKBENCH_PREFERENCES_CHANGED_EVENT,
  WORKBENCH_PREFERENCES_STORAGE_KEY,
  defaultWorkbenchPreferences,
  normalizeWorkbenchPreferences,
  readWorkbenchPreferences,
  subscribeWorkbenchPreferences,
  writeWorkbenchPreferences,
  type WorkbenchPreferenceStorage,
} from './core/workbenchPreferences'
export type {
  WorkbenchDestinationSummary,
  WorkbenchModel,
  WorkbenchPreferencesV1,
  WorkbenchRelationshipSummary,
  WorkbenchSourceData,
  WorkbenchStatusGroup,
  WorkbenchSummary,
  WorkbenchTemplateDefinition,
  WorkbenchTemplateRegistry,
  WorkbenchTemplateView,
  WorkbenchWidgetPlacement,
} from './core/workbenchTypes'
export {
  createWorkbenchNavigation,
  type WorkbenchNavigation,
  type WorkbenchNavigationOptions,
} from './navigation/workbenchNavigation'
export {
  WorkbenchRenderer,
  type WorkbenchRendererMap,
  type WorkbenchRendererProps,
  type WorkbenchTemplateRenderer,
  type WorkbenchTemplateRendererProps,
} from './host/WorkbenchRenderer'
export {
  WorkbenchSurface,
  type WorkbenchSurfaceProps,
} from './host/WorkbenchSurface'
export { useWorkbenchController } from './host/useWorkbenchController'
export { useWorkbenchNavigation } from './host/useWorkbenchNavigation'
export {
  WorkbenchStyleSettings,
  type WorkbenchStyleSettingsProps,
} from './settings/WorkbenchStyleSettings'
export { workbenchTemplateRegistry } from './builtInWorkbenchTemplates'
