<template>
  <section
    ref="windowRoot"
    @lostpointercapture="endInteraction"
    class="absolute rounded-t-lg overflow-hidden select-none"
    :class="[
      isActive ? 'bg-window-blue-active' : 'bg-window-blue-deactivated',
      { 'wmp-window': skin === 'media-player', 'ie-window': skin === 'internet-explorer', 'xp-window-interacting': interacting }
    ]"
    :style="windowStyle"
    :id="id"
    role="dialog"
    :aria-label="displayTitle"
  >
    <div
      class="absolute top-0 left-0 h-7 w-full z-40 flex justify-between items-center px-1"
      :class="isActive ? 'bg-header-window-active' : 'bg-header-window-deactivated'"
      @pointerdown="startDrag"
      @dblclick="resizable && toggleMaximize()"
      style="touch-action: none"
    >
      <div class="h-5/6 text-white font-semibold flex items-center gap-1 select-none flex-1 overflow-hidden pr-1">
        <img :src="iconSrc" :alt="$t('common.tiny') + ' ' + $t('common.icon') + ' ' + translatedTitle" class="w-4 h-4" />
        <div class="flex items-center overflow-hidden">
          <h4 class="text-header-window text-header-shadow truncate">{{ displayTitle }}</h4>
        </div>
      </div>
      <div class="h-5/6 mt-px flex items-center gap-px" :class="isActive ? 'opacity-100' : 'opacity-60 '">
        <WindowMinimize aria-label="Minimize" @pointerdown.stop @dblclick.stop @click="toggleMinimize" />
        <WindowMaximize
          aria-label="Maximize or restore"
          @pointerdown.stop
          @dblclick.stop
          @click="toggleMaximize"
          :disabled="!resizable"
          :class="{ 'opacity-60 cursor-default': !resizable, 'cursor-pointer': resizable }"
        />
        <WindowClose aria-label="Close" @pointerdown.stop @dblclick.stop @click="closeWindow" />
      </div>
    </div>
    <div class="absolute w-full h-full overflow-hidden p-0.75">
      <WindowHeaderDropdown
        :id="id"
        :dropdownItems="translatedMenuHeaderItems"
        :windowsHeaderLogo="windowsHeaderLogo"
        @close="closeWindow"
        @minimize="toggleMinimize"
        @maximize="toggleMaximize"
      />
      <div v-if="headerToolsId">
        <WindowHeaderTools :id="id" :headerToolsId="headerToolsId" />
        <WindowHeaderSearch :id="id" :title="translatedTitle" :iconSrc="iconSrc" :isSearchVisible="isSearchVisible" />
      </div>
      <!-- Component containing content for the window goes here it is done in Office.vue component -->
      <slot></slot>
    </div>
    <div v-if="resizable">
      <!-- Resize handlers -->
      <div
        class="absolute bg-transparent top-0 right-0 w-2 h-full cursor-ew-resize"
        @pointerdown="startResize"
        style="touch-action: none"
        data-direction="right"
        :style="{ cursor: maximized ? 'default' : 'ew-resize' }"
      ></div>
      <div
        class="absolute bg-transparent bottom-0 left-0 h-2 w-full cursor-ns-resize"
        @pointerdown="startResize"
        style="touch-action: none"
        data-direction="bottom"
        :style="{ cursor: maximized ? 'default' : 'ns-resize' }"
      ></div>
      <div
        class="absolute bg-transparent bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize"
        @pointerdown="startResize"
        style="touch-action: none"
        data-direction="corner"
        :style="{ cursor: maximized ? 'default' : 'nwse-resize' }"
      ></div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onUnmounted, provide } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import WindowMinimize from '../components/Buttons/WindowMinimize.vue'
import WindowMaximize from '../components/Buttons/WindowMaximize.vue'
import WindowClose from '../components/Buttons/WindowClose.vue'
import WindowHeaderTools from '../components/Windows/WindowHeaderTools.vue'
import WindowHeaderSearch from '../components/Windows/WindowHeaderSearch.vue'
import WindowHeaderDropdown from '../components/Windows/WindowHeaderDropdown.vue'
import menuHeaderData from '@/data/header-menu-data.json'
import { createFrameScheduler } from '@/lib/frame-scheduler.mjs'
import { dragWindowPosition, resizeWindowSize } from '@/lib/window-geometry.mjs'

const emit = defineEmits()

const {
  id,
  title,
  iconSrc,
  initPositionX,
  initPositionY,
  initWidth,
  initHeight,
  minWidth,
  minHeight,
  headerToolsId,
  menuHeaderItemsId,
  resizable,
  windowsHeaderLogo,
  isSearchVisible,
  skin,
  caption
} = defineProps({
  id: String,
  title: Object,
  iconSrc: String,
  initPositionX: Number,
  initPositionY: Number,
  initWidth: Number,
  initHeight: Number,
  minWidth: Number,
  minHeight: Number,
  headerToolsId: String,
  menuHeaderItemsId: String,
  resizable: Boolean,
  windowsHeaderLogo: Boolean,
  isSearchVisible: Boolean,
  skin: String,
  caption: String
})

// Locale management
const localeStore = useLocaleStore()

const translatedTitle = ref(title[localeStore.currentLocale] || title['fr'])
const browserPageTitle = inject('browserPageTitle', ref('Internet Explorer'))
const displayTitle = computed(() => (skin === 'internet-explorer' ? `${browserPageTitle.value} - Microsoft Internet Explorer` : caption || translatedTitle.value))
const translatedMenuHeaderItems = ref(
  menuHeaderData.menuHeaderItems[menuHeaderItemsId][localeStore.currentLocale] || menuHeaderData.menuHeaderItems[menuHeaderItemsId]['fr']
)

