import type { SidebarSelection, VaultEntry } from '../../../types'

type WorkbenchNavigationCallback<T> = (target: T) => void | Promise<void>

export interface WorkbenchNavigationOptions {
  readonly onClose: () => void
  readonly onOpenSelection: WorkbenchNavigationCallback<SidebarSelection>
  readonly onOpenEntry: WorkbenchNavigationCallback<VaultEntry>
}

export interface WorkbenchNavigation {
  close(): void
  openEntry(entry: VaultEntry): Promise<void>
  openSelection(selection: SidebarSelection): Promise<void>
}

export function createWorkbenchNavigation(
  options: WorkbenchNavigationOptions,
): WorkbenchNavigation {
  return Object.freeze({
    close: options.onClose,
    openEntry: async (entry: VaultEntry) => {
      options.onClose()
      await options.onOpenEntry(entry)
    },
    openSelection: async (selection: SidebarSelection) => {
      options.onClose()
      await options.onOpenSelection(selection)
    },
  })
}
