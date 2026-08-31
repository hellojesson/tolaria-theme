import { isTauri } from '../../mock-tauri'

export class ThemeImportUnavailableError extends Error {
  constructor() {
    super('Theme import is available in the Tolaria desktop app.')
    this.name = 'ThemeImportUnavailableError'
  }
}

export async function pickThemeExtensionFile(
  title: string,
  filterName: string,
): Promise<string | null> {
  if (!isTauri()) throw new ThemeImportUnavailableError()

  const [{ invoke }, { open }] = await Promise.all([
    import('@tauri-apps/api/core'),
    import('@tauri-apps/plugin-dialog'),
  ])
  const selected = await open({
    directory: false,
    multiple: false,
    title,
    filters: [{ name: filterName, extensions: ['json'] }],
  })
  if (typeof selected !== 'string') return null

  return invoke<string>('read_theme_extension_file', { path: selected })
}
