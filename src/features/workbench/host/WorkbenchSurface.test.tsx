import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkbenchController } from '../core/workbenchController'
import { WorkbenchSurface } from './WorkbenchSurface'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('WorkbenchSurface', () => {
  it('renders the official surface until the controller is opened', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })
    const renderWorkbench = vi.fn(() => <div>Workbench</div>)

    render(
      <WorkbenchSurface
        controller={controller}
        renderWorkbench={renderWorkbench}
      >
        <div>Official surface</div>
      </WorkbenchSurface>,
    )

    expect(screen.getByText('Official surface')).toBeInTheDocument()
    expect(screen.queryByText('Workbench')).not.toBeInTheDocument()
    expect(renderWorkbench).not.toHaveBeenCalled()
  })

  it('reacts to controller state while forwarding the resolved template view', () => {
    const controller = createWorkbenchController({ storage: window.localStorage })

    render(
      <WorkbenchSurface
        controller={controller}
        renderWorkbench={(snapshot) => (
          <div>{`${snapshot.template.id}:${snapshot.activeView.id}`}</div>
        )}
      >
        <div>Official surface</div>
      </WorkbenchSurface>,
    )

    act(() => controller.open())
    expect(screen.getByText('command-center:focus')).toBeInTheDocument()
    expect(screen.queryByText('Official surface')).not.toBeInTheDocument()

    act(() => {
      controller.selectView('knowledge')
    })
    expect(screen.getByText('command-center:knowledge')).toBeInTheDocument()

    act(() => controller.close())
    expect(screen.getByText('Official surface')).toBeInTheDocument()
  })
})
