<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useVolumeStore } from '@/stores/volumeStore'
import data from '@/data/spider-data.json'
import menuData from '@/data/spider-menu-data.json'
import { RANKS, newGame, cloneGame, movable, canMove, move, deal, dealError, undo, hints, readSave } from '@/lib/spider-solitaire.mjs'
import PlayingCard from './PlayingCard.vue'
import { dragThreshold, dropColumnAtPoint, dragScroll } from '@/lib/spider-drag.mjs'
import './spider.css'
const props = defineProps({ active: { type: Boolean, default: true } })
const locale = useLocaleStore(),
  volume = useVolumeStore()
const copy = computed(() => {
  const lang = locale.currentLocale === 'fr' ? 'fr' : 'en'
  return { ...data[lang], ...menuData[lang] }
})
let saved = null
try {
  saved = readSave(localStorage.getItem(data.storageKey))
} catch {
  /* The game remains playable without storage. */
}
const game = ref(saved?.game || newGame()),
  initial = ref(saved?.initial || cloneGame(game.value)),
  history = ref(saved?.history || [])
const elapsed = ref(saved?.elapsed || 0),
  started = ref(saved?.started === true || game.value.moves > 0),
  sound = ref(saved?.sound === true)
const dialog = ref(saved ? (game.value.completed.length === 8 ? 'won' : null) : 'new'),
  difficulty = ref(game.value.suits)
const selected = ref(null),
  hint = ref(null),
  hintIndex = ref(0),
  message = ref('ready'),
  hintMessage = ref(null),
  storageFailed = ref(false)
const root = ref(null),
  table = ref(null),
  dialogRoot = ref(null),
  pageHidden = ref(document.hidden)
const tableWidth = ref(900),
  tableHeight = ref(500),
  dragging = ref(null),
  dragPoint = ref({ x: 0, y: 0 }),
  dragTarget = ref(null),
  largeCards = ref(saved?.largeCards === true)
let pointer = null,
  dragFrame = 0,
  suppressClickUntil = 0
