import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { VaultEntry } from '../../../../types'
import { buildWorkbenchModel } from '../../core/buildWorkbenchModel'
import type { WorkbenchNavigation } from '../../navigation/workbenchNavigation'
import { CommandCenterProjectsView } from './CommandCenterProjectsView'

function makeEntry(overrides: Partial<VaultEntry> & Pick<VaultEntry, 'path' | 'title'>): VaultEntry {
  return {
    path: overrides.path,
    filename: overrides.path.split('/').pop() ?? overrides.path,
    title: overrides.title,
    isA: 'Project',
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

const activePrimary = makeEntry({
  path: 'projects/workbench.md',
  title: 'Workbench template',
  status: 'Active',
  modifiedAt: 1_788_400_000,
  outgoingLinks: ['Theme release'],
  relationships: { Supports: ['Knowledge map'] },
})
const activeSecondary = makeEntry({
  path: 'projects/theme.md',
  title: 'Theme release',
  status: 'Active',
  modifiedAt: 1_788_300_000,
})
const waiting = makeEntry({
  path: 'projects/knowledge.md',
  title: 'Knowledge mapping',
  status: 'Waiting for review',
  modifiedAt: 1_788_200_000,
})
const ready = makeEntry({
  path: 'projects/code-label.md',
  title: 'Code label fix',
  status: 'Ready',
  modifiedAt: 1_788_100_000,
})

function setup(entries: readonly VaultEntry[] = [activePrimary, activeSecondary, waiting, ready]) {
  const navigation: WorkbenchNavigation = {
    close: vi.fn(),
    openEntry: vi.fn(),
    openSelection: vi.fn(),
  }
  const model = buildWorkbenchModel({
    entries,
    folders: [],
    views: [],
    activeSelection: { kind: 'filter', filter: 'all' },
    loading: false,
  })

  render(<CommandCenterProjectsView locale="en" model={model} navigation={navigation} />)
  return { model, navigation }
}

describe('CommandCenterProjectsView', () => {
  it('renders the accepted project hierarchy from real status groups', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Project execution board' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Execution pulse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Next step queue' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project signal stream' })).toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Status group Active' })).toHaveTextContent('2')
    expect(screen.getByRole('region', { name: 'Status group Ready' })).toHaveTextContent('1')
    expect(screen.getByRole('region', { name: 'Status group Waiting for review' })).toHaveTextContent('1')
    expect(screen.getByTestId('workbench-project-board-grid')).toHaveStyle({
      backgroundSize: 'auto, 28px 28px, 28px 28px',
    })
    expect(screen.getAllByTestId('workbench-project-timeline-entry')).toHaveLength(4)
    expect(screen.queryByText(/completion rate/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/AI score/i)).not.toBeInTheDocument()
  })

  it('selects a project without navigation and opens it through the injected adapter', () => {
    const { navigation } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Inspect Knowledge mapping' }))

    const inspector = screen.getByTestId('workbench-project-inspector')
    expect(inspector).toHaveTextContent('Knowledge mapping')
    expect(inspector).toHaveTextContent('Waiting for review')
    expect(navigation.openEntry).not.toHaveBeenCalled()

    fireEvent.click(within(inspector).getByRole('button', { name: 'Open Knowledge mapping' }))
    expect(navigation.openEntry).toHaveBeenCalledWith(waiting)
  })

  it('opens queue and timeline entries through the existing note navigation boundary', () => {
    const { navigation } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Open next step for Theme release' }))
    expect(navigation.openEntry).toHaveBeenCalledWith(activeSecondary)

    fireEvent.click(screen.getByRole('button', { name: 'Open Code label fix from project signal stream' }))
    expect(navigation.openEntry).toHaveBeenLastCalledWith(ready)
  })

  it('shows bounded, accessible loading and empty states', () => {
    const { rerender } = render(
      <CommandCenterProjectsView
        locale="en"
        model={{ ...buildWorkbenchModel({
          entries: [],
          folders: [],
          views: [],
          activeSelection: { kind: 'filter', filter: 'all' },
          loading: false,
        }), loading: true }}
        navigation={{ close: vi.fn(), openEntry: vi.fn(), openSelection: vi.fn() }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Building your workbench')

    rerender(
      <CommandCenterProjectsView
        locale="en"
        model={buildWorkbenchModel({
          entries: [],
          folders: [],
          views: [],
          activeSelection: { kind: 'filter', filter: 'all' },
          loading: false,
        })}
        navigation={{ close: vi.fn(), openEntry: vi.fn(), openSelection: vi.fn() }}
      />,
    )

    expect(screen.getByText('Notes with a status will form the execution board here.')).toBeInTheDocument()
    expect(screen.getByText('No status-bearing notes are waiting in the queue.')).toBeInTheDocument()
    expect(screen.getByText('Recent project signals will appear here.')).toBeInTheDocument()
  })
})
