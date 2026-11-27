<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useVolumeStore } from '@/stores/volumeStore'
import profile from '@/data/profile-data.json'
import data from '@/data/session-data.json'
import { POWER_CHOICES } from '@/lib/session-lifecycle.mjs'
import PowerIcon from './PowerIcon.vue'
import LoginBrand from '../Loading/LoginBrand.vue'
import Login from '../Loading/Login.vue'
import Step1Loading from '../Loading/Step1Loading.vue'
import Step2Loading from '../Loading/Step2Loading.vue'
import Step3Loading from '../Loading/Step3Loading.vue'
import './session.css'
const session = useConnectionStore(),
  locale = useLocaleStore(),
  volume = useVolumeStore()
const copy = computed(() => data[locale.currentLocale === 'fr' ? 'fr' : 'en'])
const choices = computed(() => POWER_CHOICES[session.powerDialog] || [])
const title = computed(() => (session.powerDialog === 'logoff' ? copy.value.logOffTitle.replace('{name}', profile.firstName) : copy.value.turnOffTitle))
const hovered = ref(null),
  modal = ref(null),
  screen = ref(null)
let timer, previousFocus
const hint = computed(() => (hovered.value ? copy.value[hovered.value + 'Hint'] : copy.value.choose))
function restoreFocus() {
  nextTick(() => (previousFocus?.isConnected ? previousFocus : document.querySelector('.start-button'))?.focus())
}
function cancel() {
  session.cancelPower()
  restoreFocus()
}
function pauseMedia() {
  document.querySelectorAll('audio,video').forEach((media) => media.pause())
  Object.values(volume.audioElements).forEach((audio) => audio.pause())
}
function perform(action) {
  if (!session.performPower(action)) return
  pauseMedia()
  if (['shutdown', 'restart', 'logoff'].includes(action)) {
    volume.resetAudio('/sounds/shutdown-windows.mp3')
    volume.playAudio('/sounds/shutdown-windows.mp3')
  }
}
watch(
  () => session.powerDialog,
  (open) => {
    hovered.value = null
    if (open) {
      previousFocus = document.activeElement
      nextTick(() => modal.value?.querySelector('[data-cancel]')?.focus())
    }
  }
)
watch(
  () => session.powerPhase,
  (phase, previous) => {
    clearTimeout(timer)
    const delay = data.timings[phase]
    if (delay) timer = setTimeout(() => session.advancePower(phase), delay)
    if (phase !== 'running') nextTick(() => screen.value?.querySelector('button,a')?.focus())
    if (['off', 'standby', 'login'].includes(phase)) pauseMedia()
    if (phase === 'running') {
      restoreFocus()
      if (previous === 'login') {
        volume.resetAudio('/sounds/start-windows.mp3')
        volume.playAudio('/sounds/start-windows.mp3')
      }
    }
  },
  { immediate: true }
)
function modalKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
    return
  }
  const buttons = [...modal.value.querySelectorAll('button')],
    index = buttons.indexOf(document.activeElement)
  if (event.key === 'Tab' && ((event.shiftKey && index <= 0) || (!event.shiftKey && index === buttons.length - 1))) {
    event.preventDefault()
    buttons[event.shiftKey ? buttons.length - 1 : 0]?.focus()
  }
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
    buttons[(index + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length]?.focus()
  }
}
function wakeKey(event) {
  if (session.powerPhase === 'standby' && !['Tab', 'Shift', 'Meta', 'Control', 'Alt'].includes(event.key)) {
    event.preventDefault()
    session.wake()
  }
}
onMounted(() => window.addEventListener('keydown', wakeKey))
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', wakeKey)
})
</script>
<template>
  <div v-if="session.powerDialog" class="xp-power-overlay" @keydown="modalKey">
    <section ref="modal" class="xp-power-dialog" role="dialog" aria-modal="true" :aria-label="title" aria-describedby="power-action-hint">
      <header>
        <h1>{{ title }}</h1>
        <img src="/img/windows-xp-flag.png" alt="" width="38" height="38" />
      </header>
      <div class="xp-power-options" :class="{ 'xp-power-two': choices.length === 2 }">
        <button
          v-for="choice in choices"
          :key="choice"
          @click="perform(choice)"
          @mouseenter="hovered = choice"
          @focus="hovered = choice"
          @mouseleave="hovered = null"
          :aria-describedby="hovered === choice ? 'power-action-hint' : undefined"
        >
          <PowerIcon :kind="choice" /><span>{{ copy[choice] }}</span>
        </button>
      </div>
      <div id="power-action-hint" class="xp-power-hint">{{ hint }}</div>
      <footer>
        <span>{{ copy.session }}</span
        ><button data-cancel class="xp-button" @click="cancel">{{ copy.cancel }}</button>
      </footer>
    </section>
  </div>
  <div v-else-if="session.powerPhase !== 'running'" ref="screen" class="xp-session-screen" :class="`xp-session-${session.powerPhase}`">
    <Login v-if="session.powerPhase === 'login'" />
    <Step1Loading v-else-if="session.powerPhase === 'bootBlank'" />
    <Step2Loading v-else-if="session.powerPhase === 'bootLoading'" />
    <Step3Loading v-else-if="session.powerPhase === 'bootWelcome'" />
    <section v-else-if="session.powerPhase === 'off'" class="xp-power-off" :aria-label="copy.offTitle">
      <LoginBrand />
      <div class="xp-safe-off">
        <h1>{{ copy.offTitle }}</h1>
        <p>{{ copy.offMessage }}</p>
      </div>
      <button class="xp-button xp-power-on" @click="session.powerOn"><PowerIcon kind="shutdown" />{{ copy.powerOn }}</button>
      <p class="xp-power-goodbye">{{ copy.goodbye }}</p>
    </section>
    <section v-else-if="session.powerPhase === 'standby'" class="xp-standby" :aria-label="copy.standbyTitle">
      <PowerIcon kind="standby" />
      <h1>{{ copy.standbyTitle }}</h1>
      <p>{{ copy.standbyMessage }}</p>
      <button class="xp-button" @click="session.wake">{{ copy.resume }}</button><small>{{ copy.wakeHint }}</small>
    </section>
    <section v-else class="xp-session-transition" role="status" aria-live="polite">
      <div class="xp-session-top"></div>
      <div class="xp-session-center">
        <LoginBrand />
        <h1>{{ copy[session.powerPhase] }}</h1>
        <span class="xp-session-wait"><i></i><i></i><i></i></span>
      </div>
      <footer>
        <span>{{ copy.pleaseWait }}</span
        ><span>{{ profile.name }}</span>
      </footer>
    </section>
  </div>
</template>
