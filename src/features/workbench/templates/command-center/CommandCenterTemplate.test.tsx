import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FolderNode, VaultEntry, ViewFile } from '../../../../types'
import { buildWorkbenchModel } from '../../core/buildWorkbenchModel'
import { createWorkbenchController } from '../../core/workbenchController'
import type { WorkbenchNavigation } from '../../navigation/workbenchNavigation'
import { CommandCenterTemplate } from './CommandCenterTemplate'

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

const entries = [
  makeEntry({
    path: 'Projects/orbit.md',
    title: 'Project Orbit',
    isA: 'Project',
    status: 'Active',
    favorite: true,
    modifiedAt: 30,
  }),
  makeEntry({ path: 'notes/idea.md', title: 'Interface idea', modifiedAt: 20 }),
  makeEntry({ path: 'types/project.md', title: 'Project', isA: 'Type', order: 1 }),
]
const views: ViewFile[] = [{
  filename: 'active.view',
  definition: {
    name: 'Active work',
    icon: null,
    color: null,
    sort: null,
    filters: { all: [{ field: 'status', op: 'equals', value: 'Active' }] },
  },
}]
const folders: FolderNode[] = [{ name: 'Projects', path: 'Projects', children: [] }]

function setup(activeViewId = 'focus', sourceEntries = entries) {
  const controller = createWorkbenchController({ storage: window.localStorage })
  if (activeViewId !== 'focus') controller.selectView(activeViewId)
  const navigation: WorkbenchNavigation = {
    close: vi.fn(),
    openEntry: vi.fn(),
    openSelection: vi.fn(),
  }
  const model = buildWorkbenchModel({
    entries: sourceEntries,
    folders,
    views,
    activeSelection: { kind: 'filter', filter: 'all' },
    loading: false,
  })
  const onSelectView = vi.fn()
  render(
    <CommandCenterTemplate
      locale="en"
      model={model}
      navigation={navigation}
      onSelectView={onSelectView}
      snapshot={controller.getSnapshot()}
    />,
  )
  return { navigation, onSelectView }
}

