import { useCallback, useEffect, useState } from 'react'

/** Hash-based routing: `#reflection`, `#mirrors`, ... Falls back to `fallback`. */
export function useHashRoute<T extends string>(ids: readonly T[], fallback: T): [T, (id: T) => void] {
  const read = useCallback((): T => {
    const h = window.location.hash.replace(/^#/, '')
    return (ids as readonly string[]).includes(h) ? (h as T) : fallback
  }, [ids, fallback])

  const [current, setCurrent] = useState<T>(read)

  useEffect(() => {
    const onChange = () => setCurrent(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [read])

  const navigate = useCallback((id: T) => {
    if (window.location.hash !== `#${id}`) window.location.hash = id
  }, [])

  return [current, navigate]
}
