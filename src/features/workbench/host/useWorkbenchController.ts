import { useSyncExternalStore } from 'react'
import type {
  WorkbenchController,
  WorkbenchControllerSnapshot,
} from '../core/workbenchController'

export function useWorkbenchController(
  controller: WorkbenchController,
): WorkbenchControllerSnapshot {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
}
