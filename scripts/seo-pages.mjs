// Post-build SEO step (runs after `vite build`, see package.json "build").
// For every route in src/data/seo.json it writes dist/<path>/index.html with that page's own
// <title>, description, canonical URL and social tags, plus a plain-HTML fallback (heading,
// description, links to every section) that crawlers can read before JavaScript runs. Aliases
// (e.g. /reflection) get a copy of their route's page, canonical included. React
// replaces the fallback on load. Also writes dist/sitemap.xml and a noindex dist/404.html.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const seo = JSON.parse(readFileSync(join(root, 'src/data/seo.json'), 'utf8'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Replace the value of one attribute on the single tag matched by `tagPattern`; fail loudly if it is missing. */
function setAttr(html, tagPattern, attr, value) {
  const re = new RegExp(`(<${tagPattern}[^>]*?\\s${attr}=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`seo-pages: tag not found: ${tagPattern}`)
  return html.replace(re, `$1${esc(value)}$2`)
}

const LINK_STYLE = 'color:#67e8f9'
const nav = seo.routes.map((r) => `<li><a href="${r.path}" style="${LINK_STYLE}">${esc(r.title.replace(/ \| Light Lab$/, ''))}</a></li>`).join('')

function fallback(route) {
  return (
    `<div style="max-width:48rem;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;color:#cbd5e1">` +
    `<h1 style="color:#f8fafc;font-size:1.5rem">${esc(route.title)}</h1>` +
    `<p>${esc(route.description)}</p>` +
    `<nav aria-label="Sections"><ul>${nav}</ul></nav>` +
    `<noscript><p>Light Lab is interactive and needs JavaScript enabled.</p></noscript>` +
    `</div>`
  )
}

function render(route, { notFound = false } = {}) {
  const url = seo.site + route.path
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)
  html = setAttr(html, 'meta name="description"', 'content', route.description)
  html = setAttr(html, 'link rel="canonical"', 'href', url)
  html = setAttr(html, 'meta property="og:url"', 'content', url)
  html = setAttr(html, 'meta property="og:title"', 'content', route.title)
  html = setAttr(html, 'meta property="og:description"', 'content', route.description)
  html = setAttr(html, 'meta name="twitter:title"', 'content', route.title)
  html = setAttr(html, 'meta name="twitter:description"', 'content', route.description)
  if (notFound) {
    html = setAttr(html, 'meta name="robots"', 'content', 'noindex')
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, '')
  }
  if (!html.includes('<!--seo-fallback-->')) throw new Error('seo-pages: <!--seo-fallback--> marker missing from index.html')
  return html.replace('<!--seo-fallback-->', fallback(route))
}

// Aliases (e.g. /reflection) get the same HTML as their route, so their canonical points at route.path.
for (const route of seo.routes) {
  for (const p of [route.path, ...(route.aliases ?? [])]) {
    const out = p === '/' ? join(dist, 'index.html') : join(dist, p.slice(1), 'index.html')
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, render(route))
  }
}

writeFileSync(
  join(dist, '404.html'),
  render({ path: '/', title: 'Page not found | Light Lab', description: 'This page does not exist. Pick a Light Lab section below.' }, { notFound: true }),
)

const urls = seo.routes.map((r) => `  <url><loc>${seo.site}${r.path}</loc></url>`).join('\n')
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)

const pageCount = seo.routes.reduce((n, r) => n + 1 + (r.aliases?.length ?? 0), 0)
console.log(`seo-pages: wrote ${pageCount} pages (${seo.routes.length} canonical), 404.html and sitemap.xml`)
