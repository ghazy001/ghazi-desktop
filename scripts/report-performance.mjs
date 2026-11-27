import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
const html = readFileSync('dist/index.html', 'utf8')
const entry = html.match(/src="([^"]+\.js)"/)[1],
  bytes = readFileSync('dist' + entry)
const fonts = readdirSync('public/fonts', { recursive: true }).filter((name) => name.endsWith('.woff2'))
const boot = JSON.parse(readFileSync('src/data/boot-data.json'))
const after = {
  entry,
  entryBytes: bytes.length,
  entryGzipBytes: gzipSync(bytes).length,
  initialBootDelayMs: boot.blankMs + boot.loadingMs + boot.welcomeMs,
  profileImageBytes: statSync('public/img/ghazi/about-photo.jpg').size,
  fontsBytes: fonts.reduce((size, file) => size + statSync('public/fonts/' + file).size, 0)
}
let before = null
try {
  before = JSON.parse(readFileSync('output/verification/performance-baseline.json'))
} catch {
  /* The baseline is optional in a new checkout. */
}
const reductions =
  before &&
  Object.fromEntries(
    ['entryBytes', 'entryGzipBytes', 'initialBootDelayMs', 'profileImageBytes', 'fontsBytes'].map((key) => [
      key,
      Number((100 * (1 - after[key] / before[key])).toFixed(1))
    ])
  )
writeFileSync(
  'output/verification/performance-results.json',
  JSON.stringify(
    { before, after, reductions, note: 'Build transfer sizes and configured boot animation delays; not a device FPS or time-to-interactive benchmark.' },
    null,
    2
  ) + '\n'
)
console.log(JSON.stringify({ before, after, reductions }, null, 2))
