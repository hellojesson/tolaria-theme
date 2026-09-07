import { describe, expect, it, vi } from 'vitest'
import {
  WORKBENCH_PREFERENCES_CHANGED_EVENT,
  WORKBENCH_PREFERENCES_STORAGE_KEY,
  readWorkbenchPreferences,
  subscribeWorkbenchPreferences,
  writeWorkbenchPreferences,
} from './workbenchPreferences'

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

describe('workbench preferences', () => {
  it.each([
    {},
    { [WORKBENCH_PREFERENCES_STORAGE_KEY]: '{not-json' },
    { [WORKBENCH_PREFERENCES_STORAGE_KEY]: JSON.stringify({ schemaVersion: 2 }) },
    {
      [WORKBENCH_PREFERENCES_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        templateId: 'missing-template',
        activeViewId: 'focus',
      }),
    },
  ])('falls back safely when stored data is missing or invalid', (initial) => {
    expect(readWorkbenchPreferences(makeStorage(initial))).toEqual({
      schemaVersion: 1,
      templateId: 'command-center',
      activeViewId: 'focus',
    })
  })

  it('keeps a known template and repairs an unavailable internal view', () => {
    const storage = makeStorage({
      [WORKBENCH_PREFERENCES_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'missing-view',
      }),
    })

    expect(readWorkbenchPreferences(storage)).toEqual({
      schemaVersion: 1,
      templateId: 'command-center',
      activeViewId: 'focus',
    })
  })

  it('persists normalized preferences and emits a namespaced change event', () => {
    const storage = makeStorage()
    const events = new EventTarget()
    const listener = vi.fn()
    events.addEventListener(WORKBENCH_PREFERENCES_CHANGED_EVENT, listener)

    expect(writeWorkbenchPreferences(storage, {
      schemaVersion: 1,
      templateId: 'command-center',
      activeViewId: 'knowledge',
    }, undefined, events)).toBe(true)

    expect(storage.setItem).toHaveBeenCalledWith(
      WORKBENCH_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'knowledge',
      }),
    )
    expect(readWorkbenchPreferences(storage).activeViewId).toBe('knowledge')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('reports an unavailable storage boundary without throwing or notifying', () => {
    const storage = makeStorage()
    const events = new EventTarget()
    const listener = vi.fn()
    events.addEventListener(WORKBENCH_PREFERENCES_CHANGED_EVENT, listener)
    vi.mocked(storage.setItem).mockImplementation(() => { throw new Error('quota') })

    expect(writeWorkbenchPreferences(storage, {
      schemaVersion: 1,
      templateId: 'command-center',
      activeViewId: 'projects',
    }, undefined, events)).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('observes local notifications and cross-window storage changes until unsubscribed', () => {
    const events = new EventTarget()
    const listener = vi.fn()
    const unsubscribe = subscribeWorkbenchPreferences(events, listener)

    events.dispatchEvent(new CustomEvent(WORKBENCH_PREFERENCES_CHANGED_EVENT, {
      detail: {
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'projects',
      },
    }))
    events.dispatchEvent(new StorageEvent('storage', {
      key: WORKBENCH_PREFERENCES_STORAGE_KEY,
      newValue: JSON.stringify({
        schemaVersion: 1,
        templateId: 'command-center',
        activeViewId: 'knowledge',
      }),
    }))
    events.dispatchEvent(new StorageEvent('storage', { key: 'another.feature' }))

    expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({ activeViewId: 'projects' }))
    expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ activeViewId: 'knowledge' }))
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    events.dispatchEvent(new CustomEvent(WORKBENCH_PREFERENCES_CHANGED_EVENT, {
      detail: { schemaVersion: 1, templateId: 'command-center', activeViewId: 'focus' },
    }))
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
