import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../../lib/i18n'
import { EditorFontSettings } from './EditorFontSettings'
import {
  EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY,
  EDITOR_FONT_PREFERENCE_STORAGE_KEY,
} from './editorFontPreferences'
import {
  THEME_EXTENSION_SELECTION_STORAGE_KEY,
} from './themeRuntime'

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }))

vi.mock('../../lib/telemetry', () => ({ trackEvent: trackEventMock }))

function installPointerCapturePolyfill() {
  if (!HTMLElement.prototype.hasPointerCapture) HTMLElement.prototype.hasPointerCapture = () => false
  if (!HTMLElement.prototype.setPointerCapture) HTMLElement.prototype.setPointerCapture = () => {}
  if (!HTMLElement.prototype.releasePointerCapture) HTMLElement.prototype.releasePointerCapture = () => {}
}

function chooseFont(label: string) {
  const trigger = screen.getByTestId('settings-editor-font')
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' })
  fireEvent.click(screen.getByRole('option', { name: label }))
}

describe('EditorFontSettings', () => {
  const t = createTranslator('en')

  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.style.removeProperty('--tolaria-editor-font-family')
    trackEventMock.mockClear()
    installPointerCapturePolyfill()
  })

  it('offers the system and three requested Chinese font presets', () => {
    render(<EditorFontSettings t={t} />)

    fireEvent.pointerDown(screen.getByTestId('settings-editor-font'), { button: 0, pointerType: 'mouse' })
    expect(screen.getByRole('option', { name: 'Follow theme' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'System default' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'PingFang SC' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Source Han Sans SC' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Source Han Serif SC' })).toBeInTheDocument()
  })

  it('persists and applies an explicit preset without changing the theme package', () => {
    render(<EditorFontSettings t={t} />)

    chooseFont('Source Han Sans SC')

    expect(window.localStorage.getItem(EDITOR_FONT_PREFERENCE_STORAGE_KEY)).toBe('source-han-sans-sc')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toContain(
      'Source Han Sans SC',
    )
    expect(trackEventMock).toHaveBeenCalledWith('editor_font_selected', {
      preference: 'source-han-sans-sc',
    })
  })

  it('supports a validated custom local font name without importing font data', () => {
    render(<EditorFontSettings t={t} />)

    chooseFont('Custom local font')
    const input = screen.getByLabelText('Local font family name')
    fireEvent.change(input, {
      target: { value: 'My Local Font' },
    })
    fireEvent.blur(input)

    expect(window.localStorage.getItem(EDITOR_FONT_CUSTOM_NAME_STORAGE_KEY)).toBe('My Local Font')
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toContain(
      'My Local Font',
    )
  })

  it('applies the selected theme recommendation while following the theme', () => {
    window.localStorage.setItem(THEME_EXTENSION_SELECTION_STORAGE_KEY, 'nord')

    render(<EditorFontSettings t={t} />)

    expect(screen.getByText(/Theme recommendation: Source Han Sans SC/)).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--tolaria-editor-font-family')).toContain(
      'Source Han Sans SC',
    )
  })
})
