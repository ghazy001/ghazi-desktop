<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useVolumeStore } from '@/stores/volumeStore'
import data from '@/data/spider-data.json'
import menuData from '@/data/spider-menu-data.json'
import { RANKS, newGame, cloneGame, movable, canMove, move, deal, dealError, undo, hints, readSave } from '@/lib/spider-solitaire.mjs'
import PlayingCard from './PlayingCard.vue'
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
  dragFrom = ref(null),
  largeCards = ref(saved?.largeCards === true)
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
  dragFrom.value = null
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
  if (dialog.value || won.value) return
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
function chooseColumn(column) {
  if (selected.value) moveTo(selected.value.from, selected.value.index, column)
  else say('selectFirst')
}
function dealCards() {
  if (won.value || dialog.value) return
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
function startDrag(event, from, index) {
  if (dialog.value || !movable(game.value.columns[from], index) || won.value) {
    event.preventDefault()
    return
  }
  dragFrom.value = { from, index }
  selected.value = { from, index }
  hint.value = null
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', `${from}:${index}`)
}
function drop(column) {
  if (dragFrom.value) moveTo(dragFrom.value.from, dragFrom.value.index, column)
  dragFrom.value = null
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
      clearSelection()
      say('ready')
    }
  }
}
function visibility() {
  pageHidden.value = document.hidden
  if (document.hidden) stopSounds()
  save()
}
onMounted(() => {
  observer = new ResizeObserver(() => {
    tableWidth.value = table.value.clientWidth
    tableHeight.value = table.value.clientHeight
  })
  observer.observe(table.value)
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
  save()
  observer?.disconnect()
  clearInterval(timer)
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
  <div ref="root" class="xp-spider" :class="{ 'spider-large-cards': largeCards }">
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
            :class="{ 'spider-hint-target': hint?.to === c }"
            :style="{ height: `${layouts[c].height}px` }"
            :data-column="c"
            @dragover.prevent
            @drop.prevent="drop(c)"
            @click.self="chooseColumn(c)"
          >
            <button
              v-if="!column.length"
              class="spider-empty"
              :data-empty="c"
              :aria-label="`${copy.empty} ${c + 1}`"
              @click="chooseColumn(c)"
              @keydown="cardKey($event, c, -1)"
            >
              <span>{{ c + 1 }}</span>
            </button>
            <template v-for="(card, index) in column" :key="card.id">
              <button
                v-if="card.up"
                class="spider-card-button"
                :class="{ 'spider-selected': selected?.from === c && selected.index <= index, 'spider-hint-card': hint?.from === c && hint.index <= index }"
                :style="{ top: `${layouts[c].tops[index]}px` }"
                :data-card="card.id"
                :data-rank="card.rank"
                :data-suit="card.suit"
                :data-index="index"
                :aria-label="cardLabel(card, c)"
                :aria-pressed="selected?.from === c && selected.index <= index"
                :tabindex="index === column.length - 1 ? 0 : -1"
                :draggable="movable(column, index)"
                @click.stop="choose(c, index)"
                @keydown="cardKey($event, c, index)"
                @dragstart="startDrag($event, c, index)"
                @dragend="dragFrom = null"
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
