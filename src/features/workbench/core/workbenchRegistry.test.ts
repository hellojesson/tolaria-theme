import { describe, expect, it } from 'vitest'
import {
  createWorkbenchTemplateRegistry,
} from './workbenchRegistry'
import { workbenchTemplateRegistry } from '../builtInWorkbenchTemplates'
import { COMMAND_CENTER_TEMPLATE } from '../templates/command-center/commandCenterManifest'

describe('workbench template registry', () => {
  it('exposes the command center manifest through stable readonly metadata', () => {
    expect(workbenchTemplateRegistry.defaultTemplate().id).toBe('command-center')
    expect(workbenchTemplateRegistry.list().map((template) => template.id)).toEqual([
      'command-center',
    ])
    expect(workbenchTemplateRegistry.get('command-center')?.views.map((view) => view.id)).toEqual([
      'focus',
      'knowledge',
      'projects',
    ])
  })

  it('falls back to the default template for an unavailable preference', () => {
    expect(workbenchTemplateRegistry.resolve('missing-template')).toBe(
      workbenchTemplateRegistry.defaultTemplate(),
    )
    expect(workbenchTemplateRegistry.resolve(null)).toBe(
      workbenchTemplateRegistry.defaultTemplate(),
    )
  })

  it('rejects duplicate template ids', () => {
    expect(() => createWorkbenchTemplateRegistry(
      [COMMAND_CENTER_TEMPLATE, COMMAND_CENTER_TEMPLATE],
      COMMAND_CENTER_TEMPLATE.id,
    )).toThrow(/duplicate template id/i)
  })

  it('rejects manifests whose default view or placements are not declared', () => {
    expect(() => createWorkbenchTemplateRegistry([
      { ...COMMAND_CENTER_TEMPLATE, defaultViewId: 'missing-view' },
    ], COMMAND_CENTER_TEMPLATE.id)).toThrow(/default view/i)

    expect(() => createWorkbenchTemplateRegistry([
      {
        ...COMMAND_CENTER_TEMPLATE,
        defaultLayout: [
          ...COMMAND_CENTER_TEMPLATE.defaultLayout,
          {
            widgetId: 'unknown-widget',
            viewId: 'focus',
            column: 1,
            row: 1,
            columnSpan: 1,
            rowSpan: 1,
          },
        ],
      },
    ], COMMAND_CENTER_TEMPLATE.id)).toThrow(/unknown widget/i)
  })
})
