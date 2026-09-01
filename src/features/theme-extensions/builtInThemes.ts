import blueTopazJson from './themes/blue-topaz.json'
import catppuccinFrappeJson from './themes/catppuccin-frappe.json'
import catppuccinLatteJson from './themes/catppuccin-latte.json'
import catppuccinMacchiatoJson from './themes/catppuccin-macchiato.json'
import catppuccinMochaJson from './themes/catppuccin-mocha.json'
import codexRosePineJson from './themes/codex-rose-pine.json'
import nordJson from './themes/nord.json'
import { parseThemePackage, type ThemePackage } from './themePackage'

export const BUILT_IN_THEME_PACKAGES: readonly ThemePackage[] = [
  parseThemePackage(codexRosePineJson),
  parseThemePackage(nordJson),
  parseThemePackage(blueTopazJson),
  parseThemePackage(catppuccinLatteJson),
  parseThemePackage(catppuccinFrappeJson),
  parseThemePackage(catppuccinMacchiatoJson),
  parseThemePackage(catppuccinMochaJson),
]

export function findBuiltInThemePackage(id: string): ThemePackage | null {
  return BUILT_IN_THEME_PACKAGES.find((theme) => theme.id === id) ?? null
}
