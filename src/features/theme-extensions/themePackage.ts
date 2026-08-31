import {
  isThemeEditorFontPresetId,
  type ThemeEditorFontPresetId,
} from './themeFontContract'

export const THEME_PACKAGE_SCHEMA_VERSION = 1 as const

export const SUPPORTED_THEME_TOKENS = [
  '--surface-app',
  '--surface-sidebar',
  '--surface-panel',
  '--surface-card',
  '--surface-popover',
  '--surface-input',
  '--surface-button',
  '--surface-dialog',
  '--surface-editor',
  '--surface-overlay',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--text-muted',
  '--text-faint',
  '--text-heading',
  '--text-inverse',
  '--border-default',
  '--border-subtle',
  '--border-strong',
  '--border-input',
  '--border-dialog',
  '--border-focus',
  '--state-hover',
  '--state-hover-subtle',
  '--state-selected',
  '--state-selected-strong',
  '--state-active',
  '--state-focus-ring',
  '--state-drag-target',
  '--state-disabled',
  '--accent-blue',
  '--accent-blue-bg',
  '--accent-blue-hover',
  '--accent-blue-light',
  '--accent-green',
  '--accent-green-light',
  '--accent-orange',
  '--accent-orange-light',
  '--accent-red',
  '--accent-red-light',
  '--accent-purple',
  '--accent-purple-light',
  '--accent-yellow',
  '--accent-yellow-light',
  '--accent-teal',
  '--accent-teal-light',
  '--accent-pink',
  '--accent-pink-light',
  '--accent-gray',
  '--accent-gray-light',
  '--feedback-warning-text',
  '--feedback-warning-bg',
  '--feedback-warning-border',
  '--syntax-heading',
  '--syntax-link',
  '--syntax-monospace',
  '--syntax-monospace-bg',
  '--syntax-muted',
  '--syntax-frontmatter-key',
  '--syntax-frontmatter-value',
  '--syntax-highlight-comment',
  '--syntax-highlight-keyword',
  '--syntax-highlight-string',
  '--syntax-highlight-number',
  '--syntax-highlight-title',
  '--syntax-highlight-type',
  '--syntax-highlight-deletion',
  '--syntax-highlight-deletion-bg',
  '--diff-added-text',
  '--diff-added-bg',
  '--diff-removed-text',
  '--diff-removed-bg',
  '--diff-hunk-bg',
  '--shadow-dialog',
] as const

export type ThemeToken = typeof SUPPORTED_THEME_TOKENS[number]
export type ThemeVariant = Partial<Record<ThemeToken, string>>

export interface ThemePackage {
  schemaVersion: typeof THEME_PACKAGE_SCHEMA_VERSION
  id: string
  name: string
  author?: string
  typography?: {
    editorFontPreset?: ThemeEditorFontPresetId
  }
  variants: {
    light: ThemeVariant
    dark: ThemeVariant
  }
}

const SUPPORTED_TYPOGRAPHY_FIELDS = new Set(['editorFontPreset'])

const REQUIRED_THEME_TOKENS = [
  '--surface-app',
  '--surface-sidebar',
  '--surface-editor',
  '--text-primary',
  '--text-secondary',
  '--border-default',
  '--accent-blue',
  '--accent-blue-hover',
  '--accent-blue-light',
] as const satisfies readonly ThemeToken[]

const SUPPORTED_THEME_TOKEN_SET = new Set<string>(SUPPORTED_THEME_TOKENS)
const SAFE_COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i
const SAFE_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireShortText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`Theme ${field} must be a non-empty string of at most ${maxLength} characters.`)
  }
  return value
}

function validateVariant(value: unknown, mode: 'light' | 'dark'): ThemeVariant {
  if (!isRecord(value)) throw new Error(`Theme ${mode} variant is required.`)

  for (const token of REQUIRED_THEME_TOKENS) {
    if (!(token in value)) throw new Error(`Theme ${mode} variant is missing required token ${token}.`)
  }

  for (const [token, color] of Object.entries(value)) {
    if (!SUPPORTED_THEME_TOKEN_SET.has(token)) {
      throw new Error(`Theme ${mode} variant contains unsupported token ${token}.`)
    }
    if (typeof color !== 'string' || !SAFE_COLOR_PATTERN.test(color)) {
      throw new Error(`Theme ${mode} token ${token} must be a hex color.`)
    }
  }

  return value as ThemeVariant
}

function validateTypography(value: unknown): void {
  if (!isRecord(value)) throw new Error('Theme typography must be an object.')
  for (const key of Object.keys(value)) {
    if (!SUPPORTED_TYPOGRAPHY_FIELDS.has(key)) {
      throw new Error(`Theme typography field ${key} is unsupported.`)
    }
  }
  if (
    value.editorFontPreset !== undefined
    && !isThemeEditorFontPresetId(value.editorFontPreset)
  ) {
    throw new Error('Theme editor font preset is unsupported.')
  }
}

export function parseThemePackage(value: unknown): ThemePackage {
  if (!isRecord(value)) throw new Error('Theme package must be a JSON object.')
  if (value.schemaVersion !== THEME_PACKAGE_SCHEMA_VERSION) {
    throw new Error(`Theme schemaVersion must be ${THEME_PACKAGE_SCHEMA_VERSION}.`)
  }

  const id = requireShortText(value.id, 'id', 64)
  if (!SAFE_ID_PATTERN.test(id)) {
    throw new Error('Theme id may contain lowercase letters, numbers, dots, and hyphens only.')
  }
  requireShortText(value.name, 'name', 80)
  if (value.author !== undefined) requireShortText(value.author, 'author', 80)
  if (value.typography !== undefined) validateTypography(value.typography)
  if (!isRecord(value.variants)) throw new Error('Theme variants are required.')

  validateVariant(value.variants.light, 'light')
  validateVariant(value.variants.dark, 'dark')
  return value as unknown as ThemePackage
}

export function parseThemePackageJson(json: string): ThemePackage {
  if (json.length > 128 * 1024) throw new Error('Theme file is larger than 128 KB.')
  try {
    return parseThemePackage(JSON.parse(json) as unknown)
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Theme file is not valid JSON.')
    throw error
  }
}
