import { useCallback, useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

/**
 * Full screen for the whole page, so a phone browser hides its address bar.
 * `available` is false where the browser does not allow it (iPhone Safari)
 * and when the app already runs from the home screen without browser bars.
 */
export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, () => document.fullscreenElement !== null)
  const available =
    document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }, [])
  return { available, active, toggle }
}
