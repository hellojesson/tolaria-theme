import type { FolderNode, SidebarSelection, VaultEntry, ViewFile } from '../../../types'
import { filterEntries } from '../../../utils/noteListHelpers'
import type {
  WorkbenchDestinationSummary,
  WorkbenchKnowledgeCluster,
  WorkbenchModel,
  WorkbenchRelationshipSummary,
  WorkbenchSourceData,
  WorkbenchStatusGroup,
} from './workbenchTypes'

export const WORKBENCH_ENTRY_LIMIT = 6
export const WORKBENCH_DESTINATION_LIMIT = 8
export const WORKBENCH_STATUS_GROUP_LIMIT = 6

function isActiveMarkdownNote(entry: VaultEntry): boolean {
  const isMarkdown = entry.fileKind === undefined || entry.fileKind === 'markdown'
  return isMarkdown && !entry.archived && entry.isA !== 'Type'
}

function displayTimestamp(entry: VaultEntry): number {
  return entry.modifiedAt ?? entry.createdAt ?? 0
}

function compareRecentEntries(left: VaultEntry, right: VaultEntry): number {
  return displayTimestamp(right) - displayTimestamp(left)
    || left.path.localeCompare(right.path)
}

function recentEntries(entries: readonly VaultEntry[]): VaultEntry[] {
  return [...entries].sort(compareRecentEntries).slice(0, WORKBENCH_ENTRY_LIMIT)
}

function withOptionalRoot<T extends SidebarSelection>(
  selection: T,
  rootPath: string | undefined,
): T {
  return rootPath ? { ...selection, rootPath } : selection
}

function destinationId(kind: string, identity: string, rootPath?: string): string {
  return `${kind}:${rootPath ?? 'default'}:${identity}`
}

