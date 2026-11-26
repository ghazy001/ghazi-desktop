<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import profile from '@/data/profile-data.json'
import giftData from '@/data/gift-data.json'
import { certificateFilename, createVisit, drawCertificate, formatVisitDate, validateName } from './certificate.mjs'
import GiftIcon from './GiftIcon.vue'
import './gift.css'
const openWindow = inject('openWindow')
const activeWindow = inject('activeWindow', ref(null))
const locale = useLocaleStore()
const language = computed(() => (locale.currentLocale === 'fr' ? 'fr' : 'en'))
const copy = computed(() => giftData[language.value])
const name = ref(''),
  error = ref(''),
  view = ref('welcome'),
  busy = ref(false),
  imageUrl = ref(''),
  visit = ref(null),
  zoom = ref('fit'),
  statusVisible = ref(true),
  help = ref(false),
  message = ref('')
const nameField = ref(null),
  preview = ref(null),
  download = ref(null),
  heading = ref(null),
  helpButton = ref(null)
const displayedDate = computed(() => (visit.value ? formatVisitDate(visit.value, language.value) : ''))
let alive = true,
  renderSequence = 0,
  fontReady,
  logoReady,
  pendingVisit
function loadLogo() {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = '/img/icons/gift/gift.png'
  })
}
function focusName() {
  nextTick(() => {
    if (activeWindow.value === 'gift') nameField.value?.focus()
  })
}
function welcome(clear = false) {
  if (busy.value) return
  view.value = 'welcome'
  if (clear) name.value = ''
  error.value = ''
  message.value = ''
  focusName()
}
function forward() {
  if (imageUrl.value && !busy.value) {
    view.value = 'certificate'
    nextTick(() => {
      if (activeWindow.value === 'gift') heading.value?.focus()
    })
  }
}
async function render(model, keepView = false) {
  const sequence = ++renderSequence
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const lang = language.value,
      text = giftData[lang]
    await fontReady
    const logo = await logoReady
    const canvas = document.createElement('canvas')
    drawCertificate(canvas, model, text.certificate, profile, lang, logo)
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('PNG encoding failed'))), 'image/png'))
    if (!alive || sequence !== renderSequence) return
    const previous = imageUrl.value
    imageUrl.value = URL.createObjectURL(blob)
    visit.value = model
    pendingVisit = null
    if (previous) URL.revokeObjectURL(previous)
    if (!keepView) view.value = 'certificate'
    zoom.value = 'fit'
    nextTick(() => {
      if (!keepView && activeWindow.value === 'gift') heading.value?.focus()
      if (preview.value) {
        preview.value.scrollTop = 0
        preview.value.scrollLeft = 0
      }
    })
  } catch {
    if (alive && sequence === renderSequence) {
      error.value = 'error'
      pendingVisit = null
    }
  } finally {
    if (alive && sequence === renderSequence) busy.value = false
  }
}
async function generate() {
  if (busy.value) return
  const checked = validateName(name.value)
  error.value = checked.error || ''
  if (checked.error) {
    focusName()
    return
  }
  name.value = checked.name
  pendingVisit = createVisit(checked.name)
  await render(pendingVisit)
}
function save() {
  if (imageUrl.value) {
    view.value = 'certificate'
    nextTick(() => download.value?.click())
  } else {
    welcome()
    message.value = copy.value.needCertificate
  }
}
function command(event) {
  if (activeWindow.value !== 'gift' || busy.value) return
  if (event.detail === 'new') welcome(true)
  if (event.detail === 'save') save()
  if (event.detail === 'back') welcome()
  if (event.detail === 'forward') forward()
  if (event.detail === 'fit') zoom.value = 'fit'
  if (event.detail === 'actual') zoom.value = 'actual'
  if (event.detail === 'status') statusVisible.value = !statusVisible.value
  if (event.detail === 'help') {
    help.value = true
    nextTick(() => helpButton.value?.focus())
  }
}
function keydown(event) {
  if (activeWindow.value !== 'gift') return
  if (help.value) {
    if (event.key === 'Escape') {
      help.value = false
      event.preventDefault()
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      helpButton.value?.focus()
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (!busy.value) save()
  }
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault()
    welcome()
  }
  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault()
    forward()
  }
}
watch(language, () => {
  error.value = ''
  message.value = ''
  if (pendingVisit) render(pendingVisit)
  else if (visit.value) render(visit.value, true)
})
onMounted(() => {
  fontReady = Promise.all([document.fonts.load('600 88px GiftSignature'), document.fonts.load('600 42px GiftSignature')]).catch(() => {})
  logoReady = loadLogo()
  window.addEventListener('gift-command', command)
  window.addEventListener('keydown', keydown)
  focusName()
})
onBeforeUnmount(() => {
  alive = false
  renderSequence++
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  window.removeEventListener('gift-command', command)
  window.removeEventListener('keydown', keydown)
})
</script>
<template>
  <div class="xp-gift" :aria-busy="busy">
    <nav class="gift-toolbar" aria-label="gift.exe toolbar">
      <button class="gift-tool" :disabled="view === 'welcome' || busy" @click="welcome()" :aria-label="copy.back">
        <GiftIcon name="back" /><span>{{ copy.back }}</span>
      </button>
      <button class="gift-tool" :disabled="view === 'certificate' || !imageUrl || busy" @click="forward" :aria-label="copy.forward">
        <GiftIcon name="forward" /><span>{{ copy.forward }}</span>
      </button>
      <span class="gift-toolbar-rule"></span>
      <button class="gift-tool" :aria-label="copy.projects" @click="openWindow('myProjects')">
        <img src="/img/icons/projects/projects-icon-sm.webp" alt="" /> <span>{{ copy.projects }}</span>
      </button>
      <button class="gift-tool" :aria-label="copy.cv" @click="openWindow('myCV')">
        <img src="/img/icons/cv/adobe-pdf.png" alt="" /> <span>{{ copy.cv }}</span>
      </button>
      <span class="gift-toolbar-rule"></span>
      <button class="gift-tool gift-up" :disabled="busy" :aria-label="copy.home" :title="copy.home" @click="welcome()"><GiftIcon name="up" /></button>
    </nav>
    <div class="gift-address">
      <span>{{ copy.address }}</span>
      <div>
        <img src="/img/icons/gift/gift.png" alt="" /><input
          readonly
          :value="view === 'welcome' ? 'gift.exe' : `gift.exe\\${certificateFilename(visit?.name || 'Visitor')}`"
          :aria-label="copy.address"
        />
      </div>
      <button :disabled="busy" @click="view === 'welcome' ? focusName() : forward()"><span class="gift-go" aria-hidden="true">➜</span>{{ copy.go }}</button>
    </div>
    <main class="gift-main">
      <section v-if="view === 'welcome'" class="gift-welcome" :aria-label="copy.welcome">
        <aside class="gift-wizard-banner">
          <div class="gift-banner-art"><img src="/img/icons/gift/gift.png" alt="" width="63" height="63" /><span>✦</span><span>✧</span></div>
          <p class="gift-banner-kicker">GHAZI XP</p>
          <h2>{{ copy.sidebarTitle }}</h2>
          <p>{{ copy.sidebarText }}</p>
          <ol class="gift-steps">
            <li class="current"><b>1</b>{{ copy.step1 }}</li>
            <li><b>2</b>{{ copy.step2 }}</li>
          </ol>
          <div class="gift-banner-footer">gift.exe <span>✦</span></div>
        </aside>
        <div class="gift-welcome-body">
          <p class="gift-kicker">{{ copy.special }}</p>
          <h1>{{ copy.welcome }}</h1>
          <p class="gift-intro">{{ copy.intro }}</p>
          <form @submit.prevent="generate" novalidate>
            <fieldset class="gift-name-panel">
              <legend>{{ copy.legend }}</legend>
              <label for="gift-name">{{ copy.name }}</label><input
                ref="nameField"
                id="gift-name"
                v-model="name"
                type="text"
                autocomplete="off"
                :placeholder="copy.placeholder"
                :aria-invalid="!!error"
                aria-describedby="gift-name-hint gift-error"
                :disabled="busy"
                @input="error = ''"
              />
              <p id="gift-name-hint" class="gift-hint">{{ copy.hint }}</p>
              <p id="gift-error" class="gift-error" role="alert">{{ error ? copy[error] : message }}</p>
              <button type="submit" class="xp-button gift-primary" :disabled="busy"><GiftIcon name="certificate" />{{ busy ? copy.generating : copy.generate }}</button>
            </fieldset>
          </form>
          <div class="gift-included">
            <GiftIcon name="certificate" />
            <div>
              <h2>{{ copy.included }}</h2>
              <ul>
                <li v-for="item in copy.features" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
          <div v-if="busy" class="gift-progress" role="progressbar" :aria-label="copy.generating"><span></span></div>
          <p class="gift-welcome-signature">
            {{ profile.name }} <span>{{ copy.certificate.signature }}</span>
          </p>
        </div>
      </section>
      <section v-else class="gift-result" :aria-label="copy.ready">
        <header class="gift-result-heading">
          <GiftIcon name="check" />
          <div>
            <h1 ref="heading" tabindex="-1">{{ copy.ready }}</h1>
            <p>{{ copy.readyText }}</p>
          </div>
        </header>
        <div class="gift-result-layout">
          <div class="gift-preview-frame">
            <div class="gift-preview-title">
              <GiftIcon name="certificate" /><span>{{ copy.preview }}</span
              ><select v-model="zoom" :aria-label="copy.zoom">
                <option value="fit">{{ copy.fit }}</option>
                <option value="actual">100%</option>
              </select>
            </div>
            <div ref="preview" class="gift-preview" :class="{ 'gift-actual': zoom === 'actual' }">
              <img :src="imageUrl" :alt="`${copy.certificate.title} — ${visit.name}. ${displayedDate}. ${profile.name}.`" width="2000" height="2240" />
            </div>
          </div>
          <aside class="gift-receipt">
            <img src="/img/icons/gift/gift.png" alt="" width="48" height="48" />
            <h2>{{ copy.step2 }}</h2>
            <dl>
              <dt>{{ copy.recipient }}</dt>
              <dd>{{ visit.name }}</dd>
              <dt>{{ copy.issued }}</dt>
              <dd>{{ displayedDate }}</dd>
              <dt>{{ copy.reference }}</dt>
              <dd class="gift-reference">{{ visit.code }}</dd>
            </dl>
            <a
              ref="download"
              class="xp-button gift-save"
              :href="imageUrl"
              :download="certificateFilename(visit.name)"
              :aria-disabled="busy"
              @click="busy && $event.preventDefault()"
              ><GiftIcon name="save" />{{ copy.save }}</a
            >
            <p class="gift-file-format">{{ copy.format }}</p>
            <button class="gift-another" :disabled="busy" @click="welcome(true)">{{ copy.another }}</button>
            <p v-if="error" class="gift-error" role="alert">{{ copy[error] }}</p>
          </aside>
        </div>
        <article class="sr-only">
          <h2>{{ copy.certificate.title }}</h2>
          <p>{{ copy.certificate.presented }} {{ visit.name }}</p>
          <p>{{ copy.certificate.body }}</p>
          <p>{{ displayedDate }} — {{ profile.name }} — {{ visit.code }}</p>
        </article>
      </section>
    </main>
    <footer v-show="statusVisible" class="gift-status" role="status">
      <span>{{ busy ? copy.generating : view === 'welcome' ? copy.statusReady : copy.statusCertificate }}</span><span>{{ copy.local }}</span>
    </footer>
    <div v-if="help" class="gift-dialog-shade">
      <section class="gift-dialog" role="dialog" aria-modal="true" :aria-label="copy.helpTitle">
        <header>{{ copy.helpTitle }}</header>
        <div>
          <img src="/img/icons/gift/gift.png" alt="" width="40" height="40" />
          <p>{{ copy.help }}</p>
          <button ref="helpButton" class="xp-button" @click="help = false">{{ copy.ok }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
