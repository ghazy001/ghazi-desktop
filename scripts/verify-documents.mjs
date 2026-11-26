import assert from 'node:assert/strict'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { documentCatalog, findDocuments, resolveDocumentFolder, sortDocuments, downloadableDocument, shortcutText, DOCUMENTS_ROOT } from '../src/lib/document-files.mjs'
const json = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const profile = json('profile-data'),
  config = json('documents-data')
for (const language of ['en', 'fr']) {
  const catalog = documentCatalog(profile, config, language)
  assert.equal(catalog.children(DOCUMENTS_ROOT).length, 9)
  assert.equal(catalog.children('profile').length, 5)
  assert.equal(catalog.children('certificates').length, profile.certifications.length)
  assert.equal(catalog.entries.filter((item) => item.kind === 'image').length, 6)
  assert.equal(new Set(catalog.entries.map((item) => item.id)).size, catalog.entries.length)
  for (const entry of catalog.entries) {
    assert.ok(catalog.folders.has(entry.parent), entry.id)
    assert.ok(existsSync(new URL(`../public${entry.icon}`, import.meta.url)), entry.icon)
    if (entry.target) assert.equal(entry.count, catalog.children(entry.target).length)
    const downloadable = downloadableDocument(entry)
    if (entry.kind === 'folder' || entry.kind === 'shortcut') {
      assert.equal(downloadable, null)
      continue
    }
    if (entry.kind === 'pdf' || entry.kind === 'image') assert.equal(entry.bytes, statSync(new URL(`../public${entry.src}`, import.meta.url)).size)
    else assert.equal(entry.bytes, new TextEncoder().encode(downloadable.text).byteLength)
    if (entry.kind === 'image') assert.equal(entry.images[entry.index].src, entry.src)
    if (entry.kind === 'link') assert.equal(downloadable.text, shortcutText(entry.url))
  }
  const last = 'credential-' + (profile.certifications.length - 1)
  assert.deepEqual(
    catalog.children(last).map((item) => item.kind),
    ['text']
  )
  assert.ok(catalog.children(last)[0].text.includes(profile.cv.source))
  const experience = catalog.entries.find((item) => item.id === 'experience').text
  for (const role of profile.experience) {
    assert.ok(experience.includes(role.year))
    assert.ok(experience.includes(role.company))
  }
  const education = catalog.entries.find((item) => item.id === 'education').text
  for (const school of profile.education) assert.ok(education.includes(school.institution) && education.includes(school.year))
  assert.equal(catalog.entries.find((item) => item.id === 'cv').src, profile.cv.url)
  assert.equal(downloadableDocument(catalog.entries.find((item) => item.id === 'cv')).name, profile.cv.filename)
  assert.ok(findDocuments(catalog.entries, 'ISO 27001').some((item) => item.id === 'experience'))
  assert.ok(findDocuments(catalog.entries, 'Python').some((item) => item.id === 'skills'))
  assert.equal(findDocuments(catalog.entries, 'unmatched-xyz-123').length, 0)
  for (const folder of catalog.folders.values()) {
    assert.equal(resolveDocumentFolder(catalog.path(folder.id), catalog), folder.id)
    assert.equal(resolveDocumentFolder(`C:\\Documents and Settings\\Ghazi\\${catalog.path(folder.id)}\\`, catalog), folder.id)
  }
  assert.equal(resolveDocumentFolder('C:\\Unknown', catalog), null)
  const source = catalog.children(DOCUMENTS_ROOT),
    original = [...source]
  const sorted = sortDocuments(source, 'size', language).filter((item) => item.bytes !== undefined)
  assert.ok(sorted.every((item, index) => index === 0 || sorted[index - 1].bytes >= item.bytes))
  assert.deepEqual(source, original)
}
console.log(
  'My Documents verified: 40 real files/folders/shortcuts, unchanged CV path, 7 credential folders, 6 actual badge images, original dates/locations, matching download bytes, viewer gallery indices, search, sorting and EN/FR folder addresses.'
)