function compareOrderedLabels(
  left: { order?: number | null; label: string },
  right: { order?: number | null; label: string },
): number {
  return (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
    || left.label.localeCompare(right.label)
}

function buildSavedViewSummaries(
  entries: VaultEntry[],
  views: readonly ViewFile[],
): WorkbenchDestinationSummary[] {
  return views
    .map((view) => ({
      view,
      order: view.definition.order,
      label: view.definition.name,
    }))
    .sort(compareOrderedLabels)
    .slice(0, WORKBENCH_DESTINATION_LIMIT)
    .map(({ view, label }) => {
      const selection = withOptionalRoot<Extract<SidebarSelection, { kind: 'view' }>>(
        { kind: 'view', filename: view.filename },
        view.rootPath,
      )
      return {
        id: destinationId('view', view.filename, view.rootPath),
        kind: 'view',
        label,
        count: filterEntries(entries, selection, { views: [...views] }).length,
        selection,
      }
    })
}

function isVisibleTypeDefinition(entry: VaultEntry): boolean {
  return entry.isA === 'Type' && !entry.archived && entry.visible !== false
}

function typeOrder(entry: VaultEntry): number {
  return entry.order ?? Number.MAX_SAFE_INTEGER
}

function shouldReplaceTypeDefinition(
  current: VaultEntry | undefined,
  candidate: VaultEntry,
): boolean {
  return current === undefined || typeOrder(candidate) < typeOrder(current)
}

function visibleTypeDefinitions(entries: readonly VaultEntry[]): VaultEntry[] {
  const definitions = new Map<string, VaultEntry>()
  for (const entry of entries) {
    if (!isVisibleTypeDefinition(entry)) continue
    const current = definitions.get(entry.title)
    if (shouldReplaceTypeDefinition(current, entry)) {
      definitions.set(entry.title, entry)
    }
  }
  return [...definitions.values()]
}

function orderedTypeDefinitions(entries: readonly VaultEntry[]): VaultEntry[] {
  return visibleTypeDefinitions(entries)
    .map((entry) => ({ entry, order: entry.order, label: entry.sidebarLabel ?? entry.title }))
    .sort(compareOrderedLabels)
    .slice(0, WORKBENCH_DESTINATION_LIMIT)
    .map(({ entry }) => entry)
}

function buildTypeSummaries(entries: VaultEntry[]): WorkbenchDestinationSummary[] {
  return orderedTypeDefinitions(entries)
    .map((entry) => {
      const label = entry.sidebarLabel ?? entry.title
      const selection: SidebarSelection = { kind: 'sectionGroup', type: entry.title }
      return {
        id: destinationId('type', entry.title),
        kind: 'type',
        label,
        count: filterEntries(entries, selection).length,
        selection,
      }
    })
}

function buildKnowledgeClusters(entries: VaultEntry[]): WorkbenchKnowledgeCluster[] {
  return orderedTypeDefinitions(entries).map((entry) => {
    const selection = { kind: 'sectionGroup', type: entry.title } as const
    const matchingEntries = filterEntries(entries, selection).filter(isActiveMarkdownNote)
    return {
      id: destinationId('knowledge', entry.title),
      label: entry.sidebarLabel ?? entry.title,
      noteCount: matchingEntries.length,
      linkedEntryCount: matchingEntries.filter(hasRelationships).length,
      selection,
    }
  })
}

function topLevelFolders(folders: readonly FolderNode[]): FolderNode[] {
  const destinations = folders.flatMap((folder) => folder.path ? [folder] : folder.children)
  const unique = new Map<string, FolderNode>()
  for (const folder of destinations) {
    unique.set(`${folder.rootPath ?? 'default'}\u0000${folder.path}`, folder)
  }
  return [...unique.values()]
}

function buildFolderSummaries(
  entries: VaultEntry[],
  folders: readonly FolderNode[],
): WorkbenchDestinationSummary[] {
  return topLevelFolders(folders)
    .map((folder) => ({ folder, label: folder.name }))
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(0, WORKBENCH_DESTINATION_LIMIT)
    .map(({ folder, label }) => {
      const selection = withOptionalRoot<Extract<SidebarSelection, { kind: 'folder' }>>(
        { kind: 'folder', path: folder.path },
        folder.rootPath,
      )
      return {
        id: destinationId('folder', folder.path, folder.rootPath),
        kind: 'folder',
        label,
        count: filterEntries(entries, selection).length,
        selection,
      }
    })
}

function meaningfulStatus(entry: VaultEntry): string | null {
  const status = entry.status?.trim()
  return status ? status : null
}

interface StatusGroupProjection {
  readonly groups: WorkbenchStatusGroup[]
  readonly totalCount: number
}

function buildStatusGroups(entries: readonly VaultEntry[]): StatusGroupProjection {
  const groups = new Map<string, VaultEntry[]>()
  for (const entry of entries) {
    const status = meaningfulStatus(entry)
    if (!status) continue
    const group = groups.get(status) ?? []
    group.push(entry)
    groups.set(status, group)
  }

  const summaries = [...groups.entries()]
    .map(([status, statusEntries]) => ({
      status,
      count: statusEntries.length,
      entries: recentEntries(statusEntries),
    }))
    .sort((left, right) => right.count - left.count || left.status.localeCompare(right.status))
  return {
    groups: summaries.slice(0, WORKBENCH_STATUS_GROUP_LIMIT),
    totalCount: summaries.length,
  }
}

function relationshipReferenceCount(entry: VaultEntry): number {
  return Object.values(entry.relationships).reduce((count, references) => count + references.length, 0)
}

function hasRelationships(entry: VaultEntry): boolean {
  return entry.outgoingLinks.length > 0 || relationshipReferenceCount(entry) > 0
}

function buildRelationshipSummary(entries: readonly VaultEntry[]): WorkbenchRelationshipSummary {
  return entries.reduce<WorkbenchRelationshipSummary>((summary, entry) => ({
    linkedEntryCount: summary.linkedEntryCount + (hasRelationships(entry) ? 1 : 0),
    outgoingLinkCount: summary.outgoingLinkCount + entry.outgoingLinks.length,
    relationshipReferenceCount:
      summary.relationshipReferenceCount + relationshipReferenceCount(entry),
  }), {
    linkedEntryCount: 0,
    outgoingLinkCount: 0,
    relationshipReferenceCount: 0,
  })
}

export function buildWorkbenchModel(source: WorkbenchSourceData): WorkbenchModel {
  const allEntries = [...source.entries]
  const contentEntries = allEntries.filter(isActiveMarkdownNote)
  const favorites = contentEntries.filter((entry) => entry.favorite)
  const actionable = contentEntries.filter((entry) => meaningfulStatus(entry) !== null)
  const related = contentEntries.filter(hasRelationships)
  const savedViewSummaries = buildSavedViewSummaries(allEntries, source.views)
  const typeSummaries = buildTypeSummaries(allEntries)
  const folderSummaries = buildFolderSummaries(allEntries, source.folders)
  const statusProjection = buildStatusGroups(contentEntries)

  return {
    loading: source.loading,
    activeSelection: source.activeSelection,
    summary: {
      noteCount: contentEntries.length,
      favoriteCount: favorites.length,
      savedViewCount: source.views.length,
      typeCount: visibleTypeDefinitions(allEntries).length,
      folderCount: topLevelFolders(source.folders).length,
      statusGroupCount: statusProjection.totalCount,
    },
    recentEntries: recentEntries(contentEntries),
    actionableEntries: recentEntries(actionable),
    favoriteEntries: recentEntries(favorites),
    knowledgeStreamEntries: recentEntries(related),
    knowledgeClusters: buildKnowledgeClusters(allEntries),
    savedViewSummaries,
    typeSummaries,
    folderSummaries,
    statusGroups: statusProjection.groups,
    relationshipSummary: buildRelationshipSummary(contentEntries),
  }
}
