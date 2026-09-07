import { useCallback, useMemo } from 'react'
import {
  createWorkbenchNavigation,
  type WorkbenchNavigation,
  type WorkbenchNavigationOptions,
} from '../navigation/workbenchNavigation'

export function useWorkbenchNavigation(
  options: WorkbenchNavigationOptions,
): WorkbenchNavigation {
  const openEntry = useCallback((entry: Parameters<WorkbenchNavigation['openEntry']>[0]) => (
    createWorkbenchNavigation(options).openEntry(entry)
  ), [options])
  const openSelection = useCallback((selection: Parameters<WorkbenchNavigation['openSelection']>[0]) => (
    createWorkbenchNavigation(options).openSelection(selection)
  ), [options])

  return useMemo(() => ({
    close: options.onClose,
    openEntry,
    openSelection,
  }), [openEntry, openSelection, options.onClose])
}
