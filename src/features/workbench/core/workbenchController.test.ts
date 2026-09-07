import { describe, expect, it, vi } from 'vitest'
import { COMMAND_CENTER_TEMPLATE } from '../templates/command-center/commandCenterManifest'
import { createWorkbenchTemplateRegistry } from './workbenchRegistry'
import {
  WORKBENCH_PREFERENCES_STORAGE_KEY,
  type WorkbenchPreferenceStorage,
} from './workbenchPreferences'
import { createWorkbenchController } from './workbenchController'
import type { WorkbenchTemplateDefinition } from './workbenchTypes'

function makeStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial))
  return {
    get length() { return values.size },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => { values.delete(key) }),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
  }
}

const MINIMAL_TEMPLATE: WorkbenchTemplateDefinition = {
  id: 'minimal',
  schemaVersion: 1,
  labelKey: 'workbench.templates.minimal',
  defaultViewId: 'overview',
  views: [{
    id: 'overview',
    labelKey: 'workbench.views.overview',
    widgetIds: ['recent'],
  }],
  defaultLayout: [{
    widgetId: 'recent',
    viewId: 'overview',
    column: 1,
    row: 1,
    columnSpan: 12,
    rowSpan: 1,
  }],
}

const testRegistry = createWorkbenchTemplateRegistry(
  [COMMAND_CENTER_TEMPLATE, MINIMAL_TEMPLATE],
  COMMAND_CENTER_TEMPLATE.id,
)

describe('workbench controller', () => {
  it('starts closed while restoring the last valid template view', () => {
    const storage = makeStorage({
      [WORKBENCH_PREFERENCES_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'knowledge',
      }),
    })

    const controller = createWorkbenchController({ storage, registry: testRegistry })

    expect(controller.getSnapshot()).toMatchObject({
      isOpen: false,
      preferences: { templateId: 'command-center', activeViewId: 'knowledge' },
      template: { id: 'command-center' },
      activeView: { id: 'knowledge' },
    })
  })

  it('keeps open state session-only and notifies only on real transitions', () => {
    const storage = makeStorage()
    const controller = createWorkbenchController({ storage, registry: testRegistry })
    const listener = vi.fn()
    controller.subscribe(listener)

    controller.open()
    controller.open()
    controller.toggle()
    controller.close()

    expect(listener).toHaveBeenCalledTimes(2)
    expect(controller.getSnapshot().isOpen).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('validates internal views, persists accepted changes, and avoids duplicate notifications', () => {
    const storage = makeStorage()
    const events = new EventTarget()
    const controller = createWorkbenchController({ storage, registry: testRegistry, eventTarget: events })
    const listener = vi.fn()
    controller.subscribe(listener)

    expect(controller.selectView('missing')).toBe('invalid')
    expect(controller.selectView('knowledge')).toBe('updated')
    expect(controller.selectView('knowledge')).toBe('unchanged')

    expect(controller.getSnapshot().activeView.id).toBe('knowledge')
    expect(storage.setItem).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('switches through registry metadata and follows cross-window preferences', () => {
    const storage = makeStorage()
    const events = new EventTarget()
    const controller = createWorkbenchController({ storage, registry: testRegistry, eventTarget: events })
    controller.open()

    expect(controller.selectTemplate('missing')).toBe('invalid')
    expect(controller.selectTemplate('minimal')).toBe('updated')
    expect(controller.getSnapshot()).toMatchObject({
      isOpen: true,
      preferences: { templateId: 'minimal', activeViewId: 'overview' },
    })

    events.dispatchEvent(new StorageEvent('storage', {
      key: WORKBENCH_PREFERENCES_STORAGE_KEY,
      newValue: JSON.stringify({
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'projects',
      }),
    }))

    expect(controller.getSnapshot()).toMatchObject({
      isOpen: true,
      preferences: { templateId: 'command-center', activeViewId: 'projects' },
    })
  })

  it('keeps a valid session change when persistence is unavailable', () => {
    const storage = makeStorage() as WorkbenchPreferenceStorage
    vi.mocked(storage.setItem).mockImplementation(() => { throw new Error('quota') })
    const controller = createWorkbenchController({ storage, registry: testRegistry })

    expect(controller.selectView('projects')).toBe('updated-session-only')
    expect(controller.getSnapshot().activeView.id).toBe('projects')
  })

  it('stops observing external preference events after disposal', () => {
    const storage = makeStorage()
    const events = new EventTarget()
    const controller = createWorkbenchController({ storage, registry: testRegistry, eventTarget: events })
    controller.destroy()

    events.dispatchEvent(new StorageEvent('storage', {
      key: WORKBENCH_PREFERENCES_STORAGE_KEY,
      newValue: JSON.stringify({
        schemaVersion: 1,
        templateId: 'minimal',
        activeViewId: 'overview',
      }),
    }))

    expect(controller.getSnapshot().template.id).toBe('command-center')
  })
})
