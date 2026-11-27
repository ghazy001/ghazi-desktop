<script setup>
import { nextTick, onMounted, ref } from 'vue'
const props = defineProps({ currentLocale: { type: String, default: 'en' } })
const emit = defineEmits(['select', 'close'])
const languages = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' }
]
const menu = ref(null)
function focus(index) {
  menu.value?.querySelectorAll('[role="menuitemradio"]')[index]?.focus()
}
function keydown(event) {
  const buttons = [...menu.value.querySelectorAll('[role="menuitemradio"]')]
  const index = buttons.indexOf(document.activeElement)
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    focus(event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length)
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
  }
}
onMounted(() => nextTick(() => focus(languages.findIndex((language) => language.id === props.currentLocale))))
</script>
<template>
  <section id="taskbar-languages" ref="menu" class="xp-language-menu" role="menu" :aria-label="$t('common.language')" @keydown="keydown">
    <div class="xp-language-menu-title" aria-hidden="true">{{ $t('common.language') }}</div>
    <button
      v-for="language in languages"
      :key="language.id"
      role="menuitemradio"
      :aria-checked="language.id === currentLocale"
      :lang="language.id"
      tabindex="-1"
      @click="emit('select', language.id)"
    >
      <span class="xp-language-check" aria-hidden="true">{{ language.id === currentLocale ? '✓' : '' }}</span>
      <img :src="`/img/icons/langs/flag-${language.id}.webp`" alt="" width="23" height="17" />
      <span>{{ language.name }}</span><small aria-hidden="true">{{ language.id.toUpperCase() }}</small>
    </button>
  </section>
</template>
<style scoped>
.xp-language-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  width: 208px;
  max-width: calc(100vw - 12px);
  padding: 2px;
  color: #111;
  background: #ece9d8;
  border: 1px solid #0054e3;
  box-shadow:
    inset 1px 1px #fff,
    2px 3px 3px #0005;
  z-index: 100;
  font:
    13px Tahoma,
    Arial,
    sans-serif;
}
.xp-language-menu-title {
  background: linear-gradient(#3893ff, #0564df 45%, #0053d8);
  color: white;
  padding: 5px 9px;
  font-weight: bold;
  text-shadow: 1px 1px #174281;
  margin-bottom: 3px;
}
.xp-language-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 6px 8px;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
}
.xp-language-menu button:hover,
.xp-language-menu button:focus-visible {
  background: #316ac5;
  color: white;
  outline: none;
  border-color: #2457a1;
}
.xp-language-check {
  width: 14px;
  flex-shrink: 0;
  font-weight: bold;
}
.xp-language-menu img {
  width: 23px;
  height: 17px;
  object-fit: contain;
}
.xp-language-menu small {
  margin-left: auto;
  font-size: 11px;
}
</style>
