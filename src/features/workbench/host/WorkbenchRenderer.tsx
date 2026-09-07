import { Warning, X } from '@phosphor-icons/react'
import { createElement } from 'react'
import { Button } from '@/components/ui/button'
import { translate } from '../../../lib/i18n'
import { trackEvent } from '../../../lib/telemetry'
import { builtInWorkbenchRenderers } from '../builtInWorkbenchRenderers'
import type { WorkbenchNavigation } from '../navigation/workbenchNavigation'
import type { SidebarSelection } from '../../../types'
import type {
  WorkbenchRendererMap,
  WorkbenchTemplateRenderer,
  WorkbenchTemplateRendererProps,
} from './workbenchRendererTypes'

export interface WorkbenchRendererProps extends WorkbenchTemplateRendererProps {
  readonly renderers?: WorkbenchRendererMap
}

function trackedNavigation(
  props: WorkbenchTemplateRendererProps,
): WorkbenchNavigation {
  const metadata = {
    template_id: props.snapshot.template.id,
    view_id: props.snapshot.activeView.id,
  }
  return {
    close: props.navigation.close,
    openEntry: (entry) => {
      trackEvent('workbench_destination_opened', { ...metadata, destination_kind: 'note' })
      return props.navigation.openEntry(entry)
    },
    openSelection: (selection) => {
      trackEvent('workbench_destination_opened', {
        ...metadata,
        destination_kind: destinationKind(selection),
      })
      return props.navigation.openSelection(selection)
    },
  }
}

function destinationKind(selection: SidebarSelection): string {
  return selection.kind === 'sectionGroup' ? 'type' : selection.kind
}

function UnavailableWorkbench({ locale, navigation }: WorkbenchTemplateRendererProps) {
  return (
    <section
      aria-labelledby="workbench-unavailable-title"
      className="flex min-w-0 flex-1 items-center justify-center bg-background p-8 text-foreground"
      role="alert"
    >
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <Warning className="mx-auto text-primary" size={28} weight="duotone" />
        <h1 id="workbench-unavailable-title" className="mt-4 text-lg font-semibold">
          {translate(locale, 'workbench.renderer.unavailable')}
        </h1>
        <Button className="mt-5" type="button" variant="outline" onClick={navigation.close}>
          <X size={15} />
          {translate(locale, 'workbench.close')}
        </Button>
      </div>
    </section>
  )
}

export function WorkbenchRenderer({
  renderers = builtInWorkbenchRenderers,
  ...props
}: WorkbenchRendererProps) {
  const Renderer: WorkbenchTemplateRenderer | undefined = renderers.get(props.snapshot.template.id)
  if (!Renderer) return <UnavailableWorkbench {...props} />
  return createElement(Renderer, { ...props, navigation: trackedNavigation(props) })
}

export type {
  WorkbenchRendererMap,
  WorkbenchTemplateRenderer,
  WorkbenchTemplateRendererProps,
} from './workbenchRendererTypes'
