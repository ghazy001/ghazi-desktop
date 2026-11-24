<template>
  <section
    class="absolute rounded-t-lg overflow-hidden select-none"
    :class="[isActive ? 'bg-window-blue-active' : 'bg-window-blue-deactivated', { 'wmp-window': skin === 'media-player', 'ie-window': skin === 'internet-explorer' }]"
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

// App size constants
const viewport = ref({ width: window.innerWidth, height: window.innerHeight - 32 })
const updateViewport = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight - 32 }
  windowWidth.value = Math.min(windowWidth.value, viewport.value.width)
  windowHeight.value = Math.min(windowHeight.value, viewport.value.height)
  windowPosition.value.x = Math.max(0, Math.min(windowPosition.value.x, viewport.value.width - windowWidth.value))
  windowPosition.value.y = Math.max(0, Math.min(windowPosition.value.y, viewport.value.height - windowHeight.value))
  windowTransform.value = `translate(${windowPosition.value.x}px, ${windowPosition.value.y}px)`
}
onMounted(() => window.addEventListener('resize', updateViewport))
onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
  stopDrag()
  stopResize()
})

// Dragging window constants
const isDragging = ref(false)
const initialMouseX = ref(0)
const initialMouseY = ref(0)
const throttleDelay = 16 // Update every 16ms (60 FPS)
let lastUpdateTimestamp = 0

// Window resizing constants
const maximized = ref(false)

// Window position and size
const windowSize = { width: initWidth, height: initHeight }
const windowPosition = ref({
  x: Math.max(0, Math.min(initPositionX, viewport.value.width - initWidth)),
  y: Math.max(0, Math.min(initPositionY, viewport.value.height - initHeight))
})
const windowWidth = ref(Math.min(windowSize.width, viewport.value.width))
const windowHeight = ref(Math.min(windowSize.height, viewport.value.height))
const windowTransform = ref(`translate(${windowPosition.value.x}px, ${windowPosition.value.y}px)`)

// Window activeness
const activeWindow = inject('activeWindow')
const isActive = computed(() => id === activeWindow.value)

// Window Z-index
const highestZIndex = inject('highestZIndex')

/**
 * Window style added to window component.
 * If maximized or mobile, window will take up the whole screen else it will take the size of the window json
 */
const windowStyle = computed(() => {
  const isMobile = viewport.value.width <= 768 // Mobile breakpoint pixel value
  const sizeStyle =
    maximized.value || isMobile
      ? {
          width: '100vw',
          height: 'calc(100dvh - 2rem)',
          top: '0',
          left: '0'
        }
      : {
          width: `${windowWidth.value}px`,
          height: `${windowHeight.value}px`,
          transform: windowTransform.value
        }
  return {
    ...sizeStyle
  }
})

const toggleMaximize = () => {
  if (resizable) maximized.value = !maximized.value
}

provide('toggleWindowMaximize', toggleMaximize)

const closeWindow = () => {
  emit('close-window')
}

const toggleMinimize = () => {
  emit('toggle-minimize')
}

const startDrag = (event) => {
  if (maximized.value || viewport.value.width <= 768 || event.button !== 0) return
  event.preventDefault()
  isDragging.value = true
  initialMouseX.value = event.clientX
  initialMouseY.value = event.clientY

  // Set the active window to the current window
  activeWindow.value = id

  // Increment the highestZIndex and set the zIndex of the current window to it

  // Add mouseup event listener to the whole document to stop dragging
  document.addEventListener('pointerup', stopDrag)
  // Add mousemove event listener to the whole document for smoother dragging
  document.addEventListener('pointermove', dragWindow)
}

const stopDrag = () => {
  isDragging.value = false

  // Remove mouseup and mousemove event listeners when dragging stops
  document.removeEventListener('pointerup', stopDrag)
  document.removeEventListener('pointermove', dragWindow)
}

const dragWindow = (event) => {
  if (isDragging.value && !resizing.value) {
    const currentTime = performance.now()
    if (currentTime - lastUpdateTimestamp > throttleDelay) {
      const deltaX = event.clientX - initialMouseX.value
      const deltaY = event.clientY - initialMouseY.value

      // Calculate the new window position
      const newX = windowPosition.value.x + deltaX
      const newY = windowPosition.value.y + deltaY

      // Define the boundaries
      const minX = 0 // Minimum X position
      const minY = 0 // Minimum Y position
      const maxX = viewport.value.width - Math.min(windowWidth.value, 160) // Maximum X position
      const maxY = viewport.value.height - 28 // Maximum Y position

      // Ensure the window stays within the boundaries
      windowPosition.value.x = Math.min(Math.max(newX, minX), maxX)
      windowPosition.value.y = Math.min(Math.max(newY, minY), maxY)

      // Update the transform property
      windowTransform.value = `translate(${windowPosition.value.x}px, ${windowPosition.value.y}px)`

      initialMouseX.value = event.clientX
      initialMouseY.value = event.clientY
      lastUpdateTimestamp = currentTime
    }
  }
}

const resizing = ref(false)
const initialWindowSize = ref({ width: 0, height: 0 })
const resizeDirection = ref('')

const startResize = (event) => {
  if (maximized.value || viewport.value.width <= 768) return
  event.preventDefault()
  resizing.value = true
  initialMouseX.value = event.clientX
  initialMouseY.value = event.clientY
  resizeDirection.value = event.target.dataset.direction

  // Set the initial window size based on the current size
  initialWindowSize.value = { width: windowWidth.value, height: windowHeight.value }

  document.addEventListener('pointerup', stopResize)
  document.addEventListener('pointermove', resizeWindow)
}

const stopResize = () => {
  resizing.value = false

  document.removeEventListener('pointerup', stopResize)
  document.removeEventListener('pointermove', resizeWindow)

  // Enable user selection
  document.body.style.userSelect = ''
}

const resizeWindow = (event) => {
  if (resizing.value) {
    const deltaX = event.clientX - initialMouseX.value
    const deltaY = event.clientY - initialMouseY.value

    if (resizeDirection.value === 'right') {
      let newWidth = initialWindowSize.value.width + deltaX
      newWidth = Math.min(newWidth, viewport.value.width)
      windowWidth.value = newWidth < minWidth ? minWidth : newWidth
    } else if (resizeDirection.value === 'bottom') {
      let newHeight = initialWindowSize.value.height + deltaY
      newHeight = Math.min(newHeight, viewport.value.height)
      windowHeight.value = newHeight < minHeight ? minHeight : newHeight
    } else if (resizeDirection.value === 'corner') {
      let newWidth = initialWindowSize.value.width + deltaX
      let newHeight = initialWindowSize.value.height + deltaY
      newWidth = Math.min(newWidth, viewport.value.width)
      newHeight = Math.min(newHeight, viewport.value.height)
      windowWidth.value = newWidth < minWidth ? minWidth : newWidth
      windowHeight.value = newHeight < minHeight ? minHeight : newHeight
    }

    // Update the transform property
    windowTransform.value = `translate(${windowPosition.value.x}px, ${windowPosition.value.y}px)`
  }
}
</script>

<style scoped>
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
