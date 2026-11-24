import assert from 'node:assert/strict'
import { indexPdfText, findPdfMatches } from '../src/lib/pdf-navigation.mjs'
import { readPdfTextContent } from '../src/lib/pdf-text-content.mjs'
const contents = [
  [{ str: 'PROFESSIONAL ' }, { str: 'PROFILE' }, { str: 'Café Full‑Stack' }, { str: 'React React' }],
  [{ str: 'C E R T I F I C A T I O N S' }, { str: 'Artificial ' }, { str: 'Intelligence' }, { type: 'endMarkedContent' }, { str: 'React' }]
]
const pages = contents.map((items, i) => ({ number: i + 1, index: indexPdfText(items) }))
const heading = findPdfMatches(pages, 'Professional profile')
assert.equal(heading.length, 1)
assert.equal(heading[0].page, 1)
assert.deepEqual(
  heading[0].segments.map((s) => s.item),
  [0, 1]
)
assert.equal(findPdfMatches(pages, 'certifications')[0].page, 2)
assert.equal(findPdfMatches(pages, 'Artificial Intelligence')[0].segments.length, 2)
assert.equal(findPdfMatches(pages, 'cafe full-stack').length, 1)
assert.equal(findPdfMatches(pages, 'React').length, 3)
assert.deepEqual(
  findPdfMatches(pages, 'React').map((m) => m.page),
  [1, 1, 2]
)
assert.deepEqual(findPdfMatches(pages, 'not in the document'), [])
assert.deepEqual(findPdfMatches(pages, '  '), [])
for (const match of findPdfMatches(pages, 'react')) {
  const source = contents[match.page - 1].filter((item) => typeof item.str === 'string')
  assert.equal(match.segments.map((s) => source[s.item].str.slice(s.start, s.end)).join(''), 'React')
}
let released = false
const chunks = [
  { items: [{ str: 'First' }], styles: { f1: { fontFamily: 'Arial' } }, lang: 'en' },
  { items: [{ str: 'Second' }], styles: { f2: { fontFamily: 'serif' } }, lang: null }
]
// Intentionally provide no Symbol.asyncIterator, matching affected Safari.
const content = await readPdfTextContent({
  streamTextContent: () => ({
    getReader: () => ({
      read: async () => (chunks.length ? { done: false, value: chunks.shift() } : { done: true }),
      releaseLock: () => {
        released = true
      }
    })
  })
})
assert.deepEqual(
  content.items.map((item) => item.str),
  ['First', 'Second']
)
assert.equal(content.lang, 'en')
assert.deepEqual(Object.keys(content.styles), ['f1', 'f2'])
assert.equal(released, true)
released = false
await assert.rejects(
  readPdfTextContent({
    streamTextContent: () => ({
      getReader: () => ({
        read: async () => {
          throw new Error('Stream interrupted')
        },
        releaseLock: () => {
          released = true
        }
      })
    })
  }),
  /Stream interrupted/
)
assert.equal(released, true)
console.log('PDF checks passed: navigation/search, text stream loading without async iteration, and stream cleanup on success and failure.')
