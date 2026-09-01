export const EDITOR_FONT_TYPOGRAPHY_PROFILE_IDS = [
  'official',
  'soft-calligraphic',
  'lxgw-wenkai-emphasis',
] as const

export type EditorFontTypographyProfileId =
  typeof EDITOR_FONT_TYPOGRAPHY_PROFILE_IDS[number]

export const EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES = [
  '--tolaria-editor-strong-font-weight',
  '--tolaria-editor-strong-font-size',
  '--tolaria-editor-strong-color',
  '--tolaria-editor-strong-letter-spacing',
  '--tolaria-editor-heading-font-weight',
  '--tolaria-editor-heading-color',
  '--tolaria-editor-heading-letter-spacing',
] as const

type TypographyVariable = typeof EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES[number]
type StyleTarget = Pick<CSSStyleDeclaration, 'removeProperty' | 'setProperty'>

const SOFT_CALLIGRAPHIC_VALUES: Readonly<Record<TypographyVariable, string>> = {
  '--tolaria-editor-strong-font-weight': '500',
  '--tolaria-editor-strong-font-size': 'inherit',
  '--tolaria-editor-strong-color':
    'color-mix(in srgb, var(--text-primary) 88%, var(--bg-primary))',
  '--tolaria-editor-strong-letter-spacing': '0.018em',
  '--tolaria-editor-heading-font-weight': '500',
  '--tolaria-editor-heading-color':
    'color-mix(in srgb, var(--text-heading) 90%, var(--bg-primary))',
  '--tolaria-editor-heading-letter-spacing': '0.01em',
}

const LXGW_WENKAI_EMPHASIS_VALUES: Readonly<Record<TypographyVariable, string>> = {
  ...SOFT_CALLIGRAPHIC_VALUES,
  '--tolaria-editor-strong-font-weight': '600',
  '--tolaria-editor-strong-font-size': '1.025em',
  '--tolaria-editor-strong-color': 'var(--text-primary)',
  '--tolaria-editor-strong-letter-spacing': '0.008em',
}

const TYPOGRAPHY_PROFILE_VALUES: Readonly<Record<
  Exclude<EditorFontTypographyProfileId, 'official'>,
  Readonly<Record<TypographyVariable, string>>
>> = {
  'soft-calligraphic': SOFT_CALLIGRAPHIC_VALUES,
  'lxgw-wenkai-emphasis': LXGW_WENKAI_EMPHASIS_VALUES,
}

function clearTypographyProfile(style: StyleTarget): void {
  for (const variable of EDITOR_FONT_TYPOGRAPHY_CSS_VARIABLES) {
    style.removeProperty(variable)
  }
}

export function applyEditorFontTypographyProfile(
  style: StyleTarget,
  profile: EditorFontTypographyProfileId,
): void {
  clearTypographyProfile(style)
  if (profile === 'official') return

  for (const [variable, value] of Object.entries(TYPOGRAPHY_PROFILE_VALUES[profile])) {
    style.setProperty(variable, value)
  }
}