const draggedCards = computed(() => (dragging.value ? game.value.columns[dragging.value.from].slice(dragging.value.index) : []))
const dragOffsets = computed(() =>
  dragging.value
    ? layouts.value[dragging.value.from].tops.slice(dragging.value.index).map((top) => top - layouts.value[dragging.value.from].tops[dragging.value.index])
    : []
)
const validDrop = computed(() => dragging.value && dragTarget.value !== null && canMove(game.value, dragging.value.from, dragging.value.index, dragTarget.value))
const won = computed(() => game.value.completed.length === 8)
const paused = computed(() => !props.active || pageHidden.value || !!dialog.value)
const cardWidth = computed(() => Math.min(71, (Math.max(tableWidth.value, largeCards.value ? 720 : 0) - 24 - 9 * 8) / 10))
const cardHeight = computed(() => (cardWidth.value * 96) / 71)
const layouts = computed(() =>
  game.value.columns.map((column) => {
    const hidden = column.filter((c) => !c.up).length
    const shown = column.length - hidden
    const fan = Math.max(cardWidth.value < 50 ? 23 : 19, Math.min(26, (tableHeight.value - 140 - cardHeight.value - hidden * 6) / Math.max(1, shown - 1)))
    let y = 0
    const tops = column.map((c) => {
      const top = y
      y += c.up ? fan : 6
      return top
    })
    return { tops, height: column.length ? tops.at(-1) + cardHeight.value : cardHeight.value }
  })
)
const boardHeight = computed(() => Math.max(tableHeight.value, ...layouts.value.map((layout) => layout.height + 150)))
const clock = computed(
  () =>
    `${Math.floor(elapsed.value / 60)
      .toString()
      .padStart(2, '0')}:${(elapsed.value % 60).toString().padStart(2, '0')}`
)
const status = computed(() =>
  hintMessage.value
    ? copy.value.hintMove
        .replace('{card}', cardName(hintMessage.value.card))
        .replace('{from}', hintMessage.value.from + 1)
        .replace('{to}', hintMessage.value.to + 1)
    : copy.value[message.value]
)
const activeWindow = inject('activeWindow', ref(null))
const activateWindow = inject('activateWindow', null)
let observer, timer, previousFocus
const audioPlayers = new Map()
function cardName(card) {
  return `${RANKS[card.rank - 1]} ${copy.value.of} ${copy.value[card.suit]}`
}
function cardLabel(card, column) {
  return `${cardName(card)}, ${copy.value.column} ${column + 1}`
}
function say(key) {
  message.value = key
  hintMessage.value = null
}
function save() {
  try {
    localStorage.setItem(
      data.storageKey,
      JSON.stringify({
        game: game.value,
        initial: initial.value,
        elapsed: elapsed.value,
        history: history.value.slice(-30),
        started: started.value,
        sound: sound.value,
        largeCards: largeCards.value
      })
    )
    storageFailed.value = false
  } catch {
    storageFailed.value = true
  }
}
function beep(kind = 'move') {
  if (!sound.value || !volume.volume || !props.active || document.hidden) return
  const resource = kind === 'win' ? 129 : kind === 'deal' ? 124 : 125
  try {
    if (!audioPlayers.has(resource)) audioPlayers.set(resource, new Audio(`/game/spider/sound-${resource}.wav`))
    const player = audioPlayers.get(resource)
    player.volume = volume.volume
    player.currentTime = 0
    player.play().catch(() => {})
  } catch {
    /* The game remains playable when audio is unavailable. */
  }
}
watch(largeCards, save)
function stopSounds() {
  for (const player of audioPlayers.values()) player.pause()
}
watch(
  () => props.active,
  (active) => {
    if (!active) {
      cancelDrag()
      stopSounds()
      save()
    }
  }
)
watch(sound, (enabled) => {
  if (!enabled) stopSounds()
})
function clearSelection() {
  selected.value = null
  hint.value = null
  hintMessage.value = null
  cancelDrag()
}
function apply(next, key) {
  if (!next || won.value) return false
  history.value.push(cloneGame(game.value))
  if (history.value.length > 100) history.value.shift()
  game.value = next
  started.value = true
  clearSelection()
  hintIndex.value = 0
  say(key)
  save()
  beep(key === 'dealDone' ? 'deal' : 'move')
  if (won.value) {
    beep('win')
    openDialog('won')
  }
  return true
}
function moveTo(from, index, to) {
  if (!apply(move(game.value, from, index, to), 'moveDone')) {
    say('invalid')
    return false
  }
  nextTick(() => focusCard(to))
  return true
}
function choose(column, index) {
  if (paused.value || won.value) return
  started.value = true
  if (selected.value && selected.value.from !== column) {
    moveTo(selected.value.from, selected.value.index, column)
    return
  }
  if (selected.value?.from === column && selected.value.index === index) {
    clearSelection()
    say('ready')
    return
  }
  if (!movable(game.value.columns[column], index)) {
    say('invalid')
    return
  }
  selected.value = { from: column, index }
  hint.value = null
  say('selected')
}
function chooseColumn(column, event) {
  if (paused.value || won.value || (event?.detail && performance.now() < suppressClickUntil)) return
  if (selected.value) moveTo(selected.value.from, selected.value.index, column)
  else say('selectFirst')
}
function dealCards() {
  if (won.value || paused.value || dragging.value) return
  const error = dealError(game.value)
  if (error) {
    say(error)
    return
  }
  apply(deal(game.value), 'dealDone')
}
function undoMove() {
  if (!history.value.length || dialog.value) return
  game.value = undo(game.value, history.value.pop())
  clearSelection()
  hintIndex.value = 0
  say('undoDone')
  save()
  beep()
}
function showHint() {
  if (dialog.value || won.value) return
  clearSelection()
  const choices = hints(game.value)
  if (!choices.length) {
    say(!dealError(game.value) ? 'hintDeal' : 'noHints')
    return
  }
  const move = choices[hintIndex.value++ % choices.length]
  hint.value = move
  hintMessage.value = { card: game.value.columns[move.from][move.index], from: move.from, to: move.to }
  nextTick(() => root.value?.querySelector(`[data-card="${game.value.columns[move.from][move.index].id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
}
function openDialog(kind) {
  cancelDrag()
  previousFocus = document.activeElement
  if (kind === 'new') difficulty.value = game.value.suits
  dialog.value = kind
  nextTick(() => dialogRoot.value?.querySelector('input:checked,button')?.focus())
}
function closeDialog() {
  dialog.value = null
  nextTick(() => {
    if (previousFocus?.isConnected) previousFocus.focus()
    else root.value?.querySelector('.spider-toolbar button')?.focus()
  })
}
function play(restart = false) {
  game.value = restart ? cloneGame(initial.value) : newGame(difficulty.value)
  initial.value = cloneGame(game.value)
  elapsed.value = 0
  history.value = []
  started.value = true
  clearSelection()
  hintIndex.value = 0
  dialog.value = null
  say('newDone')
  save()
  beep('deal')
  nextTick(() => focusCard(0))
}
function toggleSound() {
  sound.value = !sound.value
  if (sound.value) beep()
  save()
}
function focusCard(column, index = game.value.columns[column].length - 1) {
  const card = game.value.columns[column][index]
  const target = card?.up ? root.value?.querySelector(`[data-card="${card.id}"]`) : root.value?.querySelector(`[data-empty="${column}"]`)
  target?.focus()
}
function cardKey(event, column, index) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    focusCard((column + (event.key === 'ArrowRight' ? 1 : 9)) % 10)
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const next = index + (event.key === 'ArrowDown' ? 1 : -1)
    if (game.value.columns[column][next]?.up) focusCard(column, next)
  }
}
function clickCard(event, from, index) {
  if (event.detail && performance.now() < suppressClickUntil) return
  choose(from, index)
}
function finishPointer() {
  const captured = pointer
  pointer = null
  cancelAnimationFrame(dragFrame)
  dragFrame = 0
  dragging.value = null
  dragTarget.value = null
  try {
    if (captured?.element.hasPointerCapture(captured.id)) captured.element.releasePointerCapture(captured.id)
  } catch {
    /* Closing or resizing the window can remove the captured element. */
  }
}
function cancelDrag() {
  if (dragging.value) {
    suppressClickUntil = performance.now() + 350
    selected.value = null
  }
  finishPointer()
}
function pointerDown(event, from, index) {
  if (event.button !== 0 || !event.isPrimary || dialog.value || pageHidden.value || won.value || !movable(game.value.columns[from], index)) return
  cancelDrag()
  if (activeWindow.value !== 'spider') activateWindow?.('spider')
  const rect = event.currentTarget.getBoundingClientRect()
  pointer = {
    id: event.pointerId,
    type: event.pointerType,
    from,
    index,
    element: event.currentTarget,
    start: { x: event.clientX, y: event.clientY },
    point: { x: event.clientX, y: event.clientY },
    grabX: event.clientX - rect.left,
    grabY: event.clientY - rect.top,
    width: rect.width,
    scrollLeft: table.value.scrollLeft,
    scrollTop: table.value.scrollTop,
    columns: [...root.value.querySelectorAll('.spider-column')].map((el) => el.getBoundingClientRect())
  }
  try {
    event.currentTarget.setPointerCapture(event.pointerId)
  } catch {
    pointer = null
  }
}
function hitColumn(point) {
  if (!pointer || !table.value) return null
  const dx = pointer.scrollLeft - table.value.scrollLeft,
    dy = pointer.scrollTop - table.value.scrollTop
  return dropColumnAtPoint(
    point,
    table.value.getBoundingClientRect(),
    pointer.columns.map((r) => ({ left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy }))
  )
}
function paintDrag() {
  dragFrame = 0
  if (!pointer || !dragging.value) return
  if (paused.value) {
    cancelDrag()
    return
  }
  const scroller = table.value,
    rect = scroller.getBoundingClientRect(),
    step = dragScroll(pointer.point, rect)
  const left = scroller.scrollLeft,
    top = scroller.scrollTop
  scroller.scrollLeft += step.x
  scroller.scrollTop += step.y
  dragPoint.value = { x: pointer.point.x - pointer.grabX, y: pointer.point.y - pointer.grabY }
  dragTarget.value = hitColumn(pointer.point)
  if (scroller.scrollLeft !== left || scroller.scrollTop !== top) dragFrame = requestAnimationFrame(paintDrag)
}
function pointerMove(event) {
  if (!pointer || event.pointerId !== pointer.id) return
  pointer.point = { x: event.clientX, y: event.clientY }
  if (!dragging.value) {
    if (!dragThreshold(pointer.start, pointer.point, pointer.type)) return
    if (paused.value) {
      cancelDrag()
      return
    }
    dragPoint.value = { x: event.clientX - pointer.grabX, y: event.clientY - pointer.grabY }
    dragging.value = { from: pointer.from, index: pointer.index, width: pointer.width }
    selected.value = { from: pointer.from, index: pointer.index }
    hint.value = null
    started.value = true
  }
  if (event.cancelable) event.preventDefault()
  if (!dragFrame) dragFrame = requestAnimationFrame(paintDrag)
}
function pointerUp(event) {
  if (!pointer || event.pointerId !== pointer.id) return
  const source = dragging.value,
    target = hitColumn({ x: event.clientX, y: event.clientY })
  const allowed = !paused.value && source && target !== null && canMove(game.value, source.from, source.index, target)
  if (source) suppressClickUntil = performance.now() + 350
  finishPointer()
  if (!source) return // A short press keeps the normal click/tap and keyboard interaction.
  selected.value = null
  if (allowed) moveTo(source.from, source.index, target)
  else if (target !== source.from) say('invalid')
}
function lostPointer(event) {
  if (pointer?.id === event.pointerId) cancelDrag()
}
function command(event) {
  if (activeWindow.value !== 'spider' || dialog.value) return
  const actions = {
    new: () => openDialog('new'),
    restart: () => openDialog('restart'),
    help: () => openDialog('help'),
    options: () => openDialog('options'),
    about: () => openDialog('about'),
    undo: undoMove,
    hint: showHint,
    deal: dealCards,
    sound: toggleSound,
    large: () => (largeCards.value = !largeCards.value)
  }
  actions[event.detail]?.()
}
function keydown(event) {
  if (activeWindow.value !== 'spider') return
  if (dialog.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDialog()
    }
    if (event.key === 'Tab') {
      const nodes = [...dialogRoot.value.querySelectorAll('button, input:checked')]
      const index = nodes.indexOf(document.activeElement)
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === nodes.length - 1)) {
        event.preventDefault()
        nodes[event.shiftKey ? nodes.length - 1 : 0]?.focus()
      }
    }
    return
  }
  if (['F2', 'F3'].includes(event.key)) {
    event.preventDefault()
    openDialog('new')
  }
  if (event.key === 'F1' || event.key === 'F5') {
    event.preventDefault()
    openDialog(event.key === 'F1' ? 'help' : 'options')
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    undoMove()
  }
  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    if (['h', 'm'].includes(event.key.toLowerCase())) {
      event.preventDefault()
      showHint()
    }
    if (event.key.toLowerCase() === 'd') {
      event.preventDefault()
      dealCards()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSelection()
      say('ready')
    }
  }
}
function visibility() {
  pageHidden.value = document.hidden
  if (document.hidden) {
    cancelDrag()
    stopSounds()
  }
  save()
}
onMounted(() => {
  observer = new ResizeObserver(() => {
    if (tableWidth.value !== table.value.clientWidth || tableHeight.value !== table.value.clientHeight) cancelDrag()
    tableWidth.value = table.value.clientWidth
    tableHeight.value = table.value.clientHeight
  })
  observer.observe(table.value)
  window.addEventListener('blur', cancelDrag)
  window.addEventListener('resize', cancelDrag)
  window.addEventListener('spider-command', command)
  window.addEventListener('keydown', keydown)
  document.addEventListener('visibilitychange', visibility)
  timer = setInterval(() => {
    if (started.value && !paused.value && !won.value) {
      elapsed.value++
      if (elapsed.value % 15 === 0) save()
    }
  }, 1000)
  if (dialog.value) nextTick(() => dialogRoot.value?.querySelector('input:checked,button')?.focus())
})
onBeforeUnmount(() => {
  cancelDrag()
  save()
  observer?.disconnect()
  clearInterval(timer)
  window.removeEventListener('blur', cancelDrag)
  window.removeEventListener('resize', cancelDrag)
  window.removeEventListener('spider-command', command)
  window.removeEventListener('keydown', keydown)
  document.removeEventListener('visibilitychange', visibility)
  stopSounds()
  for (const player of audioPlayers.values()) {
    player.removeAttribute('src')
    player.load()
  }
  audioPlayers.clear()
})
</script>
<template>
  <div ref="root" class="xp-spider" :class="{ 'spider-large-cards': largeCards, 'spider-dragging': !!dragging }">
    <nav class="spider-toolbar" :aria-label="copy.newTitle">
      <button @click="openDialog('new')">{{ copy.newGame }}</button><button :disabled="!history.length" @click="undoMove">{{ copy.undo }}</button
      ><button @click="showHint">{{ copy.hint }}</button><button :disabled="!game.stock.length || won" @click="dealCards">{{ copy.deal }}</button><i></i
      ><button @click="openDialog('help')">{{ copy.help }}</button
      ><button class="spider-sound" :aria-pressed="sound" @click="toggleSound">{{ sound ? copy.soundOn : copy.soundOff }}</button>
    </nav>
    <div ref="table" class="spider-scroll" :inert="dialog ? true : undefined">
      <div
        class="spider-table"
        :style="{ '--card-w': `${cardWidth}px`, '--card-h': `${cardHeight}px`, height: `${boardHeight}px`, minWidth: largeCards ? '720px' : '0' }"
      >
        <div class="spider-columns">
          <div
            v-for="(column, c) in game.columns"
            :key="c"
            class="spider-column"
            :class="{
              'spider-hint-target': hint?.to === c,
              'spider-drop-allowed': dragging && canMove(game, dragging.from, dragging.index, c),
              'spider-drop-target': dragTarget === c && validDrop,
              'spider-drop-invalid': dragTarget === c && dragging && dragging.from !== c && !validDrop
            }"
            :style="{ height: `${Math.max(layouts[c].height, boardHeight - 150)}px` }"
            :data-column="c"
            @click.self="chooseColumn(c, $event)"
          >
            <button
              v-if="!column.length"
              class="spider-empty"
              :data-empty="c"
              :aria-label="`${copy.empty} ${c + 1}`"
              @click="chooseColumn(c, $event)"
              @keydown="cardKey($event, c, -1)"
            >
              <span>{{ c + 1 }}</span>
            </button>
            <template v-for="(card, index) in column" :key="card.id">
              <button
                v-if="card.up"
                class="spider-card-button"
                :class="{
                  'spider-selected': selected?.from === c && selected.index <= index,
                  'spider-hint-card': hint?.from === c && hint.index <= index,
                  'spider-drag-source': dragging?.from === c && dragging.index <= index,
                  'spider-card-movable': movable(column, index)
                }"
                :style="{ top: `${layouts[c].tops[index]}px` }"
                :data-card="card.id"
                :data-rank="card.rank"
                :data-suit="card.suit"
                :data-index="index"
                :aria-label="cardLabel(card, c)"
                :aria-pressed="selected?.from === c && selected.index <= index"
                :tabindex="index === column.length - 1 ? 0 : -1"
                :draggable="false"
                @click.stop="clickCard($event, c, index)"
                @keydown="cardKey($event, c, index)"
                @pointerdown="pointerDown($event, c, index)"
                @pointermove="pointerMove"
                @pointerup="pointerUp"
                @pointercancel="lostPointer"
                @lostpointercapture="lostPointer"
                @dragstart.prevent
              >
                <PlayingCard :card="card" />
              </button>
              <div v-else class="spider-hidden-card" :style="{ top: `${layouts[c].tops[index]}px` }"><PlayingCard back /></div>
            </template>
          </div>
        </div>
        <div class="spider-completed" :aria-label="`${copy.runs}: ${game.completed.length} / 8`">
          <div v-for="slot in game.completed.length" :key="slot" class="spider-foundation">
            <PlayingCard v-if="game.completed[slot - 1]" :card="game.completed[slot - 1][0]" /><span v-else>♠</span>
          </div>
        </div>
        <button class="spider-stock" :aria-label="copy.stockLabel.replace('{count}', game.stock.length / 10)" :disabled="!game.stock.length || won" @click="dealCards">
          <PlayingCard v-for="pile in game.stock.length / 10" :key="pile" back :style="{ right: `${(pile - 1) * 13}px` }" /><span
            v-if="!game.stock.length"
            class="spider-empty-stock"
            >♠</span
          ><small>{{ game.stock.length / 10 }}</small>
        </button>
        <div class="spider-score">
          <span
            >{{ copy.score }}: <b>{{ game.score }}</b></span
          ><span
            >{{ copy.moves }}: <b>{{ game.moves }}</b></span
          >
        </div>
      </div>
    </div>
    <div v-if="hintMessage || !['ready', 'newDone', 'moveDone', 'dealDone'].includes(message) || storageFailed" class="spider-message" role="status">
      {{ status }}<span v-if="storageFailed"> {{ copy.saveUnavailable }}</span>
    </div>
    <footer class="spider-status">
      <span>{{ copy.runs }}: {{ game.completed.length }} / 8</span
      ><span
        >{{ copy.time }}: {{ clock }}<template v-if="paused && started"> · {{ copy.paused }}</template></span
      ><span>{{ game.suits === 1 ? '♠' : game.suits === 2 ? '♥ ♠' : '♦ ♣ ♥ ♠' }}</span>
    </footer>
    <Teleport to="body">
      <div
        v-if="dragging"
        class="spider-drag-preview"
        :class="{ 'spider-drag-compact': cardWidth < 42 }"
        aria-hidden="true"
        :style="{
          width: `${dragging.width}px`,
          height: `${(dragOffsets.at(-1) || 0) + cardHeight}px`,
          transform: `translate3d(${dragPoint.x}px, ${dragPoint.y}px, 0)`,
          '--card-h': `${cardHeight}px`
        }"
      >
        <PlayingCard v-for="(card, i) in draggedCards" :key="card.id" :card="card" :style="{ top: `${dragOffsets[i]}px` }" />
        <span v-if="draggedCards.length > 1" class="spider-drag-count">{{ draggedCards.length }}</span>
      </div>
    </Teleport>
    <div v-if="dragging" class="spider-drag-instruction" role="status">{{ validDrop ? copy.dropReady : copy.dragHelp }}</div>
    <div v-if="dialog" class="spider-dialog-shade" @keydown.stop>
      <section
        ref="dialogRoot"
        class="spider-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="
          copy[
            dialog === 'new'
              ? 'newTitle'
              : dialog === 'help'
                ? 'helpTitle'
                : dialog === 'options'
                  ? 'optionsTitle'
                  : dialog === 'about'
                    ? 'aboutTitle'
                    : dialog === 'restart'
                      ? 'restartTitle'
                      : 'wonTitle'
          ]
        "
        @keydown="keydown"
      >
        <h2>
          <img src="/game/spider/icon.png" alt="" />{{
            copy[
              dialog === 'new'
                ? 'newTitle'
                : dialog === 'help'
                  ? 'helpTitle'
                  : dialog === 'options'
                    ? 'optionsTitle'
                    : dialog === 'about'
                      ? 'aboutTitle'
                      : dialog === 'restart'
                        ? 'restartTitle'
                        : 'wonTitle'
            ]
          }}<button :aria-label="copy.cancel" @click="closeDialog">×</button>
        </h2>
        <div class="spider-dialog-content">
          <template v-if="dialog === 'new'"
            ><p>{{ copy.choose }}</p>
            <fieldset class="spider-difficulty">
              <legend>{{ copy.difficulty }}</legend>
              <label v-for="(level, index) in [1, 2, 4]" :key="level"
                ><input v-model="difficulty" type="radio" name="spider-difficulty" :value="level" /><span :class="{ 'spider-red': level > 1 }">{{
                  ['♠', '♥ ♠', '♦ ♣ ♥ ♠'][index]
                }}</span
                >{{ copy[['easy', 'medium', 'hard'][index]] }}</label
              >
            </fieldset>
            <p v-if="game.moves" class="spider-dialog-note">{{ copy.replace }}</p></template
          >
          <template v-else-if="dialog === 'help'"
            ><ol>
              <li v-for="rule in copy.rules" :key="rule">{{ rule }}</li>
            </ol></template
          >
          <div v-else-if="dialog === 'options'" class="spider-options">
            <label><input type="checkbox" :checked="sound" @change="toggleSound" />{{ copy.sound }}</label>
            <label><input v-model="largeCards" type="checkbox" />{{ copy.large }}</label>
          </div>
          <div v-else-if="dialog === 'about'" class="spider-about">
            <img src="/game/spider/about.png" alt="Spider" width="359" height="242" />
            <p>© 1998–2000 Microsoft Corporation.</p>
            <p>{{ copy.artSource }} · <a href="https://github.com/esc0rtd3w/xp-cards" target="_blank" rel="noopener noreferrer">esc0rtd3w/xp-cards</a></p>
          </div>
          <p v-else-if="dialog === 'restart'">{{ copy.restartText }}</p>
          <div v-else class="spider-win">
            <span aria-hidden="true">♠ ♥ ♣ ♦</span>
            <h3>{{ copy.wonText }}</h3>
            <p>{{ copy.score }}: {{ game.score }} · {{ copy.moves }}: {{ game.moves }} · {{ clock }}</p>
          </div>
        </div>
        <div class="spider-dialog-actions">
          <button v-if="dialog === 'new' || dialog === 'restart'" class="xp-button" @click="play(dialog === 'restart')">
            {{ dialog === 'new' ? copy.play : copy.restart }}</button><button v-if="dialog === 'won'" class="xp-button" @click="openDialog('new')">
            {{ copy.newGame }}</button
          ><button class="xp-button" @click="closeDialog">{{ ['new', 'restart'].includes(dialog) ? copy.cancel : copy.ok }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
