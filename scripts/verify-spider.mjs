import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { newGame, cloneGame, movable, canMove, move, deal, dealError, undo, hints, validGame, readSave } from '../src/lib/spider-solitaire.mjs'
for (const suits of [1, 2, 4]) {
  const game = newGame(suits, 12345)
  assert.ok(validGame(game))
  assert.deepEqual(
    game.columns.map((c) => c.length),
    [6, 6, 6, 6, 5, 5, 5, 5, 5, 5]
  )
  assert.equal(game.stock.length, 50)
  assert.equal(new Set([...game.columns.flat(), ...game.stock].map((c) => c.suit)).size, suits)
  assert.equal(game.columns.flat().filter((c) => c.up).length, 10)
  assert.deepEqual(game, newGame(suits, 12345))
  const before = cloneGame(game),
    next = deal(game)
  assert.equal(next.stock.length, 40)
  assert.equal(next.columns.flat().filter((c) => c.up).length, 20)
  assert.equal(next.moves, 1)
  assert.equal(next.score, 499)
  assert.deepEqual(game, before)
  assert.ok(validGame(next))
  const previous = undo(next, game)
  assert.deepEqual(previous.columns, game.columns)
  assert.deepEqual(previous.stock, game.stock)
  assert.equal(previous.score, 498)
  assert.equal(previous.moves, 2)
  const blocked = cloneGame(game)
  blocked.columns[1].push(...blocked.columns[0].splice(0))
  assert.equal(dealError(blocked), 'fillColumns')
  assert.equal(deal(blocked), null)
}
const c = (rank, suit = 'spades', up = true) => ({ rank, suit, up })
assert.ok(movable([c(5), c(4), c(3)], 0))
assert.equal(movable([c(5), c(4, 'hearts')], 0), false)
assert.equal(movable([c(5), c(3)], 0), false)
assert.equal(movable([c(5, 'spades', false)], 0), false)
assert.equal(movable([c(5)], NaN), false)
assert.equal(movable([c(5)], -1), false)
assert.equal(canMove({ columns: [[c(4, 'hearts')], [c(5)]] }, 0, 0, 1), true)
assert.equal(canMove({ columns: [[c(4)], [c(4)]] }, 0, 0, 1), false)
assert.equal(canMove({ columns: [[c(4)], []] }, 0, 0, 1), true)
assert.equal(canMove({ columns: [[c(4)]] }, 0, 0, 0), false)
// Complete an actual 13-card suit, reveal its source, then undo both effects.
const completed = newGame(1, 7),
  pool = [...completed.columns.flat(), ...completed.stock]
const take = (rank) => {
  const i = pool.findIndex((c) => c.rank === rank)
  return { ...pool.splice(i, 1)[0], up: true }
}
completed.stock = []
completed.columns = Array.from({ length: 10 }, () => [])
completed.columns[0] = Array.from({ length: 12 }, (_, i) => take(13 - i))
completed.columns[1] = [{ ...take(9), up: false }, take(1)]
completed.columns[9] = pool.map((card) => ({ ...card, up: true }))
assert.ok(validGame(completed))
const result = move(completed, 1, 1, 0)
assert.equal(result.completed.length, 1)
assert.equal(result.completed[0].length, 13)
assert.equal(result.columns[0].length, 0)
assert.equal(result.columns[1][0].up, true)
assert.equal(result.score, 599)
assert.ok(validGame(result))
const undone = undo(result, completed)
assert.equal(undone.completed.length, 0)
assert.equal(undone.columns[1][0].up, false)
assert.equal(undone.score, 498)
assert.ok(validGame(undone))
// Last sequence produces an eight-run win with every original card accounted for.
const final = newGame(1, 9),
  all = [...final.columns.flat(), ...final.stock]
const runs = Array.from({ length: 8 }, () =>
  Array.from({ length: 13 }, (_, i) => {
    const at = all.findIndex((c) => c.rank === 13 - i)
    return { ...all.splice(at, 1)[0], up: true }
  })
)
final.completed = runs.slice(0, 7)
final.columns = Array.from({ length: 10 }, () => [])
final.columns[0] = runs[7].slice(0, 12)
final.columns[1] = runs[7].slice(12)
final.stock = []
assert.ok(validGame(final))
const victory = move(final, 1, 0, 0)
assert.equal(victory.completed.length, 8)
assert.ok(validGame(victory))
assert.equal(deal(victory), null)
// Play hundreds of legal actions across each difficulty, checking conservation and hints.
for (let seed = 0; seed < 12; seed++)
  for (const suits of [1, 2, 4]) {
    let game = newGame(suits, seed)
    for (let step = 0; step < 60; step++) {
      const choices = hints(game)
      assert.ok(choices.every((h) => canMove(game, h.from, h.index, h.to)))
      if (choices.length) {
        const h = choices[(seed + step) % choices.length]
        game = move(game, h.from, h.index, h.to)
      } else if (!dealError(game)) game = deal(game)
      else break
      assert.ok(validGame(game), `Invalid state after suit=${suits}, seed=${seed}, action=${step}`)
    }
  }
