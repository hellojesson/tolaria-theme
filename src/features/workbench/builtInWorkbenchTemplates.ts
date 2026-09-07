import { createWorkbenchTemplateRegistry } from './core/workbenchRegistry'
import { COMMAND_CENTER_TEMPLATE } from './templates/command-center/commandCenterManifest'

export const workbenchTemplateRegistry = createWorkbenchTemplateRegistry(
  [COMMAND_CENTER_TEMPLATE],
  COMMAND_CENTER_TEMPLATE.id,
)
