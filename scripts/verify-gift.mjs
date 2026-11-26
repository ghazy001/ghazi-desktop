import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import {
  characters,
  normalizeName,
  validateName,
  certificateFilename,
  createVisit,
  formatVisitDate,
  wrapText,
  fitName
} from '../src/components/Windows/Gift/certificate.mjs'
assert.equal(normalizeName('  Ghazi\n Saoudi\u202e  '), 'Ghazi Saoudi')
assert.equal(normalizeName('Jose\u0301'), 'José')
assert.equal(normalizeName('غازي السعدي'), 'غازي السعدي')
assert.equal(validateName(' \n\t').error, 'required')
assert.equal(validateName('W'.repeat(81)).error, 'tooLong')
assert.equal(validateName('W'.repeat(80)).error, null)
assert.equal(characters('👩🏽‍💻').length, 1)
assert.equal(validateName('👩🏽‍💻'.repeat(80)).error, null)
assert.equal(certificateFilename('../../Ghazi <Saoudi>'), 'Ghazi-XP-Certificate-Ghazi-Saoudi.png')
assert.ok(certificateFilename('غازي السعدي').includes('غازي-السعدي'))
assert.throws(() => createVisit(''), /required/)
const visit = createVisit('Jordan Lee', new Date('2026-11-26T12:34:00Z'))
assert.match(visit.code, /^GX-20261126-[A-F\d]{6}$/)
assert.equal(visit.issuedAt, '2026-11-26T12:34:00.000Z')
assert.ok(formatVisitDate({ ...visit, timezone: 'UTC' }, 'en').includes('12:34'))
assert.ok(formatVisitDate({ ...visit, timezone: 'UTC' }, 'fr').includes('novembre'))
assert.deepEqual(
  wrapText('one two three', (text) => text.length, 7),
  ['one two', 'three']
)
assert.deepEqual(
  wrapText('ABCDEFGHIJ', (text) => text.length, 4),
  ['ABCD', 'EFGH', 'IJ']
)
let fontSize = 0
const context = {
  set font(value) {
    fontSize = Number(value.match(/(\d+)px/)[1])
  },
  measureText: (text) => ({ width: characters(text).length * fontSize * 0.85 })
}
for (const name of ['W'.repeat(80), 'Alexandra '.repeat(8).trim(), '陈'.repeat(80), 'غازي السعدي']) {
  const fitted = fitName(context, name)
  assert.ok(fitted.lines.length <= 3)
  assert.ok(fitted.lines.every((line) => context.measureText(line).width <= 780))
  assert.ok(fitted.lines.length * fitted.size * 1.15 <= 170)
}
const json = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const windows = json('windows-data')
assert.equal(windows.filter((w) => w.id === 'gift').length, 1)
assert.ok(windows.find((w) => w.id === 'gift').onDesktop)
for (const lang of ['en', 'fr']) {
  const data = json('gift-data')[lang]
  assert.ok(data.certificate.title && data.generate && data.save)
  assert.ok(data.certificate.brand.includes('GHAZI SAOUDI'))
}
for (const path of ['public/img/icons/gift/gift.png', 'public/fonts/caveat/Caveat.ttf', 'public/fonts/caveat/OFL.txt'])
  assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path)
console.log(
  'Gift checks passed: Unicode name validation and normalization, bounded long-name layout, safe filenames, dated visit records, localized dates, app registration and local assets.'
)
