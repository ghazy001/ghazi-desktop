<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import profile from '@/data/profile-data.json'
import { useLocaleStore } from '@/stores/localeStore'
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
const form = ref(null)
const editor = ref(null)
const userEmail = ref('')
const subject = ref('')
const status = ref('')
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
  restoreSelection()
  document.execCommand(command, false, value)
  syncSelection()
}
const validate = () => {
  if (!form.value.reportValidity()) return false
  if (!text()) {
    status.value = french.value ? 'Veuillez écrire votre message.' : 'Please write your message.'
    editor.value.focus()
    return false
  }
  return true
}
const sendEmail = () => {
  if (!validate()) return
  const params = `subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(`From: ${userEmail.value}\n\n${text()}`)}`
  status.value = french.value ? 'Ouverture du brouillon dans votre messagerie.' : 'Opening a draft in your email application.'
  window.location.href = `mailto:${profile.email}?${params}`
}
const check = () => {
  if (validate()) status.value = french.value ? 'Adresses et message vérifiés.' : 'Addresses and message checked.'
}
const clear = () => {
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
  if (detail === 'send') form.value.requestSubmit()
  else if (detail === 'clear') clear()
  else if (detail === 'check') check()
  else if (['cut', 'copy', 'paste'].includes(detail)) clipboard(detail)
  else if (detail === 'focus') editor.value.focus()
  else if (detail === 'help')
    status.value = french.value ? 'Envoyer ouvre un brouillon texte dans votre application de messagerie.' : 'Send opens a plain-text draft in your email application.'
  else format(detail)
}
onMounted(() => {
  document.addEventListener('selectionchange', syncSelection)
  window.addEventListener('contact-command', handleCommand)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', syncSelection)
  window.removeEventListener('contact-command', handleCommand)
})
</script>
<template>
  <form ref="form" @submit.prevent="sendEmail" class="oe-compose">
    <div class="oe-toolbar" role="toolbar" :aria-label="french ? 'Outils du message' : 'Message tools'">
      <span class="oe-grip" aria-hidden="true"></span>
      <button type="submit" class="oe-tool oe-send">
        <img src="/img/icons/contact/send-icon.webp" alt="" /><span>{{ $t('windows.contact.send') }}</span>
      </button>
      <span class="oe-divider" aria-hidden="true"></span>
      <button
        v-for="action in ['cut', 'copy', 'paste']"
        :key="action"
        type="button"
        class="oe-tool"
        :disabled="action !== 'paste' && !hasSelection"
        @pointerdown.prevent
        @click="clipboard(action)"
      >
        <img :src="`/img/icons/contact/${action}-icon.webp`" alt="" /><span>{{ $t('windows.contact.' + action) }}</span>
      </button>
      <button type="button" class="oe-tool" :disabled="!canUndo" @pointerdown.prevent @click="format('undo')">
        <img src="/img/icons/contact/undo-icon.webp" alt="" /><span>{{ $t('windows.contact.undo') }}</span>
      </button>
      <span class="oe-divider" aria-hidden="true"></span>
      <button type="button" class="oe-tool" @click="check">
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
        ><input v-model="userEmail" type="email" required autocomplete="email" placeholder="you@example.com"
      /></label>
      <label class="oe-address-row"
        ><span>{{ $t('windows.contact.subject') }}</span
        ><input v-model="subject" required maxlength="200"
      /></label>
    </div>
    <div class="oe-formatbar" role="toolbar" :aria-label="french ? 'Mise en forme' : 'Text formatting'">
      <select v-model="font" aria-label="Font" class="oe-font" @change="format('fontName', font)">
        <option>Arial</option>
        <option>Tahoma</option>
        <option>Times New Roman</option>
        <option>Courier New</option>
      </select>
      <select v-model="size" aria-label="Font size" class="oe-font-size" @change="format('fontSize', size)">
        <option value="1">8</option>
        <option value="2">10</option>
        <option value="3">12</option>
        <option value="4">14</option>
        <option value="5">18</option>
        <option value="6">24</option>
        <option value="7">36</option>
      </select>
      <select v-model="alignment" aria-label="Text alignment" class="oe-align" @change="format(alignment)">
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
        :class="'oe-' + action"
        :aria-label="action"
        :aria-pressed="!!formatting[action]"
        @pointerdown.prevent
        @click="format(action)"
      >
        {{ label }}
      </button>
      <select v-model="color" aria-label="Text color" class="oe-color" :style="{ color }" @change="format('foreColor', color)">
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
        :aria-label="action === 'insertOrderedList' ? 'Numbered list' : 'Bulleted list'"
        :aria-pressed="!!formatting[action]"
        @pointerdown.prevent
        @click="format(action)"
      >
        <span>{{ label }}</span
        ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" stroke-width="2" /></svg>
      </button>
    </div>
    <div
      ref="editor"
      class="oe-message"
      role="textbox"
      aria-label="Message"
      aria-multiline="true"
      aria-required="true"
      contenteditable="true"
      spellcheck="true"
      @input="syncSelection"
      @paste="pastePlainText"
      @drop.prevent
    ></div>
    <footer class="oe-statusbar">
      <span role="status" aria-live="polite">{{ status }}</span
      ><span class="oe-resize-grip" aria-hidden="true"></span>
    </footer>
  </form>
</template>
<style src="./OutlookExpress/outlook-express.css"></style>
