import { describe, expect, it } from 'vitest'
import type { FolderNode, SidebarSelection, VaultEntry, ViewFile } from '../../../types'
import {
  WORKBENCH_ENTRY_LIMIT,
  WORKBENCH_STATUS_GROUP_LIMIT,
  buildWorkbenchModel,
} from './buildWorkbenchModel'

function makeEntry(overrides: Partial<VaultEntry> & Pick<VaultEntry, 'path' | 'title'>): VaultEntry {
  return {
    path: overrides.path,
    filename: overrides.path.split('/').pop() ?? overrides.path,
    title: overrides.title,
    isA: null,
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: null,
    archived: false,
    modifiedAt: null,
    createdAt: null,
    fileSize: 0,
    snippet: '',
    wordCount: 0,
    relationships: {},
    icon: null,
    color: null,
    order: null,
    sidebarLabel: null,
    template: null,
    sort: null,
    view: null,
    noteWidth: null,
    display: null,
    visible: true,
    organized: true,
    favorite: false,
    favoriteIndex: null,
    listPropertiesDisplay: [],
    outgoingLinks: [],
    properties: {},
    hasH1: true,
    fileKind: 'markdown',
    ...overrides,
  }
}

const activeSelection: SidebarSelection = { kind: 'filter', filter: 'all' }

