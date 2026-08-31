import { beforeEach, describe, expect, it, vi } from 'vitest'

const { invokeMock, isTauriMock, openMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(() => true),
  openMock: vi.fn(),
}))

vi.mock('../../mock-tauri', () => ({ isTauri: isTauriMock }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: openMock }))
vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }))

import { ThemeImportUnavailableError, pickThemeExtensionFile } from './themeFileImport'

describe('theme file import', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    openMock.mockReset()
    isTauriMock.mockReturnValue(true)
  })

  it('reads the selected JSON file through the restricted Tauri command', async () => {
    openMock.mockResolvedValue('/tmp/ocean.tolaria-theme.json')
    invokeMock.mockResolvedValue('{"schemaVersion":1}')

    await expect(pickThemeExtensionFile('Import theme', 'Tolaria theme')).resolves.toBe('{"schemaVersion":1}')
    expect(invokeMock).toHaveBeenCalledWith('read_theme_extension_file', {
      path: '/tmp/ocean.tolaria-theme.json',
    })
  })

  it('returns null when the native dialog is cancelled', async () => {
    openMock.mockResolvedValue(null)
    await expect(pickThemeExtensionFile('Import theme', 'Tolaria theme')).resolves.toBeNull()
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it('fails clearly outside the desktop runtime', async () => {
    isTauriMock.mockReturnValue(false)
    await expect(pickThemeExtensionFile('Import theme', 'Tolaria theme')).rejects.toBeInstanceOf(
      ThemeImportUnavailableError,
    )
  })
})