describe('CommandCenterTemplate', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T14:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the accepted greeting, primary navigation, and focus hierarchy', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Good afternoon' })).toBeInTheDocument()
    expect(screen.getByText(/September 3, 2026/)).toBeInTheDocument()
    const header = screen.getByTestId('workbench-command-center-header')
    expect(header).toHaveAttribute('data-density', 'compact')
    expect(header).toHaveAttribute('data-grid', 'none')

    const dailyContext = screen.getByRole('complementary', { name: 'Daily context' })
    expect(dailyContext).toHaveAttribute('data-layout', 'horizontal-context-rail')
    expect(within(dailyContext).getAllByTestId('workbench-context-item')).toHaveLength(3)
    expect(screen.getByText('Weather not connected')).toBeInTheDocument()
    expect(screen.getByText('Almanac not connected')).toBeInTheDocument()

    const primaryNavigation = screen.getByRole('tablist', { name: 'Workbench views' })
    expect(primaryNavigation).toHaveAttribute('data-density', 'compact')
    const viewTabs = screen.getAllByRole('tab')
    expect(viewTabs).toHaveLength(3)
    expect(screen.getByRole('tab', { name: /01 Focus/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /02 Knowledge/ })).toHaveTextContent('Themes, links, and knowledge portals')
    expect(screen.getByRole('tab', { name: /03 Projects/ })).toHaveTextContent('In progress, blockers, and next actions')

    const dailyBrief = screen.getByTestId('workbench-daily-brief')
    expect(dailyBrief).toHaveAttribute('data-visual-baseline', 'focus-v7-compact')
    expect(within(dailyBrief).getByRole('heading', { name: 'Project Orbit' })).toBeInTheDocument()
    expect(within(dailyBrief).getByText('Original status')).toBeInTheDocument()
    expect(within(dailyBrief).getByText('Linked notes')).toBeInTheDocument()

    const dailyPulse = screen.getByTestId('workbench-daily-pulse')
    expect(dailyPulse).toHaveAttribute('data-visual-baseline', 'focus-v7-compact')
    expect(dailyPulse).toHaveTextContent('Recent updates')
    expect(dailyPulse).toHaveTextContent('Vault read-only snapshot')
    expect(screen.getAllByText('Project Orbit')).not.toHaveLength(0)
    expect(screen.getByText('Interface idea')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Active work/ })).toBeInTheDocument()
  })

  it('refreshes the local motivational sentence without a network action', () => {
    setup()

    const quote = screen.getByTestId('workbench-quote')
    const initialQuote = quote.textContent
    fireEvent.click(screen.getByRole('button', { name: 'Refresh quote' }))

    expect(quote.textContent).not.toBe(initialQuote)
  })

  it('opens notes and collection portals through the injected navigation boundary', () => {
    const { navigation } = setup()

    fireEvent.click(screen.getByRole('button', { name: /Open Project Orbit/ }))
    expect(navigation.openEntry).toHaveBeenCalledWith(entries[0])

    fireEvent.click(screen.getByRole('button', { name: "Open today's lead" }))
    expect(navigation.openEntry).toHaveBeenLastCalledWith(entries[0])

    fireEvent.click(screen.getByRole('button', { name: 'View related scope' }))
    expect(navigation.openSelection).toHaveBeenCalledWith({ kind: 'entity', entry: entries[0] })

    fireEvent.click(screen.getByRole('button', { name: /Active work/ }))
    expect(navigation.openSelection).toHaveBeenCalledWith({ kind: 'view', filename: 'active.view' })
  })

  it('delegates internal view changes without owning preference state', () => {
    const { onSelectView } = setup()

    fireEvent.click(screen.getByRole('tab', { name: /02 Knowledge/ }))

    expect(onSelectView).toHaveBeenCalledWith('knowledge')
  })

  it('renders the accepted Knowledge hierarchy from the read-only workbench model', () => {
    const typeNames = ['Project', 'Responsibility', 'Procedure', 'Person', 'Event', 'Topic']
    const knowledgeEntries = typeNames.flatMap((type, index) => [
      makeEntry({ path: `types/${type}.md`, title: type, isA: 'Type', order: index }),
      makeEntry({ path: `notes/${type}.md`, title: `${type} note`, isA: type }),
    ])
    setup('knowledge', knowledgeEntries)

    expect(screen.getByRole('heading', { name: 'Knowledge constellation' })).toBeInTheDocument()
    expect(screen.getByText('Connection overview')).toBeInTheDocument()
    expect(screen.getByText('Recent knowledge stream')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE SIGNAL / 02')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Knowledge portals' })).toBeInTheDocument()
    expect(screen.getByText('TYPES / Types')).toBeInTheDocument()
    expect(screen.getByText('FOLDERS / Folders')).toBeInTheDocument()
    expect(screen.getByText('VIEWS / Saved views')).toBeInTheDocument()

    const graph = screen.getByRole('region', { name: 'Knowledge constellation' })
    expect(within(graph).getByRole('button', { name: 'Inspect Project knowledge cluster' })).toBeInTheDocument()
    expect(within(graph).getAllByRole('button', { name: /knowledge cluster/ })).toHaveLength(6)
    expect(screen.getByTestId('workbench-knowledge-map-canvas')).toHaveStyle({
      backgroundSize: 'auto, 28px 28px, 28px 28px',
    })
    expect(screen.getByTestId('workbench-knowledge-node-field').querySelectorAll('[data-node-slot]')).toHaveLength(6)
    expect(screen.getByText('Linked notes')).toBeInTheDocument()
    expect(screen.queryByText('AI score')).not.toBeInTheDocument()
  })

  it('inspects knowledge clusters and navigates through the existing adapters', () => {
    const { navigation } = setup('knowledge')

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Project knowledge cluster' }))
    const inspector = screen.getByTestId('workbench-knowledge-inspector')
    expect(inspector).toHaveTextContent('Project')
    expect(within(inspector).getByText('1')).toBeInTheDocument()
    expect(inspector).toHaveTextContent('Active notes')

    fireEvent.click(screen.getByRole('button', { name: 'Open Project Type' }))
    expect(navigation.openSelection).toHaveBeenCalledWith({ kind: 'sectionGroup', type: 'Project' })
  })

  it('dispatches the accepted Projects hierarchy instead of the placeholder', () => {
    setup('projects')

    expect(screen.getByRole('heading', { name: 'Project execution board' })).toBeInTheDocument()
    expect(screen.getByText('Execution pulse')).toBeInTheDocument()
    expect(screen.getByText('Next step queue')).toBeInTheDocument()
    expect(screen.getByText('PROJECT SIGNAL / 03')).toBeInTheDocument()
    expect(screen.queryByText('This workbench view is reserved for the next implementation slice.')).not.toBeInTheDocument()
  })

  it('shows accessible loading and empty states', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const model = buildWorkbenchModel({
      entries: [],
      folders: [],
      views: [],
      activeSelection: { kind: 'filter', filter: 'all' },
      loading: true,
    })

    const { rerender } = render(
      <CommandCenterTemplate
        locale="en"
        model={model}
        navigation={{ close: vi.fn(), openEntry: vi.fn(), openSelection: vi.fn() }}
        onSelectView={vi.fn()}
        snapshot={controller.getSnapshot()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Building your workbench')

    rerender(
      <CommandCenterTemplate
        locale="en"
        model={{ ...model, loading: false }}
        navigation={{ close: vi.fn(), openEntry: vi.fn(), openSelection: vi.fn() }}
        onSelectView={vi.fn()}
        snapshot={controller.getSnapshot()}
      />,
    )
    expect(screen.getByText('Your recent notes will appear here')).toBeInTheDocument()
    expect(screen.getByText('Views, Types, and folders will appear here')).toBeInTheDocument()
  })
})
