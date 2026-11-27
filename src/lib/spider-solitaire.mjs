export const SUITS = ['spades', 'hearts', 'clubs', 'diamonds']
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export function randomSeed() {
  return globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296)
}
export function newGame(suits = 1, seed = randomSeed()) {
  if (![1, 2, 4].includes(suits)) throw new Error('Invalid difficulty')
  let value = seed >>> 0
  const random = () => {
    value = (value + 0x6d2b79f5) >>> 0
    let n = Math.imul(value ^ (value >>> 15), 1 | value)
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
  const deck = Array.from({ length: 104 }, (_, id) => ({ id, rank: (id % 13) + 1, suit: SUITS[Math.floor(id / 13) % suits], up: false }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  const columns = Array.from({ length: 10 }, (_, i) => {
    const column = deck.splice(0, i < 4 ? 6 : 5)
    column[column.length - 1].up = true
    return column
  })
  return { version: 1, suits, seed: seed >>> 0, columns, stock: deck, completed: [], score: 500, moves: 0 }
}
export const cloneGame = (game) => JSON.parse(JSON.stringify(game))
export function movable(column, index) {
  if (!Number.isInteger(index) || index < 0 || index >= column.length || !column[index].up) return false
  for (let i = index; i < column.length - 1; i++)
    if (!column[i + 1].up || column[i].suit !== column[i + 1].suit || column[i].rank !== column[i + 1].rank + 1) return false
  return true
}
export function canMove(game, from, index, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || !game.columns[from] || !game.columns[to] || !movable(game.columns[from], index)) return false
  const destination = game.columns[to].at(-1)
  return !destination || (destination.up && destination.rank === game.columns[from][index].rank + 1)
}
function settle(game) {
  for (const column of game.columns) {
    while (column.length) {
      column.at(-1).up = true
      const start = column.length - 13
      if (start < 0 || column[start].rank !== 13 || !movable(column, start)) break
      game.completed.push(column.splice(start))
      game.score += 100
    }
  }
}
export function move(game, from, index, to) {
  if (!canMove(game, from, index, to)) return null
  const next = cloneGame(game)
  next.columns[to].push(...next.columns[from].splice(index))
  next.moves++
  next.score--
  settle(next)
  return next
}
export function dealError(game) {
  if (game.stock.length < 10) return 'stockEmpty'
  if (game.columns.some((column) => !column.length)) return 'fillColumns'
  return null
}
export function deal(game) {
  if (dealError(game)) return null
  const next = cloneGame(game)
  for (const column of next.columns) column.push({ ...next.stock.pop(), up: true })
  next.moves++
  next.score--
  settle(next)
  return next
}
export function undo(game, previous) {
  if (!previous) return null
  const restored = cloneGame(previous)
  restored.score = game.score - 1 - (game.completed.length - previous.completed.length) * 100
  restored.moves = game.moves + 1
  return restored
}
export function hints(game) {
  const result = []
  game.columns.forEach((column, from) =>
    column.forEach((card, index) => {
      if (!movable(column, index)) return
      game.columns.forEach((destination, to) => {
        if (!canMove(game, from, index, to) || (!destination.length && index === 0)) return
        const reveals = index > 0 && !column[index - 1].up
        const sameSuit = destination.at(-1)?.suit === card.suit
        const length = column.length - index
        result.push({ from, index, to, priority: (sameSuit ? 20 : 0) + (reveals ? 12 : 0) + length })
      })
    })
  )
  return result.sort((a, b) => b.priority - a.priority)
}
export function validGame(game) {
  if (!game || game.version !== 1 || ![1, 2, 4].includes(game.suits) || !Number.isInteger(game.seed) || game.seed < 0 || game.seed > 4294967295) return false
  if (!Array.isArray(game.columns) || game.columns.length !== 10 || game.columns.some((c) => !Array.isArray(c))) return false
  if (
    !Array.isArray(game.stock) ||
    game.stock.length > 50 ||
    game.stock.length % 10 ||
    !Array.isArray(game.completed) ||
    game.completed.length > 8 ||
    game.completed.some((c) => !Array.isArray(c))
  )
    return false
  if (!Number.isSafeInteger(game.score) || Math.abs(game.score) > 10000000 || !Number.isSafeInteger(game.moves) || game.moves < 0 || game.moves > 10000000) return false
  const cards = [...game.columns.flat(), ...game.stock, ...game.completed.flat()]
  if (cards.length !== 104 || new Set(cards.map((card) => card?.id)).size !== 104) return false
  if (
    cards.some(
      (c) =>
        !c ||
        !Number.isInteger(c.id) ||
        c.id < 0 ||
        c.id > 103 ||
        c.rank !== (c.id % 13) + 1 ||
        c.suit !== SUITS[Math.floor(c.id / 13) % game.suits] ||
        typeof c.up !== 'boolean'
    )
  )
    return false
  if (game.stock.some((c) => c.up)) return false
  if (game.completed.some((c) => c.length !== 13 || c[0].rank !== 13 || !movable(c, 0))) return false
  return game.columns.every((c) => {
    if (c.length && !c.at(-1).up) return false
    const firstUp = c.findIndex((card) => card.up)
    return firstUp < 0 || c.slice(firstUp).every((card) => card.up)
  })
}
export function readSave(text) {
  try {
    if (!text || text.length > 1000000) return null
    const saved = JSON.parse(text)
    if (
      !validGame(saved.game) ||
      !validGame(saved.initial) ||
      saved.game.suits !== saved.initial.suits ||
      saved.game.seed !== saved.initial.seed ||
      !Number.isInteger(saved.elapsed) ||
      saved.elapsed < 0 ||
      saved.elapsed > 100000000
    )
      return null
    // Restart always reconstructs the original deal rather than trusting stored initial cards.
    saved.initial = newGame(saved.game.suits, saved.game.seed)
    saved.history = (Array.isArray(saved.history) ? saved.history : [])
      .slice(-30)
      .filter((state) => validGame(state) && state.seed === saved.game.seed && state.suits === saved.game.suits)
    return saved
  } catch {
    return null
  }
}
