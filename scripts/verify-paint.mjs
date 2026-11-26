import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fillPixels, PaintHistory } from '../src/components/Windows/Paint/paint-engine.mjs'

// A closed black boundary must contain a fill, including an enclosed white island.
const image = { width: 7, height: 7, data: new Uint8ClampedArray(7 * 7 * 4).fill(255) }
const pixel = (x, y) => image.data.subarray((y * image.width + x) * 4, (y * image.width + x + 1) * 4)
for (let i = 1; i <= 5; i++) {
  for (const [x, y] of [
    [i, 1],
    [i, 5],
    [1, i],
    [5, i]
  ])
    pixel(x, y).set([0, 0, 0, 255])
}
pixel(3, 3).set([0, 0, 0, 255])
assert.equal(fillPixels(image, 2.5, 2.5, '#0080ff'), true)
assert.deepEqual([...pixel(2, 2)], [0, 128, 255, 255])
assert.deepEqual([...pixel(4, 4)], [0, 128, 255, 255])
assert.deepEqual([...pixel(3, 3)], [0, 0, 0, 255])
assert.deepEqual([...pixel(0, 0)], [255, 255, 255, 255])
assert.equal(fillPixels(image, 2, 2, '#0080ff'), false)
assert.equal(fillPixels(image, -1, 0, '#ff0000'), false)
const large = { width: 1200, height: 900, data: new Uint8ClampedArray(1200 * 900 * 4) }
assert.equal(fillPixels(large, 600, 450, '#ff8040'), true)
assert.deepEqual([...large.data.slice(-4)], [255, 128, 64, 255])

// Undo must restore both pixels and dimensions; an edit after undo discards the redo branch.
let pixels = new Uint8ClampedArray(16)
const canvas = {
  width: 2,
  height: 2,
  getContext: () => ({
    getImageData: () => ({ data: pixels.slice() }),
    putImageData: (image) => {
      pixels = image.data.slice()
    }
  })
}
const history = new PaintHistory(canvas)
history.commit()
pixels.fill(10)
history.commit()
canvas.width = 3
pixels = new Uint8ClampedArray(24).fill(20)
history.commit()
assert.equal(history.undo(), true)
assert.equal(canvas.width, 2)
assert.equal(pixels.length, 16)
assert.equal(pixels[0], 10)
assert.equal(history.redo(), true)
assert.equal(canvas.width, 3)
assert.equal(pixels[0], 20)
history.undo()
pixels.fill(30)
history.commit()
assert.equal(history.redo(), false)
history.limit = 64
for (let i = 0; i < 12; i++) {
  pixels.fill(i)
  history.commit()
}
assert.ok(history.undoStates.reduce((sum, s) => sum + s.data.data.byteLength, 0) <= 64)
while (history.undo()) {
  /* reach retained oldest state */
}
assert.equal(history.undo(), false)
assert.equal(history.redo(), true)

const json = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const profile = json('profile-data')
const about = json('paint-about-data')
for (const category of about.skillGroups)
  assert.ok(
    profile.skills.some((s) => s.category === category),
    category
  )
assert.ok(about.en.intro.length && about.fr.intro.length)
assert.ok(existsSync(new URL('../public/fonts/caveat/Caveat.ttf', import.meta.url)))
assert.ok(existsSync(new URL('../public/fonts/caveat/OFL.txt', import.meta.url)))
assert.equal(json('windows-data').filter((w) => w.id === 'paint').length, 1)
console.log(
  'Paint checks passed: bounded flood fill, large canvas fill, undo/redo pixels and image dimensions, redo branching, history budget, profile references and local font.'
)
