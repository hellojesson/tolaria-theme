import {
  WORKBENCH_TEMPLATE_SCHEMA_VERSION,
  type WorkbenchTemplateDefinition,
  type WorkbenchTemplateRegistry,
  type WorkbenchWidgetPlacement,
} from './workbenchTypes'

function requireNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`Workbench template ${field} must not be empty`)
}

function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Workbench placement ${field} must be a positive integer`)
  }
}

function validatePlacement(
  placement: WorkbenchWidgetPlacement,
  viewWidgets: ReadonlyMap<string, ReadonlySet<string>>,
): void {
  const widgets = viewWidgets.get(placement.viewId)
  if (!widgets) throw new Error(`Workbench placement references unknown view: ${placement.viewId}`)
  if (!widgets.has(placement.widgetId)) {
    throw new Error(`Workbench placement references unknown widget: ${placement.widgetId}`)
  }
  requirePositiveInteger(placement.column, 'column')
  requirePositiveInteger(placement.row, 'row')
  requirePositiveInteger(placement.columnSpan, 'columnSpan')
  requirePositiveInteger(placement.rowSpan, 'rowSpan')
  if (placement.minColumnSpan !== undefined) requirePositiveInteger(placement.minColumnSpan, 'minColumnSpan')
  if (placement.maxColumnSpan !== undefined) requirePositiveInteger(placement.maxColumnSpan, 'maxColumnSpan')
  if (
    placement.minColumnSpan !== undefined
    && placement.maxColumnSpan !== undefined
    && placement.minColumnSpan > placement.maxColumnSpan
  ) {
    throw new Error('Workbench placement minColumnSpan must not exceed maxColumnSpan')
  }
}

function buildViewWidgets(
  template: WorkbenchTemplateDefinition,
): ReadonlyMap<string, ReadonlySet<string>> {
  if (template.views.length === 0) throw new Error('Workbench template must declare at least one view')
  const viewWidgets = new Map<string, ReadonlySet<string>>()
  for (const view of template.views) {
    requireNonEmpty(view.id, 'view id')
    if (viewWidgets.has(view.id)) throw new Error(`Duplicate workbench view id: ${view.id}`)
    const widgets = new Set(view.widgetIds)
    if (widgets.size !== view.widgetIds.length) {
      throw new Error(`Duplicate workbench widget id in view: ${view.id}`)
    }
    viewWidgets.set(view.id, widgets)
  }
  return viewWidgets
}

function validateDefaultView(
  template: WorkbenchTemplateDefinition,
  viewWidgets: ReadonlyMap<string, ReadonlySet<string>>,
): void {
  if (!viewWidgets.has(template.defaultViewId)) {
    throw new Error(`Workbench default view is not declared: ${template.defaultViewId}`)
  }
}

function validateTemplateLayout(
  template: WorkbenchTemplateDefinition,
  viewWidgets: ReadonlyMap<string, ReadonlySet<string>>,
): void {
  const placements = new Set<string>()
  for (const placement of template.defaultLayout) {
    validatePlacement(placement, viewWidgets)
    const key = `${placement.viewId}\u0000${placement.widgetId}`
    if (placements.has(key)) throw new Error(`Duplicate workbench placement: ${placement.widgetId}`)
    placements.add(key)
  }

  for (const [viewId, widgets] of viewWidgets) {
    for (const widgetId of widgets) {
      if (!placements.has(`${viewId}\u0000${widgetId}`)) {
        throw new Error(`Missing workbench placement for widget: ${widgetId}`)
      }
    }
  }
}

function validateTemplate(template: WorkbenchTemplateDefinition): void {
  requireNonEmpty(template.id, 'id')
  requireNonEmpty(template.labelKey, 'labelKey')
  if (template.schemaVersion !== WORKBENCH_TEMPLATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported workbench template schema: ${template.schemaVersion}`)
  }
  const viewWidgets = buildViewWidgets(template)
  validateDefaultView(template, viewWidgets)
  validateTemplateLayout(template, viewWidgets)
}

function freezeTemplate(template: WorkbenchTemplateDefinition): WorkbenchTemplateDefinition {
  const views = template.views.map((view) => Object.freeze({
    ...view,
    widgetIds: Object.freeze([...view.widgetIds]),
  }))
  const defaultLayout = template.defaultLayout.map((placement) => Object.freeze({ ...placement }))
  return Object.freeze({
    ...template,
    views: Object.freeze(views),
    defaultLayout: Object.freeze(defaultLayout),
  })
}

export function createWorkbenchTemplateRegistry(
  definitions: readonly WorkbenchTemplateDefinition[],
  defaultTemplateId: string,
): WorkbenchTemplateRegistry {
  if (definitions.length === 0) throw new Error('Workbench registry must contain a template')

  const templates = definitions.map((definition) => {
    validateTemplate(definition)
    return freezeTemplate(definition)
  })
  const byId = new Map<string, WorkbenchTemplateDefinition>()
  for (const template of templates) {
    if (byId.has(template.id)) throw new Error(`Duplicate template id: ${template.id}`)
    byId.set(template.id, template)
  }

  const fallback = byId.get(defaultTemplateId)
  if (!fallback) throw new Error(`Unknown default workbench template: ${defaultTemplateId}`)
  const readonlyTemplates = Object.freeze([...templates])

  return Object.freeze({
    defaultTemplate: () => fallback,
    get: (id: string) => byId.get(id),
    list: () => readonlyTemplates,
    resolve: (id: string | null | undefined) => (id ? byId.get(id) : undefined) ?? fallback,
  })
}
