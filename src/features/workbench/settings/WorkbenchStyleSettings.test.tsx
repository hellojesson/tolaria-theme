import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../../../lib/i18n'
import { createWorkbenchTemplateRegistry } from '../core/workbenchRegistry'
import { WORKBENCH_PREFERENCES_STORAGE_KEY } from '../core/workbenchPreferences'
import { COMMAND_CENTER_TEMPLATE } from '../templates/command-center/commandCenterManifest'
import { WorkbenchStyleSettings } from './WorkbenchStyleSettings'

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }))

vi.mock('../../../lib/telemetry', () => ({ trackEvent: trackEventMock }))

const SECOND_TEMPLATE = {
  ...COMMAND_CENTER_TEMPLATE,
  id: 'second-template',
  labelKey: 'settings.theme.label',
} as const

const registry = createWorkbenchTemplateRegistry(
  [COMMAND_CENTER_TEMPLATE, SECOND_TEMPLATE],
  COMMAND_CENTER_TEMPLATE.id,
)

function installPointerCapturePolyfill() {
  if (!HTMLElement.prototype.hasPointerCapture) HTMLElement.prototype.hasPointerCapture = () => false
  if (!HTMLElement.prototype.setPointerCapture) HTMLElement.prototype.setPointerCapture = () => undefined
  if (!HTMLElement.prototype.releasePointerCapture) HTMLElement.prototype.releasePointerCapture = () => undefined
}

describe('WorkbenchStyleSettings', () => {
  beforeEach(() => {
    window.localStorage.clear()
    trackEventMock.mockClear()
    installPointerCapturePolyfill()
  })

  afterEach(cleanup)

  it('lists registered templates and persists a selection through the shared preference boundary', () => {
    render(
      <WorkbenchStyleSettings
        eventTarget={window}
        registry={registry}
        storage={window.localStorage}
        t={createTranslator('en')}
      />,
    )

    const trigger = screen.getByTestId('settings-workbench-style')
    expect(trigger).toHaveAttribute('data-value', 'command-center')
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' })
    fireEvent.click(screen.getByRole('option', { name: 'Theme' }))

    expect(trigger).toHaveAttribute('data-value', 'second-template')
    expect(JSON.parse(window.localStorage.getItem(WORKBENCH_PREFERENCES_STORAGE_KEY) ?? '{}'))
      .toMatchObject({ templateId: 'second-template', activeViewId: 'focus' })
    expect(trackEventMock).toHaveBeenCalledWith('workbench_template_selected', {
      template_id: 'second-template',
    })
  })

  it('renders the registered Command Center label instead of hard-coding an option', () => {
    render(
      <WorkbenchStyleSettings
        eventTarget={window}
        registry={registry}
        storage={window.localStorage}
        t={createTranslator('en')}
      />,
    )

    fireEvent.pointerDown(screen.getByTestId('settings-workbench-style'), {
      button: 0,
      pointerType: 'mouse',
    })
    expect(screen.getByRole('option', { name: 'Intelligent Command Center' })).toBeInTheDocument()
  })
})
