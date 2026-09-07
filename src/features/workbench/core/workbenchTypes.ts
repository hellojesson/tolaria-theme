import type { FolderNode, SidebarSelection, VaultEntry, ViewFile } from '../../../types'

export const WORKBENCH_TEMPLATE_SCHEMA_VERSION = 1 as const

export type WorkbenchTemplateId = string
export type WorkbenchViewId = string
export type WorkbenchWidgetId = string

export interface WorkbenchTemplateView {
  readonly id: WorkbenchViewId
  readonly labelKey: string
  readonly widgetIds: readonly WorkbenchWidgetId[]
}

export interface WorkbenchWidgetPlacement {
  readonly widgetId: WorkbenchWidgetId
  readonly viewId: WorkbenchViewId
  readonly column: number
  readonly row: number
  readonly columnSpan: number
  readonly rowSpan: number
  readonly minColumnSpan?: number
  readonly maxColumnSpan?: number
}

export interface WorkbenchTemplateDefinition {
  readonly id: WorkbenchTemplateId
  readonly schemaVersion: typeof WORKBENCH_TEMPLATE_SCHEMA_VERSION
  readonly labelKey: string
  readonly defaultViewId: WorkbenchViewId
  readonly views: readonly WorkbenchTemplateView[]
  readonly defaultLayout: readonly WorkbenchWidgetPlacement[]
}

export interface WorkbenchTemplateRegistry {
  defaultTemplate(): WorkbenchTemplateDefinition
  get(id: WorkbenchTemplateId): WorkbenchTemplateDefinition | undefined
  list(): readonly WorkbenchTemplateDefinition[]
  resolve(id: WorkbenchTemplateId | null | undefined): WorkbenchTemplateDefinition
}

export interface WorkbenchPreferencesV1 {
  readonly schemaVersion: typeof WORKBENCH_TEMPLATE_SCHEMA_VERSION
  readonly templateId: WorkbenchTemplateId
  readonly activeViewId: WorkbenchViewId
}

export interface WorkbenchSourceData {
  readonly entries: readonly VaultEntry[]
  readonly folders: readonly FolderNode[]
  readonly views: readonly ViewFile[]
  readonly activeSelection: SidebarSelection
  readonly loading: boolean
}

export type WorkbenchDestinationKind = 'folder' | 'type' | 'view'

export interface WorkbenchDestinationSummary {
  readonly id: string
  readonly kind: WorkbenchDestinationKind
  readonly label: string
  readonly count: number
  readonly selection: SidebarSelection
}

export interface WorkbenchStatusGroup {
  readonly status: string
  readonly count: number
  readonly entries: readonly VaultEntry[]
}

export interface WorkbenchRelationshipSummary {
  readonly linkedEntryCount: number
  readonly outgoingLinkCount: number
  readonly relationshipReferenceCount: number
}

export interface WorkbenchKnowledgeCluster {
  readonly id: string
  readonly label: string
  readonly noteCount: number
  readonly linkedEntryCount: number
  readonly selection: Extract<SidebarSelection, { kind: 'sectionGroup' }>
}

export interface WorkbenchSummary {
  readonly noteCount: number
  readonly favoriteCount: number
  readonly savedViewCount: number
  readonly typeCount: number
  readonly folderCount: number
  readonly statusGroupCount: number
}

export interface WorkbenchModel {
  readonly loading: boolean
  readonly activeSelection: SidebarSelection
  readonly summary: WorkbenchSummary
  readonly recentEntries: readonly VaultEntry[]
  readonly actionableEntries: readonly VaultEntry[]
  readonly favoriteEntries: readonly VaultEntry[]
  readonly knowledgeStreamEntries: readonly VaultEntry[]
  readonly knowledgeClusters: readonly WorkbenchKnowledgeCluster[]
  readonly savedViewSummaries: readonly WorkbenchDestinationSummary[]
  readonly typeSummaries: readonly WorkbenchDestinationSummary[]
  readonly folderSummaries: readonly WorkbenchDestinationSummary[]
  readonly statusGroups: readonly WorkbenchStatusGroup[]
  readonly relationshipSummary: WorkbenchRelationshipSummary
}
