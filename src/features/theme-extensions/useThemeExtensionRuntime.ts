import { useEffect } from 'react'
import type { ResolvedThemeMode } from '../../lib/themeMode'
import { applyStoredThemeExtension, subscribeToThemeExtensionChanges } from './themeRuntime'
import './themeControlCompatibility.css'

export function useThemeExtensionRuntime(mode: ResolvedThemeMode): void {
  useEffect(() => {
    const apply = () => applyStoredThemeExtension(document, window.localStorage, mode)
    apply()
    return subscribeToThemeExtensionChanges(apply)
  }, [mode])
}
