/**
 * Prints the sha256 hash of every inline <script> in the built HTML, in the
 * exact form the Content-Security-Policy in vercel.json expects.
 *
 * Run after `npm run build` whenever the inline theme script in index.html
 * changes. A stale hash doesn't error — the browser just refuses to run the
 * script — so this is the only way to notice before it reaches production.
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')

// Strip HTML comments first: a comment mentioning script tags would otherwise
// be picked up as if it were real markup.
const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '')
const inline = [...withoutComments.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]

if (inline.length === 0) {
  console.log('No inline scripts found — the CSP needs no script hash.')
  process.exit(0)
}

for (const [, body] of inline) {
  const hash = createHash('sha256').update(body, 'utf8').digest('base64')
  console.log(`'sha256-${hash}'`)
}
console.log(`\n${inline.length} inline script(s). Paste into script-src in vercel.json.`)
