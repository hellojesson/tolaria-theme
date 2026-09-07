import { describe, expect, it, vi } from 'vitest'
import type { SidebarSelection, VaultEntry } from '../../../types'
import { createWorkbenchNavigation } from './workbenchNavigation'

function makeEntry(): VaultEntry {
  return {
    path: 'notes/example.md',
    filename: 'example.md',
    title: 'Example',
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
    visible: true,
    organized: true,
    favorite: false,
    favoriteIndex: null,
    listPropertiesDisplay: [],
    outgoingLinks: [],
    properties: {},
    hasH1: true,
    fileKind: 'markdown',
  }
}

describe('workbench navigation adapter', () => {
  it('closes the workbench before forwarding the original collection selection', async () => {
    const order: string[] = []
    const onClose = vi.fn(() => { order.push('close') })
    const onOpenSelection = vi.fn((selection: SidebarSelection) => {
      order.push(`selection:${selection.kind}`)
    })
    const navigation = createWorkbenchNavigation({
      onClose,
      onOpenSelection,
      onOpenEntry: vi.fn(),
    })
    const selection: SidebarSelection = { kind: 'folder', path: 'Projects' }

    await navigation.openSelection(selection)

    expect(order).toEqual(['close', 'selection:folder'])
    expect(onOpenSelection).toHaveBeenCalledWith(selection)
    expect(onOpenSelection.mock.calls[0][0]).toBe(selection)
  })

  it('closes before awaiting Tolaria note selection', async () => {
    const order: string[] = []
    const entry = makeEntry()
    const navigation = createWorkbenchNavigation({
      onClose: () => { order.push('close') },
      onOpenSelection: vi.fn(),
      onOpenEntry: async (selectedEntry) => {
        order.push('entry-start')
        expect(selectedEntry).toBe(entry)
        await Promise.resolve()
        order.push('entry-end')
      },
    })

    await navigation.openEntry(entry)

    expect(order).toEqual(['close', 'entry-start', 'entry-end'])
  })

  it('remains closed when an upstream navigation callback rejects', async () => {
    const onClose = vi.fn()
    const navigation = createWorkbenchNavigation({
      onClose,
      onOpenSelection: vi.fn(async () => { throw new Error('navigation failed') }),
      onOpenEntry: vi.fn(),
    })

    await expect(navigation.openSelection({ kind: 'filter', filter: 'all' })).rejects.toThrow(
      'navigation failed',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('exposes the same close boundary for an explicit close action', () => {
    const onClose = vi.fn()
    const navigation = createWorkbenchNavigation({
      onClose,
      onOpenSelection: vi.fn(),
      onOpenEntry: vi.fn(),
    })

    navigation.close()

    expect(onClose).toHaveBeenCalledOnce()
  })
})
