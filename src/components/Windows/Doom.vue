<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useVolumeStore } from '@/stores/volumeStore'
import { useLocaleStore } from '@/stores/localeStore'
const props = defineProps({ active: { type: Boolean, default: true } })
const frame = ref(null)
const volume = useVolumeStore()
const locale = useLocaleStore()
const activateWindow = inject('activateWindow', () => {})
const maximize = inject('toggleWindowMaximize', () => {})
const initialLanguage = locale.currentLocale
const source = `/game/doom.html?lang=${initialLanguage}`
const title = computed(() => (locale.currentLocale === 'fr' ? 'Doom — Jeu DOS' : 'Doom — DOS game'))
const synchronize = () =>
  frame.value?.contentWindow?.postMessage({ type: 'doom-host', active: props.active, volume: volume.volume, locale: locale.currentLocale }, window.location.origin)
const handleMessage = (event) => {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow) return
  if (event.data?.type === 'doom-focus') activateWindow('doom')
  if (event.data?.type === 'doom-maximize') maximize()
}
watch(() => [props.active, volume.volume, locale.currentLocale], synchronize)
onMounted(() => window.addEventListener('message', handleMessage))
onBeforeUnmount(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <div class="doom-window-content">
    <iframe
      ref="frame"
      :src="source"
      :title="title"
      @load="synchronize"
      sandbox="allow-scripts allow-same-origin allow-pointer-lock"
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>
  </div>
</template>
<style scoped>
.doom-window-content {
  margin-top: 24px;
  width: 100%;
  height: calc(100% - 24px);
  min-height: 0;
  background: black;
}
iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
