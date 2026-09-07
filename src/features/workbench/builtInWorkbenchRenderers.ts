import { createElement, lazy, Suspense } from 'react'
import type {
  WorkbenchRendererMap,
  WorkbenchTemplateRenderer,
} from './host/workbenchRendererTypes'
import { COMMAND_CENTER_TEMPLATE } from './templates/command-center/commandCenterManifest'

interface WorkbenchTemplateModule {
  readonly default: WorkbenchTemplateRenderer
}

export function createDeferredWorkbenchRenderer(
  load: () => Promise<WorkbenchTemplateModule>,
): WorkbenchTemplateRenderer {
  const LazyRenderer = lazy(load)
  const DeferredRenderer: WorkbenchTemplateRenderer = (props) => createElement(
    Suspense,
    { fallback: null },
    createElement(LazyRenderer, props),
  )
  DeferredRenderer.displayName = 'DeferredWorkbenchRenderer'
  return DeferredRenderer
}

const deferredCommandCenterRenderer = createDeferredWorkbenchRenderer(async () => {
  const commandCenter = await import('./templates/command-center/CommandCenterTemplate')
  return { default: commandCenter.CommandCenterTemplate }
})

export const builtInWorkbenchRenderers: WorkbenchRendererMap = new Map([
  [COMMAND_CENTER_TEMPLATE.id, deferredCommandCenterRenderer],
])
