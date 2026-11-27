<script setup>
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'

const emit = defineEmits()

const props = defineProps({
  entities: {
    type: Array,
    required: true
  }
})

const localEntities = ref([])
const desktop = ref(null)
const desktopHeight = ref(Math.max(0, window.innerHeight - 32))
let desktopObserver
// Keep the original two-column ordering, then wrap overflow into more columns.
const rowCount = computed(() => Math.max(1, Math.floor((desktopHeight.value - 24 - 12 + 20) / 90)))
const columnCount = computed(() => Math.max(2, Math.ceil(desktopEntities.value.length / rowCount.value)))
function iconPosition(index) {
  const paired = rowCount.value * 2
  return index < paired
    ? { gridRow: Math.floor(index / 2) + 1, gridColumn: (index % 2) + 1 }
    : { gridRow: ((index - paired) % rowCount.value) + 1, gridColumn: Math.floor((index - paired) / rowCount.value) + 3 }
}
onMounted(() => {
  desktopObserver = new ResizeObserver(() => {
    desktopHeight.value = desktop.value.clientHeight
  })
  desktopObserver.observe(desktop.value)
})
onUnmounted(() => desktopObserver?.disconnect())

watchEffect(() => {
  localEntities.value = [...props.entities]
})

const desktopEntities = computed(() => {
  return localEntities.value.filter((entity) => entity.onDesktop)
})

const toggleEffect = (selectedEntity) => {
  localEntities.value.forEach((entity) => {
    entity.isActive = entity.id === selectedEntity.id
  })
}

const removeFilterAndToggle = (entity) => {
  localEntities.value.forEach((e) => {
    e.isActive = false
  })
  emit('open-window', entity.id) // Emit on double click or single tap.
}

// Detect if the user is on a mobile device
const isMobile = ref(false)

if (typeof window !== 'undefined') {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent)
}

// Locale management
const localeStore = useLocaleStore()

// Computed property to get the localized title
const getLocalizedTitle = (entity) => {
  return entity.title[localeStore.currentLocale] || entity.title['fr']
}

// If click occurs somewhere else, remove the active state
const clearDesktopSelection = (e) => {
  if (!e.target.closest('.desktop-icons')) {
    localEntities.value.forEach((entity) => {
      entity.isActive = false
    })
  }
}
window.addEventListener('click', clearDesktopSelection)
onUnmounted(() => window.removeEventListener('click', clearDesktopSelection))
</script>

<template>
  <section ref="desktop" class="desktop-shortcuts absolute top-0 left-0 overflow-x-auto" aria-label="Desktop" style="height: calc(100dvh - 2rem); max-width: 100vw">
    <div
      class="desktop-icons grid gap-5 pt-6 pl-6 pr-4 pb-3"
      :style="{ gridTemplateRows: `repeat(${rowCount}, 70px)`, gridTemplateColumns: `repeat(${columnCount}, max-content)` }"
    >
      <button
        v-for="(entity, index) in desktopEntities"
        :key="entity.id"
        :style="iconPosition(index)"
        class="flex flex-col gap-2 items-center w-full cursor-pointer"
        @click="isMobile ? removeFilterAndToggle(entity) : toggleEffect(entity)"
        @dblclick="!isMobile && removeFilterAndToggle(entity)"
        @keydown.enter.prevent="removeFilterAndToggle(entity)"
        @keydown.space.prevent="removeFilterAndToggle(entity)"
        :class="{ active: entity.isActive }"
      >
        <img
          class="w-11 h-11 object-contain shrink-0"
          :style="{
            ...entity.imageStyle,
            filter: entity.isActive ? 'opacity(0.5)' : 'opacity(1)'
          }"
          :src="entity.imgSrc"
          :alt="getLocalizedTitle(entity)"
        />
        <p
          class="text-white text-xs font-normal py-px px-1 whitespace-nowrap"
          :style="{
            ...entity.textStyle,
            backgroundColor: entity.isActive ? '#0B61FF' : 'transparent',
            textShadow: entity.isActive ? 'none' : '0px 1px 1px rgba(1, 1, 1, 1), 0px 0px 4px #000'
          }"
        >
          {{ getLocalizedTitle(entity) }}
        </p>
      </button>
    </div>
  </section>
</template>