const initial = newGame(2, 19),
  current = deal(initial)
const payload = { game: current, initial, history: [initial], elapsed: 67, started: true }
assert.deepEqual(readSave(JSON.stringify(payload)).game, current)
assert.equal(readSave('{bad json'), null)
assert.equal(readSave(JSON.stringify({ ...payload, elapsed: -1 })), null)
const duplicate = cloneGame(current)
duplicate.columns[0][0].id = duplicate.columns[0][1].id
assert.equal(readSave(JSON.stringify({ ...payload, game: duplicate })), null)
const badStock = cloneGame(initial)
badStock.stock[0].up = true
assert.equal(validGame(badStock), false)
const apps = JSON.parse(readFileSync(new URL('../src/data/windows-data.json', import.meta.url)))
assert.equal(apps.find((a) => a.id === 'spider').component, 'Spider')
assert.ok(existsSync(new URL('../public/game/spider/icon.png', import.meta.url)))
console.log(
  'Spider Solitaire verified: 104-card deals in all difficulties, legal runs/placements, reveal/completion/win, stock restrictions, undo/score, immutable actions, randomized play invariants and saved-game validation.'
)

const manifest = JSON.parse(readFileSync(new URL('../public/game/spider/sources.json', import.meta.url)))
assert.equal(manifest.revision, '33a6d492ffa63f0b16b1ad982930c16d367f6bbb')
assert.equal(manifest.records.length, 62)
const { createHash } = await import('node:crypto')
const { cardArtwork } = await import('../src/lib/spider-card-art.mjs')
for (const record of manifest.records) {
  const bytes = readFileSync(new URL('../public/game/spider/' + record.file, import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, record.file)
  if (record.file.startsWith('card-')) {
    assert.equal(bytes.readUInt32BE(16), 71)
    assert.equal(bytes.readUInt32BE(20), 96)
  }
}
for (const [suit, offset] of [
  ['clubs', 0],
  ['diamonds', 13],
  ['hearts', 26],
  ['spades', 39]
])
  for (let rank = 1; rank <= 13; rank++) assert.equal(cardArtwork({ suit, rank }), `/game/spider/card-${offset + rank}.png`)
console.log(
  'Original xp-cards resources verified: 52 correctly mapped card faces, spider back, felt, original icon/About artwork and six WAV resources; all 62 checksums match.'
)

const { dragThreshold, dropColumnAtPoint, dragScroll } = await import('../src/lib/spider-drag.mjs')
const viewport = { left: 10, right: 810, top: 20, bottom: 600 }
const boxes = Array.from({ length: 10 }, (_, i) => ({ left: 22 + i * 78, right: 93 + i * 78, top: 32, bottom: 470 }))
assert.equal(dragThreshold({ x: 0, y: 0 }, { x: 2, y: 2 }), false)
assert.equal(dragThreshold({ x: 0, y: 0 }, { x: 4, y: 0 }), true)
assert.equal(dragThreshold({ x: 0, y: 0 }, { x: 4, y: 0 }, 'touch'), false)
assert.equal(dragThreshold({ x: 0, y: 0 }, { x: 8, y: 0 }, 'touch'), true)
assert.equal(dropColumnAtPoint({ x: 45, y: 430 }, viewport, boxes), 0, 'The open space below the cards remains a drop target')
assert.equal(dropColumnAtPoint({ x: 96, y: 200 }, viewport, boxes), 0, 'Small gaps between columns are forgiving')
assert.equal(dropColumnAtPoint({ x: -10, y: 200 }, viewport, boxes), null)
assert.equal(dropColumnAtPoint({ x: 45, y: 550 }, viewport, boxes), null, 'Stock area is not a tableau destination')
assert.equal(dropColumnAtPoint({ x: NaN, y: 200 }, viewport, boxes), null)
const shifted = boxes.map((r) => ({ left: r.left - 150, right: r.right - 150, top: r.top - 100, bottom: r.bottom - 100 }))
assert.equal(dropColumnAtPoint({ x: 45, y: 200 }, viewport, shifted), 2, 'Drop geometry tracks horizontal and vertical scrolling')
assert.deepEqual(dragScroll({ x: 400, y: 300 }, viewport), { x: 0, y: 0 })
assert.ok(dragScroll({ x: 11, y: 599 }, viewport).x < 0)
assert.ok(dragScroll({ x: 11, y: 599 }, viewport).y > 0)
assert.deepEqual(dragScroll({ x: -50, y: 700 }, viewport), { x: 0, y: 0 })
console.log('Drag controls verified: mouse/touch thresholds, full-column targets, gaps, clipping, scrolled coordinates and edge scrolling.')