watch(
  () => localeStore.currentLocale,
  (newLocale) => {
    translatedTitle.value = title[newLocale] || title['fr']
    const items = menuHeaderData.menuHeaderItems[menuHeaderItemsId]
    translatedMenuHeaderItems.value = items ? items[newLocale] || items['fr'] : []
  }
)

const viewport = ref({ width: window.innerWidth, height: window.innerHeight - 32 })
const windowRoot = ref(null)
const windowPosition = ref({
  x: Math.max(0, Math.min(initPositionX, viewport.value.width - initWidth)),
  y: Math.max(0, Math.min(initPositionY, viewport.value.height - initHeight))
})
// Keep desktop preferences intact when a narrow viewport temporarily fills the screen.
const windowWidth = ref(initWidth),
  windowHeight = ref(initHeight),
  maximized = ref(false),
  interacting = ref(false)
const activeWindow = inject('activeWindow')
const activateWindow = inject('activateWindow', null)
const isActive = computed(() => id === activeWindow.value)
const windowStyle = computed(() =>
  maximized.value || viewport.value.width <= 768
    ? { width: '100vw', height: 'calc(100dvh - 2rem)', top: '0', left: '0' }
    : {
        width: `${Math.min(windowWidth.value, viewport.value.width)}px`,
        height: `${Math.min(windowHeight.value, viewport.value.height)}px`,
        transform: `translate3d(${windowPosition.value.x}px, ${windowPosition.value.y}px, 0)`
      }
)
let gesture = null
const frames = createFrameScheduler((point) => {
  if (!gesture) return
  if (gesture.direction === 'move') {
    windowPosition.value = dragWindowPosition(gesture.start, point, gesture.origin, gesture.size, viewport.value)
  } else {
    const size = resizeWindowSize(
      gesture.size,
      { x: point.x - gesture.start.x, y: point.y - gesture.start.y },
      gesture.direction,
      { width: minWidth, height: minHeight },
      viewport.value,
      gesture.origin
    )
    windowWidth.value = size.width
    windowHeight.value = size.height
  }
})
function pointerMove(event) {
  if (gesture?.pointerId !== event.pointerId) return
  frames.push({ x: event.clientX, y: event.clientY })
}
function endInteraction(event) {
  if (!gesture || (event?.pointerId !== undefined && event.pointerId !== gesture.pointerId)) return
  if (event?.type === 'pointerup') frames.push({ x: event.clientX, y: event.clientY })
  frames.flush()
  const old = gesture
  gesture = null
  interacting.value = false
  document.body.style.userSelect = old.selection
  document.body.style.cursor = old.cursor
  document.body.classList.remove('xp-window-gesture')
  document.removeEventListener('pointermove', pointerMove)
  document.removeEventListener('pointerup', endInteraction)
  document.removeEventListener('pointercancel', endInteraction)
  window.removeEventListener('blur', endInteraction)
  try {
    if (windowRoot.value?.hasPointerCapture(old.pointerId)) windowRoot.value.releasePointerCapture(old.pointerId)
  } catch {
    /* The window may have closed. */
  }
}
function beginInteraction(event, direction) {
  if (maximized.value || viewport.value.width <= 768 || event.button !== 0 || event.isPrimary === false) return
  endInteraction()
  event.preventDefault()
  if (activateWindow) activateWindow(id)
  else activeWindow.value = id
  gesture = {
    pointerId: event.pointerId,
    direction,
    start: { x: event.clientX, y: event.clientY },
    origin: { ...windowPosition.value },
    size: { width: Math.min(windowWidth.value, viewport.value.width), height: Math.min(windowHeight.value, viewport.value.height) },
    selection: document.body.style.userSelect,
    cursor: document.body.style.cursor
  }
  interacting.value = true
  document.body.style.userSelect = 'none'
  document.body.style.cursor = direction === 'move' ? 'grabbing' : direction === 'right' ? 'ew-resize' : direction === 'bottom' ? 'ns-resize' : 'nwse-resize'
  document.body.classList.add('xp-window-gesture')
  try {
    windowRoot.value.setPointerCapture(event.pointerId)
  } catch {
    /* Document listeners still provide mouse support. */
  }
  document.addEventListener('pointermove', pointerMove)
  document.addEventListener('pointerup', endInteraction)
  document.addEventListener('pointercancel', endInteraction)
  window.addEventListener('blur', endInteraction)
}
const startDrag = (event) => beginInteraction(event, 'move')
const startResize = (event) => beginInteraction(event, event.currentTarget.dataset.direction)
const toggleMaximize = () => {
  if (resizable) {
    endInteraction()
    maximized.value = !maximized.value
  }
}
provide('toggleWindowMaximize', toggleMaximize)
const closeWindow = () => {
  endInteraction()
  emit('close-window')
}
const toggleMinimize = () => {
  endInteraction()
  emit('toggle-minimize')
}
function updateViewport() {
  endInteraction()
  viewport.value = { width: window.innerWidth, height: window.innerHeight - 32 }
  if (viewport.value.width > 768)
    windowPosition.value = dragWindowPosition(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      windowPosition.value,
      { width: windowWidth.value, height: windowHeight.value },
      viewport.value
    )
}
onMounted(() => window.addEventListener('resize', updateViewport))
onUnmounted(() => {
  endInteraction()
  frames.cancel()
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.xp-window-interacting {
  will-change: transform;
}
.text-header-shadow {
  text-shadow: 1px 1px 0px #09177f;
}

.ie-window {
  border-radius: 2px;
}

.wmp-window {
  border-radius: 2px;
  box-shadow: 1px 2px 5px #0006;
}
</style>
