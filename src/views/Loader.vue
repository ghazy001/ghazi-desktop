<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import { loadDesktop, loadComputer } from '@/lib/load-desktop'
import boot from '@/data/boot-data.json'
import MetaUpdater from '../MetaUpdater.vue'
import Step1Loading from '../components/Loading/Step1Loading.vue'
import Step2Loading from '../components/Loading/Step2Loading.vue'
import Step3Loading from '../components/Loading/Step3Loading.vue'
import Login from '../components/Loading/Login.vue'
const showStep1 = ref(false),
  showStep2 = ref(false),
  showStep3 = ref(false),
  showStep4 = ref(false)
const connectionStore = useConnectionStore()
let bootTimer,
  warmTimer,
  disposed = false
const later = (fn, delay) => {
  bootTimer = setTimeout(() => {
    if (!disposed) fn()
  }, delay)
}
function startLoading() {
  showStep1.value = true
  later(() => {
    showStep1.value = false
    showStep2.value = true
    later(() => {
      showStep2.value = false
      showStep3.value = true
      later(() => {
        showStep3.value = false
        showStep4.value = true
      }, boot.welcomeMs)
    }, boot.loadingMs)
  }, boot.blankMs)
}
onMounted(() => {
  if (connectionStore.status === 'restart') startLoading()
  else showStep4.value = true
  // Warm only the desktop shell and default folder while the logon screen is visible.
  // Other apps stay unloaded until opened. Respect data-saving connections.
  if (!navigator.connection?.saveData && !['slow-2g', '2g'].includes(navigator.connection?.effectiveType)) {
    warmTimer = setTimeout(() => {
      if (!disposed) Promise.all([loadDesktop(), loadComputer()]).catch(() => {})
    }, boot.warmMs)
  }
})
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(bootTimer)
  clearTimeout(warmTimer)
})
</script>

<template>
  <MetaUpdater />
  <div>
    <Step1Loading v-if="showStep1" />
    <Step2Loading v-if="showStep2" />
    <Step3Loading v-if="showStep3" />
    <Login v-if="showStep4" />
  </div>
</template>
