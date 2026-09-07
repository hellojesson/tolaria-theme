import type { ReactNode } from 'react'
import type {
  WorkbenchController,
  WorkbenchControllerSnapshot,
} from '../core/workbenchController'
import { useWorkbenchController } from './useWorkbenchController'

export interface WorkbenchSurfaceProps {
  readonly children: ReactNode
  readonly controller: WorkbenchController
  readonly renderWorkbench: (snapshot: WorkbenchControllerSnapshot) => ReactNode
}

export function WorkbenchSurface({
  children,
  controller,
  renderWorkbench,
}: WorkbenchSurfaceProps): ReactNode {
  const snapshot = useWorkbenchController(controller)
  return snapshot.isOpen ? renderWorkbench(snapshot) : children
}
