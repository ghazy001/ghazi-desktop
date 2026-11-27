import test from 'node:test'
import assert from 'node:assert/strict'
import { createFrameScheduler } from '../src/lib/frame-scheduler.mjs'
import { dragWindowPosition, resizeWindowSize } from '../src/lib/window-geometry.mjs'
import { restoredWindows, storedValue, storeValue } from '../src/lib/browser-storage.mjs'
test('pointer bursts paint once per frame using the most recent coordinates', () => {
  const queued = new Map(),
    painted = []
  let id = 0
  const frames = createFrameScheduler(
    (point) => painted.push(point),
    (callback) => {
      queued.set(++id, callback)
      return id
    },
    (number) => queued.delete(number)
  )
  for (let x = 0; x < 100; x++) frames.push({ x, y: 25 })
  assert.equal(queued.size, 1)
  assert.equal(painted.length, 0)
  const callback = queued.values().next().value
  queued.clear()
  callback()
  assert.deepEqual(painted, [{ x: 99, y: 25 }])
  frames.push({ x: 150, y: 50 })
  frames.flush()
  assert.equal(queued.size, 0)
  assert.deepEqual(painted.at(-1), { x: 150, y: 50 })
  frames.push({ x: 300, y: 70 })
  frames.cancel()
  assert.equal(queued.size, 0)
  assert.equal(painted.length, 2)
})
test('dragging keeps a usable title bar on screen and does not lose fast pointer movement', () => {
  const viewport = { width: 1200, height: 768 },
    size = { width: 800, height: 600 },
    origin = { x: 100, y: 70 },
    start = { x: 150, y: 85 }
  assert.deepEqual(dragWindowPosition(start, { x: 190, y: 105 }, origin, size, viewport), { x: 140, y: 90 })
  assert.deepEqual(dragWindowPosition(start, { x: -900, y: -900 }, origin, size, viewport), { x: 0, y: 0 })
  assert.deepEqual(dragWindowPosition(start, { x: 9000, y: 9000 }, origin, size, viewport), { x: 1040, y: 740 })
})
test('resizing respects minimums, directions, the taskbar and available screen space', () => {
  const size = { width: 800, height: 600 },
    min = { width: 340, height: 320 },
    viewport = { width: 1200, height: 768 },
    origin = { x: 100, y: 40 }
  assert.deepEqual(resizeWindowSize(size, { x: 1000, y: 1000 }, 'corner', min, viewport, origin), { width: 1100, height: 728 })
  assert.deepEqual(resizeWindowSize(size, { x: -1000, y: -1000 }, 'corner', min, viewport, origin), min)
  assert.deepEqual(resizeWindowSize(size, { x: 20, y: 80 }, 'right', min, viewport, origin), { width: 820, height: 600 })
  assert.deepEqual(resizeWindowSize(size, { x: 20, y: 80 }, 'bottom', min, viewport, origin), { width: 800, height: 680 })
})
test('blocked, full and corrupted storage cannot prevent desktop startup', () => {
  const blocked = {
    getItem() {
      throw Error('Blocked')
    },
    setItem() {
      throw Error('Full')
    }
  }
  assert.equal(storedValue('language', 'en', blocked), 'en')
  assert.equal(storeValue('windows', '[]', blocked), false)
  assert.deepEqual(restoredWindows(blocked), [])
  for (const text of ['not JSON', '{}', 'null', 'x'.repeat(17000)]) assert.deepEqual(restoredWindows({ getItem: () => text }), [])
  assert.deepEqual(restoredWindows({ getItem: () => JSON.stringify(['myCV', 'assistant', 'myCV', null, 22, '../bad']) }), ['myCV', 'assistant'])
})
