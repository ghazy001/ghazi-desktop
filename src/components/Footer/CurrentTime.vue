<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useConnectionStore } from '@/stores/connectionStore'
const locale = useLocaleStore(),
  session = useConnectionStore(),
  formattedTime = ref('')
let timer
function updateTime() {
  const now = new Date(),
    hours = now.getHours(),
    minutes = String(now.getMinutes()).padStart(2, '0')
  formattedTime.value = locale.currentLocale === 'fr' ? `${String(hours).padStart(2, '0')}:${minutes}` : `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`
}
function schedule() {
  clearTimeout(timer)
  if (document.hidden || session.powerPhase !== 'running') return
  updateTime()
  timer = setTimeout(schedule, 60000 - (Date.now() % 60000) + 20)
}
onMounted(() => {
  schedule()
  document.addEventListener('visibilitychange', schedule)
})
watch(() => locale.currentLocale, updateTime)
watch(() => session.powerPhase, schedule)
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', schedule)
})
</script>
<template>
  <div class="flex flex-row">
    <h4 class="mx-px text-xxs md:text-xs cursor-default">{{ formattedTime }}</h4>
  </div>
</template>
