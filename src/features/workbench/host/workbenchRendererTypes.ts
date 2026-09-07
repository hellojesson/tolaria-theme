import type { ComponentType } from 'react'
import type { AppLocale } from '../../../lib/i18n'
import type { WorkbenchControllerSnapshot } from '../core/workbenchController'
import type { WorkbenchModel, WorkbenchViewId } from '../core/workbenchTypes'
import type { WorkbenchNavigation } from '../navigation/workbenchNavigation'

export interface WorkbenchTemplateRendererProps {
  readonly locale: AppLocale
  readonly model: WorkbenchModel
  readonly navigation: WorkbenchNavigation
  readonly onSelectView: (viewId: WorkbenchViewId) => void
  readonly snapshot: WorkbenchControllerSnapshot
}

export type WorkbenchTemplateRenderer = ComponentType<WorkbenchTemplateRendererProps>
export type WorkbenchRendererMap = ReadonlyMap<string, WorkbenchTemplateRenderer>
