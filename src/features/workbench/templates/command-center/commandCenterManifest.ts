import {
  WORKBENCH_TEMPLATE_SCHEMA_VERSION,
  type WorkbenchTemplateDefinition,
} from '../../core/workbenchTypes'

export const COMMAND_CENTER_TEMPLATE: WorkbenchTemplateDefinition = {
  id: 'command-center',
  schemaVersion: WORKBENCH_TEMPLATE_SCHEMA_VERSION,
  labelKey: 'workbench.templates.commandCenter',
  defaultViewId: 'focus',
  views: [
    {
      id: 'focus',
      labelKey: 'workbench.views.focus',
      widgetIds: ['daily-brief', 'daily-pulse', 'action-queue', 'quick-portals'],
    },
    {
      id: 'knowledge',
      labelKey: 'workbench.views.knowledge',
      widgetIds: ['knowledge-map', 'knowledge-stream', 'quick-portals'],
    },
    {
      id: 'projects',
      labelKey: 'workbench.views.projects',
      widgetIds: ['project-lanes', 'action-queue', 'daily-pulse'],
    },
  ],
  defaultLayout: [
    { widgetId: 'daily-brief', viewId: 'focus', column: 1, row: 1, columnSpan: 8, rowSpan: 1 },
    { widgetId: 'daily-pulse', viewId: 'focus', column: 9, row: 1, columnSpan: 4, rowSpan: 1 },
    { widgetId: 'action-queue', viewId: 'focus', column: 1, row: 2, columnSpan: 8, rowSpan: 2 },
    { widgetId: 'quick-portals', viewId: 'focus', column: 9, row: 2, columnSpan: 4, rowSpan: 2 },
    { widgetId: 'knowledge-map', viewId: 'knowledge', column: 1, row: 1, columnSpan: 8, rowSpan: 2 },
    { widgetId: 'knowledge-stream', viewId: 'knowledge', column: 9, row: 1, columnSpan: 4, rowSpan: 2 },
    { widgetId: 'quick-portals', viewId: 'knowledge', column: 1, row: 3, columnSpan: 12, rowSpan: 1 },
    { widgetId: 'project-lanes', viewId: 'projects', column: 1, row: 1, columnSpan: 8, rowSpan: 2 },
    { widgetId: 'action-queue', viewId: 'projects', column: 9, row: 1, columnSpan: 4, rowSpan: 2 },
    { widgetId: 'daily-pulse', viewId: 'projects', column: 1, row: 3, columnSpan: 12, rowSpan: 1 },
  ],
}
