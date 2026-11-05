import { useCallback, useEffect, useState, type MouseEvent } from 'react'

/** Fired after an in-app navigation so every `usePathRoute` re-reads the URL. */
const NAV_EVENT = 'll:navigate'

/** `path` is the canonical URL; `aliases` are extra URLs that show the same section. */
export type RouteDef<T extends string> = { id: T; path: string; aliases?: readonly string[] }

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)

/** Client-side navigation to `path` (no reload). */
export function navigateTo(path: string) {
  if (normalize(window.location.pathname) === normalize(path) && !window.location.hash) return
  window.history.pushState(null, '', path)
  window.scrollTo(0, 0)
  window.dispatchEvent(new Event(NAV_EVENT))
}

/** onClick for an <a href> that should navigate in-app; leaves modified clicks (new tab etc.) to the browser. */
export function onRouteLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  navigateTo(e.currentTarget.getAttribute('href') ?? '/')
}

/**
 * Path-based routing (`/`, `/refraction`, ...). Aliases (`/reflection`) resolve to their route without redirecting.
 * Unknown paths fall back to `fallback`.
 * Old hash links (`/#refraction`) are rewritten to their path on load so shared links keep working.
 */
export function usePathRoute<T extends string>(routes: readonly RouteDef<T>[], fallback: T): T {
  const read = useCallback((): T => {
    const legacy = routes.find((r) => `#${r.id}` === window.location.hash)
    if (legacy) {
      window.history.replaceState(null, '', legacy.path)
      return legacy.id
    }
    const path = normalize(window.location.pathname)
    return routes.find((r) => r.path === path || r.aliases?.includes(path))?.id ?? fallback
  }, [routes, fallback])

  const [current, setCurrent] = useState<T>(read)

  useEffect(() => {
    const onChange = () => setCurrent(read())
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    window.addEventListener(NAV_EVENT, onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
      window.removeEventListener(NAV_EVENT, onChange)
    }
  }, [read])

  return current
}
