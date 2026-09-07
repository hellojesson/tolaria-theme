import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackEvent } from '../../../lib/telemetry'
import { createWorkbenchController } from '../core/workbenchController'
import type { WorkbenchModel } from '../core/workbenchTypes'
import { createDeferredWorkbenchRenderer } from '../builtInWorkbenchRenderers'
import type { WorkbenchNavigation } from '../navigation/workbenchNavigation'
import {
  WorkbenchRenderer,
  type WorkbenchTemplateRenderer,
} from './WorkbenchRenderer'

vi.mock('../../../lib/telemetry', () => ({ trackEvent: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
})

const emptyModel: WorkbenchModel = {
  loading: false,
  activeSelection: { kind: 'filter', filter: 'all' },
  summary: {
    noteCount: 0,
    favoriteCount: 0,
    savedViewCount: 0,
    typeCount: 0,
    folderCount: 0,
    statusGroupCount: 0,
  },
  recentEntries: [],
  actionableEntries: [],
  favoriteEntries: [],
  knowledgeStreamEntries: [],
  savedViewSummaries: [],
  typeSummaries: [],
  folderSummaries: [],
  statusGroups: [],
  relationshipSummary: {
    linkedEntryCount: 0,
    outgoingLinkCount: 0,
    relationshipReferenceCount: 0,
  },
}

const navigation: WorkbenchNavigation = {
  close: vi.fn(),
  openEntry: vi.fn(),
  openSelection: vi.fn(),
}

describe('WorkbenchRenderer', () => {
  it('dispatches the selected template through an injected renderer map', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const snapshot = controller.getSnapshot()
    const Template: WorkbenchTemplateRenderer = ({ model, snapshot: current }) => (
      <div>{`${current.template.id}:${model.summary.noteCount}`}</div>
    )

    render(
      <WorkbenchRenderer
        locale="en"
        model={emptyModel}
        navigation={navigation}
        onSelectView={vi.fn()}
        renderers={new Map([['command-center', Template]])}
        snapshot={snapshot}
      />,
    )

    expect(screen.getByText('command-center:0')).toBeInTheDocument()
  })

  it('does not request a deferred template module before its renderer mounts', async () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const Template: WorkbenchTemplateRenderer = () => <div>Deferred workbench</div>
    const loadTemplate = vi.fn(async () => ({ default: Template }))
    const DeferredTemplate = createDeferredWorkbenchRenderer(loadTemplate)

    expect(loadTemplate).not.toHaveBeenCalled()

    render(
      <WorkbenchRenderer
        locale="en"
        model={emptyModel}
        navigation={navigation}
        onSelectView={vi.fn()}
        renderers={new Map([['command-center', DeferredTemplate]])}
        snapshot={controller.getSnapshot()}
      />,
    )

    expect(await screen.findByText('Deferred workbench')).toBeInTheDocument()
    expect(loadTemplate).toHaveBeenCalledOnce()
  })

  it('fails safely when a registered template has no renderer', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const onClose = vi.fn()

    render(
      <WorkbenchRenderer
        locale="en"
        model={emptyModel}
        navigation={{ ...navigation, close: onClose }}
        onSelectView={vi.fn()}
        renderers={new Map()}
        snapshot={controller.getSnapshot()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('This workbench style is unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('records only categorical destination metadata before navigation', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const openSelection = vi.fn()
    const Template: WorkbenchTemplateRenderer = ({ navigation: currentNavigation }) => (
      <button
        type="button"
        onClick={() => { void currentNavigation.openSelection({ kind: 'sectionGroup', type: 'Private type' }) }}
      >
        Open destination
      </button>
    )

    render(
      <WorkbenchRenderer
        locale="en"
        model={emptyModel}
        navigation={{ ...navigation, openSelection }}
        onSelectView={vi.fn()}
        renderers={new Map([['command-center', Template]])}
        snapshot={controller.getSnapshot()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open destination' }))

    expect(trackEvent).toHaveBeenCalledWith('workbench_destination_opened', {
      template_id: 'command-center',
      view_id: 'focus',
      destination_kind: 'type',
    })
    expect(openSelection).toHaveBeenCalledWith({ kind: 'sectionGroup', type: 'Private type' })
  })
})
