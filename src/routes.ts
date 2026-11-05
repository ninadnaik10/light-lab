import seo from './data/seo.json'

export type SectionId = 'reflection' | 'refraction' | 'tir' | 'dispersion' | 'mirrors' | 'lenses'

/** `path` is canonical (sitemap, canonical tag, nav links); `aliases` serve the same page and point their canonical at `path`. */
export type RouteMeta = { id: SectionId; path: string; aliases?: string[]; title: string; description: string }

/** URL, page title and meta description for every section. Also read by scripts/seo-pages.mjs at build time. */
export const ROUTES = seo.routes as RouteMeta[]
export const SITE_URL = seo.site

export const routeFor = (id: SectionId): RouteMeta => ROUTES.find((r) => r.id === id) ?? ROUTES[0]
export const pathFor = (id: SectionId) => routeFor(id).path

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

/** Keeps the <head> in sync after client-side navigation (the build writes the same values into each page's HTML). */
export function applyHead(route: RouteMeta) {
  const url = SITE_URL + route.path
  document.title = route.title
  setMeta('meta[name="description"]', 'content', route.description)
  setMeta('link[rel="canonical"]', 'href', url)
  setMeta('meta[property="og:url"]', 'content', url)
  setMeta('meta[property="og:title"]', 'content', route.title)
  setMeta('meta[property="og:description"]', 'content', route.description)
  setMeta('meta[name="twitter:title"]', 'content', route.title)
  setMeta('meta[name="twitter:description"]', 'content', route.description)
}