describe('buildWorkbenchModel', () => {
  it('creates bounded, recent-first reading lists from active Markdown notes only', () => {
    const entries = Array.from({ length: WORKBENCH_ENTRY_LIMIT + 2 }, (_, index) => makeEntry({
      path: `notes/${index}.md`,
      title: `Note ${index}`,
      modifiedAt: index + 1,
      favorite: index % 2 === 0,
      status: index % 3 === 0 ? 'In progress' : null,
    }))
    entries.push(makeEntry({
      path: 'types/project.md',
      title: 'Project',
      isA: 'Type',
      modifiedAt: 100,
    }))
    entries.push(makeEntry({
      path: 'archive.md',
      title: 'Archived',
      archived: true,
      modifiedAt: 200,
    }))
    entries.push(makeEntry({
      path: 'image.png',
      title: 'Image',
      fileKind: 'binary',
      modifiedAt: 300,
    }))

    const originalOrder = entries.map((entry) => entry.path)
    const model = buildWorkbenchModel({
      entries,
      folders: [],
      views: [],
      activeSelection,
      loading: false,
    })

    expect(model.recentEntries).toHaveLength(WORKBENCH_ENTRY_LIMIT)
    expect(model.recentEntries.map((entry) => entry.title)).toEqual([
      'Note 7', 'Note 6', 'Note 5', 'Note 4', 'Note 3', 'Note 2',
    ])
    expect(model.favoriteEntries.every((entry) => entry.favorite)).toBe(true)
    expect(model.actionableEntries.every((entry) => Boolean(entry.status))).toBe(true)
    expect(entries.map((entry) => entry.path)).toEqual(originalOrder)
  })

  it('builds saved-view, type, and top-level-folder destinations with canonical counts', () => {
    const entries = [
      makeEntry({ path: 'Projects/alpha.md', title: 'Alpha', isA: 'Project', status: 'Active' }),
      makeEntry({ path: 'Projects/beta.md', title: 'Beta', isA: 'Project', status: 'Paused' }),
      makeEntry({ path: 'Archive/old.md', title: 'Old', isA: 'Project', archived: true }),
      makeEntry({ path: 'types/project.md', title: 'Project', isA: 'Type', order: 1 }),
    ]
    const views: ViewFile[] = [{
      filename: 'active-projects.view',
      definition: {
        name: 'Active projects',
        icon: null,
        color: null,
        order: 1,
        sort: null,
        filters: { all: [{ field: 'status', op: 'equals', value: 'Active' }] },
      },
    }]
    const folders: FolderNode[] = [{
      name: 'Projects',
      path: 'Projects',
      children: [{ name: 'Nested', path: 'Projects/Nested', children: [] }],
    }]

    const model = buildWorkbenchModel({ entries, folders, views, activeSelection, loading: false })

    expect(model.savedViewSummaries).toEqual([expect.objectContaining({
      kind: 'view',
      label: 'Active projects',
      count: 1,
      selection: { kind: 'view', filename: 'active-projects.view' },
    })])
    expect(model.typeSummaries).toEqual([expect.objectContaining({
      kind: 'type',
      label: 'Project',
      count: 2,
      selection: { kind: 'sectionGroup', type: 'Project' },
    })])
    expect(model.folderSummaries).toEqual([expect.objectContaining({
      kind: 'folder',
      label: 'Projects',
      count: 2,
      selection: { kind: 'folder', path: 'Projects' },
    })])
  })

  it('derives open-ended status and relationship summaries without fixed vocabularies', () => {
    const entries = [
      makeEntry({
        path: 'one.md',
        title: 'One',
        modifiedAt: 20,
        status: 'Waiting for Alice',
        outgoingLinks: ['Two'],
        relationships: { Supports: ['Two', 'Three'] },
      }),
      makeEntry({
        path: 'two.md',
        title: 'Two',
        modifiedAt: 10,
        status: 'Waiting for Alice',
      }),
      makeEntry({
        path: 'three.md',
        title: 'Three',
        modifiedAt: 5,
        status: 'Someday',
        relationships: { DependsOn: ['One'] },
      }),
    ]

    const model = buildWorkbenchModel({
      entries,
      folders: [],
      views: [],
      activeSelection,
      loading: false,
    })

    expect(model.statusGroups.map(({ status, count }) => ({ status, count }))).toEqual([
      { status: 'Waiting for Alice', count: 2 },
      { status: 'Someday', count: 1 },
    ])
    expect(model.relationshipSummary).toEqual({
      linkedEntryCount: 2,
      outgoingLinkCount: 1,
      relationshipReferenceCount: 3,
    })
    expect(model.knowledgeStreamEntries.map((entry) => entry.title)).toEqual(['One', 'Three'])
  })

  it('builds Type-centered knowledge clusters with real relationship coverage', () => {
    const entries = [
      makeEntry({
        path: 'projects/linked.md',
        title: 'Linked project',
        isA: 'Project',
        outgoingLinks: ['Project plan'],
      }),
      makeEntry({ path: 'projects/isolated.md', title: 'Isolated project', isA: 'Project' }),
      makeEntry({
        path: 'topics/linked.md',
        title: 'Linked topic',
        isA: 'Topic',
        relationships: { Supports: ['Linked project'] },
      }),
      makeEntry({ path: 'types/project.md', title: 'Project', isA: 'Type', order: 1 }),
      makeEntry({ path: 'types/topic.md', title: 'Topic', isA: 'Type', order: 2 }),
    ]

    const model = buildWorkbenchModel({
      entries,
      folders: [],
      views: [],
      activeSelection,
      loading: false,
    })

    expect(model.knowledgeClusters).toEqual([
      expect.objectContaining({
        label: 'Project',
        noteCount: 2,
        linkedEntryCount: 1,
        selection: { kind: 'sectionGroup', type: 'Project' },
      }),
      expect.objectContaining({
        label: 'Topic',
        noteCount: 1,
        linkedEntryCount: 1,
        selection: { kind: 'sectionGroup', type: 'Topic' },
      }),
    ])
  })

  it('returns an explicit empty loading-safe model', () => {
    const model = buildWorkbenchModel({
      entries: [],
      folders: [],
      views: [],
      activeSelection,
      loading: true,
    })

    expect(model.loading).toBe(true)
    expect(model.summary.noteCount).toBe(0)
    expect(model.recentEntries).toEqual([])
    expect(model.statusGroups).toEqual([])
  })

  it('keeps the total status count while bounding rendered groups', () => {
    const entries = Array.from({ length: WORKBENCH_STATUS_GROUP_LIMIT + 2 }, (_, index) => makeEntry({
      path: `status-${index}.md`,
      title: `Status ${index}`,
      status: `Custom ${index}`,
    }))

    const model = buildWorkbenchModel({
      entries,
      folders: [],
      views: [],
      activeSelection,
      loading: false,
    })

    expect(model.statusGroups).toHaveLength(WORKBENCH_STATUS_GROUP_LIMIT)
    expect(model.summary.statusGroupCount).toBe(WORKBENCH_STATUS_GROUP_LIMIT + 2)
  })
})
