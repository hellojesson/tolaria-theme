import blueTopazJson from './themes/blue-topaz.json'
import codexRosePineJson from './themes/codex-rose-pine.json'
import nordJson from './themes/nord.json'
import { parseThemePackage, type ThemePackage } from './themePackage'

export const BUILT_IN_THEME_PACKAGES: readonly ThemePackage[] = [
  parseThemePackage(codexRosePineJson),
  parseThemePackage(nordJson),
  parseThemePackage(blueTopazJson),
]

export function findBuiltInThemePackage(id: string): ThemePackage | null {
  return BUILT_IN_THEME_PACKAGES.find((theme) => theme.id === id) ?? null
}
