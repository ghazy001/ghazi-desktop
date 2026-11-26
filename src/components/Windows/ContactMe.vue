<script setup>
import { ref, computed, inject, nextTick, onMounted, onBeforeUnmount } from 'vue'
import profile from '@/data/profile-data.json'
import { useLocaleStore } from '@/stores/localeStore'
import { newSubmissionId, submitContact } from '@/lib/contact-mail.mjs'
const activeWindow = inject('activeWindow', ref(null))
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
const form = ref(null)
const editor = ref(null)
const userEmail = ref('')
const subject = ref('')
const status = ref('')
const sending = ref(false)
const website = ref('')
const result = ref(null)
const resultButton = ref(null)
let alive = true,
  controller,
  attempt
const errors = {
  en: {
    invalid_email: 'Please enter a valid email address.',
    invalid_subject: 'Please enter a subject of 200 characters or fewer.',
    invalid_message: 'Please write a message of 10,000 characters or fewer.',
    rate_limited: 'Too many messages were sent recently. Please wait a few minutes and try again.',
    not_configured: 'Sending is temporarily unavailable. Please try again later.',
    timeout: 'The connection timed out. Your draft is kept; you can retry safely.',
    provider_error: 'Your message could not be sent. Your draft is kept. Please try again.',
    too_large: 'This message is too long. Please shorten it and try again.'
  },
  fr: {
    invalid_email: 'Veuillez saisir une adresse e-mail valide.',
    invalid_subject: 'Veuillez saisir un objet de 200 caractères maximum.',
    invalid_message: 'Veuillez écrire un message de 10 000 caractères maximum.',
    rate_limited: 'Trop de messages ont été envoyés récemment. Patientez quelques minutes avant de réessayer.',
    not_configured: 'L’envoi est temporairement indisponible. Veuillez réessayer plus tard.',
    timeout: 'Le délai de connexion est dépassé. Votre brouillon est conservé ; vous pouvez réessayer.',
    provider_error: 'Votre message n’a pas pu être envoyé. Votre brouillon est conservé. Veuillez réessayer.',
    too_large: 'Ce message est trop long. Veuillez le raccourcir.'
  }
}
const showResult = (kind, message) => {
  result.value = { kind, message }
  nextTick(() => resultButton.value?.focus())
}
const hasSelection = ref(false)
const canUndo = ref(false)
const font = ref('Arial')
const size = ref('3')
const alignment = ref('justifyLeft')
const color = ref('#000000')
const formatting = ref({})
let selectionRange = null
const text = () => editor.value?.innerText.replace(/\u00a0/g, ' ').trim() || ''
const syncSelection = () => {
  const selection = window.getSelection()
  if (selection?.rangeCount && editor.value?.contains(selection.anchorNode) && editor.value?.contains(selection.focusNode)) {
    selectionRange = selection.getRangeAt(0).cloneRange()
    hasSelection.value = !selection.isCollapsed
    canUndo.value = document.queryCommandEnabled('undo')
    formatting.value = Object.fromEntries(
      ['bold', 'italic', 'underline', 'insertOrderedList', 'insertUnorderedList'].map((command) => [command, document.queryCommandState(command)])
    )
  }
}
const restoreSelection = () => {
  editor.value?.focus()
  if (selectionRange && editor.value?.contains(selectionRange.commonAncestorContainer)) {
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(selectionRange)
  }
}
const format = (command, value) => {
  if (sending.value) return
  restoreSelection()
  document.execCommand(command, false, value)
  syncSelection()
}
const validate = () => {
  if (!form.value.reportValidity()) return false
  if (!text() || text().length > 10000) {
    status.value = errors[french.value ? 'fr' : 'en'].invalid_message
    editor.value.focus()
    return false
  }
  return true
}
const sendEmail = async () => {
  if (sending.value || !validate()) return
  const draft = { email: userEmail.value.trim(), subject: subject.value.trim(), message: text(), website: website.value }
  const fingerprint = JSON.stringify(draft)
  if (attempt?.fingerprint !== fingerprint) attempt = { fingerprint, requestId: newSubmissionId() }
  sending.value = true
  status.value = french.value ? 'Envoi du message…' : 'Sending message…'
  controller = new AbortController()
  const timeout = setTimeout(() => controller?.abort(), 22000)
  try {
    await submitContact({ ...draft, requestId: attempt.requestId }, { signal: controller.signal })
    if (!alive) return
    subject.value = ''
    editor.value.replaceChildren()
    selectionRange = null
    hasSelection.value = false
    canUndo.value = false
    attempt = null
    status.value = french.value ? 'Votre message a été envoyé. Merci !' : 'Your message has been sent. Thank you!'
    showResult('success', status.value)
  } catch (error) {
    if (!alive) return
    const language = french.value ? 'fr' : 'en'
    const code = error.name === 'AbortError' ? 'timeout' : error.message
    status.value = errors[language][code] || errors[language].provider_error
    showResult('error', status.value)
  } finally {
    clearTimeout(timeout)
    if (alive) sending.value = false
  }
}
const check = () => {
  if (validate()) status.value = french.value ? 'Adresses et message vérifiés.' : 'Addresses and message checked.'
}
const clear = () => {
  if (sending.value) return
  attempt = null
  result.value = null
  userEmail.value = ''
  subject.value = ''
  editor.value.replaceChildren()
  selectionRange = null
  hasSelection.value = false
  canUndo.value = false
  status.value = ''
  editor.value.focus()
}
const clipboard = async (action) => {
  if (sending.value) return
  try {
    if (action === 'paste') {
      const value = await navigator.clipboard.readText()
      format('insertText', value)
    } else {
      restoreSelection()
      const value = window.getSelection()?.toString()
      if (!value) return
      await navigator.clipboard.writeText(value)
      if (action === 'cut') format('delete')
    }
    status.value = ''
  } catch {
    status.value = french.value ? 'Utilisez les raccourcis clavier pour le presse-papiers.' : 'Use your keyboard shortcut to access the clipboard.'
    restoreSelection()
  }
}
const pastePlainText = (event) => {
  event.preventDefault()
  format('insertText', event.clipboardData.getData('text/plain'))
}
const handleCommand = ({ detail }) => {
  if (sending.value || activeWindow.value !== 'contact' || result.value) return
  if (detail === 'send') form.value.requestSubmit()
  else if (detail === 'clear') clear()
  else if (detail === 'check') check()
  else if (['cut', 'copy', 'paste'].includes(detail)) clipboard(detail)
  else if (detail === 'focus') editor.value.focus()
  else if (detail === 'help')
    status.value = french.value
      ? 'Envoyer transmet votre message à Ghazi. Votre adresse sert à vous répondre.'
      : 'Send delivers your message to Ghazi. Your email address is used for replies.'
  else format(detail)
}
const keydown = (event) => {
  if (activeWindow.value !== 'contact') return
  if (result.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      result.value = null
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      resultButton.value?.focus()
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (!sending.value) form.value.requestSubmit()
  }
}
onMounted(() => {
  window.addEventListener('keydown', keydown)
  document.addEventListener('selectionchange', syncSelection)
  window.addEventListener('contact-command', handleCommand)
})
onBeforeUnmount(() => {
  alive = false
  controller?.abort()
  window.removeEventListener('keydown', keydown)
  document.removeEventListener('selectionchange', syncSelection)
  window.removeEventListener('contact-command', handleCommand)
})
</script>
<template>
  <form ref="form" @submit.prevent="sendEmail" class="oe-compose" :aria-busy="sending">
    <label class="oe-honeypot" aria-hidden="true">Website<input v-model="website" tabindex="-1" autocomplete="off" /></label>
    <div class="oe-toolbar" role="toolbar" :aria-label="french ? 'Outils du message' : 'Message tools'">
      <span class="oe-grip" aria-hidden="true"></span>
      <button type="submit" class="oe-tool oe-send" :disabled="sending">
        <img src="/img/icons/contact/send-icon.webp" alt="" /><span>{{ sending ? (french ? 'Envoi…' : 'Sending…') : $t('windows.contact.send') }}</span>
      </button>
      <span class="oe-divider" aria-hidden="true"></span>
      <button
        v-for="action in ['cut', 'copy', 'paste']"
        :key="action"
        type="button"
        class="oe-tool"
        :disabled="sending || (action !== 'paste' && !hasSelection)"
        @pointerdown.prevent
        @click="clipboard(action)"
      >
        <img :src="`/img/icons/contact/${action}-icon.webp`" alt="" /><span>{{ $t('windows.contact.' + action) }}</span>
      </button>
      <button type="button" class="oe-tool" :disabled="sending || !canUndo" @pointerdown.prevent @click="format('undo')">
        <img src="/img/icons/contact/undo-icon.webp" alt="" /><span>{{ $t('windows.contact.undo') }}</span>
      </button>
      <span class="oe-divider" aria-hidden="true"></span>
      <button type="button" class="oe-tool" :disabled="sending" @click="check">
        <img src="/img/icons/contact/check-icon.webp" alt="" /><span>{{ french ? 'Vérifier' : 'Check' }}</span>
      </button>
    </div>
    <div class="oe-addresses">
      <label class="oe-address-row"
        ><span><img src="/img/icons/contact/mailto-icon.webp" alt="" />{{ $t('windows.contact.to') }}</span
        ><input :value="profile.email" readonly autocomplete="off"
      /></label>
      <label class="oe-address-row"
        ><span>{{ $t('windows.contact.from') }}</span
        ><input v-model="userEmail" type="email" :disabled="sending" maxlength="254" required autocomplete="email" placeholder="you@example.com"
      /></label>
      <label class="oe-address-row"
        ><span>{{ $t('windows.contact.subject') }}</span
        ><input v-model="subject" :disabled="sending" required maxlength="200"
      /></label>
    </div>
    <div class="oe-formatbar" role="toolbar" :aria-label="french ? 'Mise en forme' : 'Text formatting'">
      <select v-model="font" :disabled="sending" aria-label="Font" class="oe-font" @change="format('fontName', font)">
        <option>Arial</option>
        <option>Tahoma</option>
        <option>Times New Roman</option>
        <option>Courier New</option>
      </select>
      <select v-model="size" :disabled="sending" aria-label="Font size" class="oe-font-size" @change="format('fontSize', size)">
        <option value="1">8</option>
        <option value="2">10</option>
        <option value="3">12</option>
        <option value="4">14</option>
        <option value="5">18</option>
        <option value="6">24</option>
        <option value="7">36</option>
      </select>
      <select v-model="alignment" :disabled="sending" aria-label="Text alignment" class="oe-align" @change="format(alignment)">
        <option value="justifyLeft">Left</option>
        <option value="justifyCenter">Center</option>
        <option value="justifyRight">Right</option>
      </select>
      <span class="oe-divider" aria-hidden="true"></span>
      <button
        v-for="(label, action) in { bold: 'B', italic: 'I', underline: 'U' }"
        :key="action"
        type="button"
        class="oe-format-button"
        :disabled="sending"
        :class="'oe-' + action"
        :aria-label="action"
        :aria-pressed="!!formatting[action]"
        @pointerdown.prevent
        @click="format(action)"
      >
        {{ label }}
      </button>
      <select v-model="color" :disabled="sending" aria-label="Text color" class="oe-color" :style="{ color }" @change="format('foreColor', color)">
        <option value="#000000">A</option>
        <option value="#000080">Blue</option>
        <option value="#800000">Red</option>
        <option value="#008000">Green</option>
      </select>
      <span class="oe-divider" aria-hidden="true"></span>
      <button
        v-for="(label, action) in { insertOrderedList: '1.', insertUnorderedList: '▪' }"
        :key="action"
        type="button"
        class="oe-list-button"
        :disabled="sending"
        :aria-label="action === 'insertOrderedList' ? 'Numbered list' : 'Bulleted list'"
        :aria-pressed="!!formatting[action]"
        @pointerdown.prevent
        @click="format(action)"
      >
        <span>{{ label }}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" stroke-width="2" /></svg>
      </button>
    </div>
    <div
      ref="editor"
      class="oe-message"
      role="textbox"
      aria-label="Message"
      aria-multiline="true"
      aria-required="true"
      :contenteditable="!sending"
      :aria-readonly="sending"
      spellcheck="true"
      @input="syncSelection"
      @paste="pastePlainText"
      @drop.prevent
    ></div>
    <footer class="oe-statusbar">
      <span role="status" aria-live="polite" :title="status">{{ status }}</span><span class="oe-resize-grip" aria-hidden="true"></span>
    </footer>
    <div v-if="result" class="oe-result-shade">
      <section
        class="oe-result-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="result.kind === 'success' ? (french ? 'Message envoyé' : 'Message sent') : french ? 'Erreur d’envoi' : 'Send error'"
      >
        <header>Outlook Express</header>
        <div>
          <img :src="result.kind === 'success' ? '/img/icons/contact/send-icon.webp' : '/img/icons/info-icon.webp'" alt="" />
          <p>{{ result.message }}</p>
        </div>
        <button ref="resultButton" type="button" class="xp-button" @click="result = null">OK</button>
      </section>
    </div>
  </form>
</template>
<style src="./OutlookExpress/outlook-express.css"></style>
