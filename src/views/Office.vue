<template>
  <MetaUpdater />
  <section class="h-svh w-screen overflow-hidden bg-office-pic bg-no-repeat bg-cover bg-center relative" @pointerdown="handleOutsideClick">
    <Header v-if="showHeader" :entities="entities" @open-window="openWindow" @toggle-header="toggleHeader" />
    <DesktopAppsLayout :entities="entities" @open-window="openWindow" />
    <div v-for="window in windows" :key="window.id">
      <Window
        v-show="window.visible"
        @toggle-minimize="minimizeWindow(window.id)"
        @close-window="closeWindow(window.id)"
        @pointerdown="handleWindowClick(window.id)"
        :id="window.id"
        :title="window.title"
        :iconSrc="window.iconSrc"
        :initPositionX="window.initPositionX"
        :initPositionY="window.initPositionY"
        :initWidth="window.initWidth"
        :initHeight="window.initHeight"
        :minWidth="window.minWidth"
        :minHeight="window.minHeight"
        :headerToolsId="window.headerToolsId"
        :menuHeaderItemsId="window.menuHeaderItemsId"
        :resizable="window.resizable"
        :windowsHeaderLogo="window.windowsHeaderLogo"
        :isSearchVisible="window.isSearchVisible"
        :skin="window.skin"
        :caption="window.caption"
        :style="{ zIndex: window.zIndex }"
      >
        <component
          :is="window.component"
          :leftMenuType="window.leftMenuType"
          :mode="window.mode"
          v-bind="{
            ...(window.file ? { file: window.file } : {}),
            ...(window.id === 'pictureViewer' ? { active: session.powerPhase === 'running' && window.visible } : {}),
            ...(['doom', 'spider', 'minesweeper'].includes(window.id) ? { active: session.desktopActive && window.visible && activeWindow === window.id } : {})
          }"
          @caption-change="window.caption = $event"
        />
      </Window>
    </div>
    <Footer :entities="windows" @toggle-header="toggleHeader" @toggle-window="handleWindowClick" />
    <ClippyModal />
  </section>
</template>

<script setup>
import { ref, provide, onMounted, defineAsyncComponent, computed, markRaw } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import { useWindowsStore } from '@/stores/windowsStore.js'
import { useVolumeStore } from '@/stores/volumeStore.js'
import { useLocaleStore } from '@/stores/localeStore'

import MetaUpdater from '../MetaUpdater.vue'
import Header from '@/components/Header/Header.vue'
import Footer from '@/components/Footer/Footer.vue'

import AppLoading from '@/components/Windows/AppLoading.vue'
import { loadComputer } from '@/lib/load-desktop'
import profile from '@/data/profile-data.json'
import { storedValue } from '@/lib/browser-storage.mjs'
import browserConfiguration from '@/data/browser-data.json'
import { frameRestriction } from '@/lib/internet-explorer.mjs'

import DesktopAppsLayout from '@/layouts/DesktopAppsLayout.vue'
import Window from '@/layouts/Window.vue'
import windowsData from '@/data/windows-data.json'
import ClippyModal from '@/components/Modals/ClippyModal.vue'

const applicationLoaders = {
  MyComputer: loadComputer,
  Assistant: () => import('@/components/Windows/Assistant/Assistant.vue'),
  Spider: () => import('@/components/Windows/Spider/Spider.vue'),
  AboutMe: () => import('@/components/Windows/AboutMe/AboutMe.vue'),
  Paint: () => import('@/components/Windows/Paint/Paint.vue'),
  Documents: () => import('@/components/Windows/Documents/Documents.vue'),
  Gift: () => import('@/components/Windows/Gift/Gift.vue'),
  Minesweeper: () => import('@/components/Windows/Minesweeper.vue'),
  MyCV: () => import('@/components/Windows/MyCV/MyCV.vue'),
  ContactMe: () => import('@/components/Windows/ContactMe.vue'),
  MyProjects: () => import('@/components/Windows/MyProjects.vue'),
  Pictures: () => import('@/components/Windows/Pictures.vue'),
  Notepad: () => import('@/components/Windows/Notepad.vue'),
  Doom: () => import('@/components/Windows/Doom.vue'),
  Music: () => import('@/components/Windows/Music/Music.vue'),
  Terminal: () => import('@/components/Windows/Terminal.vue'),
  ProfileContent: () => import('@/components/Windows/ProfileContent.vue'),
  InternetExplorer: () => import('@/components/Windows/InternetExplorer/InternetExplorer.vue'),
  PictureViewer: () => import('@/components/Windows/PictureViewer/PictureViewer.vue')
}
const components = Object.fromEntries(
  Object.entries(applicationLoaders).map(([name, loader]) => [
    name,
    markRaw(
      defineAsyncComponent({
        loader,
        loadingComponent: AppLoading,
        errorComponent: AppLoading,
        delay: 120,
        onError(error, retry, fail, attempts) {
          if (attempts < 2) setTimeout(retry, 300)
          else fail()
        }
      })
    )
  ])
)

const showHeader = ref(false)
const windows = ref([])
const windowsStore = useWindowsStore()
const session = useConnectionStore()
const volumeStore = useVolumeStore()
const localeStore = useLocaleStore()

onMounted(() => {
  if (session.powerPhase === 'running') session.login()
  // Ensure the localeStore is updated with the correct locale from localStorage
  const storedLocale = storedValue('currentLocale') || 'en'
  localeStore.setLocale(storedLocale)

  if (!windows.value.length) openWindow('computer')
  volumeStore.playAudio(['/sounds/start-windows.mp3'])
  volumeStore.unmuteAudio()
})

// Keep track of the highest z-index
const highestZIndex = ref(0)

// Set activeness of windows
const activeWindow = ref(null)

// Create the entities array from the data.json
const entities = ref(
  windowsData.map((item) => ({
    ...item,
    component: components[item.component]
  }))
)

const toggleHeader = () => {
  showHeader.value = !showHeader.value
}

const setActiveWindow = (windowId) => {
  activeWindow.value = windowId
}

const openWindow = (windowId, file = null) => {
  const existingWindow = windows.value.find((window) => window.id === windowId)
  if (!existingWindow) {
    const entity = entities.value.find((entity) => entity.id === windowId)
    if (entity) {
      highestZIndex.value++ // Increase highestZIndex
      windows.value.push({
        id: windowId,
        mode: entity.mode,
        skin: entity.skin,
        caption: entity.caption,
        file,
        visible: true,
        component: markRaw(entity.component),
        iconSrc: entity.iconSrc,
        title: entity.title,
        zIndex: highestZIndex.value, // Use highestZIndex
        initPositionX: entity.initPositionX,
        initPositionY: entity.initPositionY,
        initWidth: entity.initWidth,
        initHeight: entity.initHeight,
        minWidth: entity.minWidth,
        minHeight: entity.minHeight,
        leftMenuType: entity.leftMenuType,
        headerToolsId: entity.headerToolsId,
        menuHeaderItemsId: entity.menuHeaderItemsId,
        resizable: entity.resizable,
        windowsHeaderLogo: entity.windowsHeaderLogo,
        isSearchVisible: entity.isSearchVisible
      })
      if (file?.windowCaption) windows.value[windows.value.length - 1].caption = file.windowCaption
      setActiveWindow(windowId) // Set the window clicked as active
      windowsStore.addWindowStore(windowId) // Save state to localStorage
    }
  } else {
    if (file) {
      existingWindow.file = file
      if (file.windowCaption) existingWindow.caption = file.windowCaption
    }
    // If window already exists, just bring it to the front
    handleWindowClick(windowId)
  }
}

const openFile = async (file) => {
  if (file.kind === 'link') {
    // These sites prohibit framing; launch the real destination immediately.
    if (frameRestriction(file.url, browserConfiguration.frameRestrictions)) {
      window.open(file.url, '_blank', 'noopener,noreferrer')
      return
    }
    openWindow('internet', { kind: 'link', url: file.url, name: file.name.replace(/\.url$/, '') })
    return
  }
  const applications = { text: ['notepad', 'Notepad'], image: ['pictureViewer', 'Windows Picture and Fax Viewer'], video: ['music', 'Windows Media Player'] }
  const destination = applications[file.kind]
  if (destination) openWindow(destination[0], { ...file, windowCaption: `${file.name} - ${destination[1]}` })
}

const handleWindowClick = (windowId) => {
  const window = windows.value.find((window) => window.id === windowId)
  if (window) {
    if (!window.visible) {
      // If window is not visible, make it visible
      window.visible = true
    }
    if (window.zIndex !== highestZIndex.value) {
      highestZIndex.value++ // Increase highestZIndex
      window.zIndex = highestZIndex.value // Use highestZIndex
    }
    setActiveWindow(windowId) // Set the window clicked as active
  }
}

const activateTopWindow = () => {
  const top = windows.value.filter((window) => window.visible).reduce((best, window) => (!best || window.zIndex > best.zIndex ? window : best), null)
  activeWindow.value = top?.id || null
}

const closeWindow = (windowId) => {
  const windowIndex = windows.value.findIndex((window) => window.id === windowId)
  if (windowIndex !== -1) {
    const wasActive = activeWindow.value === windowId
    windows.value.splice(windowIndex, 1)
    if (wasActive) activateTopWindow()
    windowsStore.removeWindowStore(windowId) // Remove the window from localstorage
  }
}

const minimizeWindow = (windowId) => {
  const window = windows.value.find((window) => window.id === windowId)
  if (window) {
    window.visible = false
    if (activeWindow.value === windowId) {
      activateTopWindow()
    }
  }
}

const handleOutsideClick = (event) => {
  if (showHeader.value) {
    const headerElement = document.querySelector('.header-component')
    const startButtonElement = document.querySelector('.start-button')

    // Cancel close if click occurs on start button
    if (startButtonElement && startButtonElement.contains(event.target)) {
      return
    }

    // Close the header if the clicked element is outside the header
    if (headerElement && !headerElement.contains(event.target)) {
      toggleHeader()
    }
  }

  // Deactivate the active window if the click occurred outside of any window
  const clickedOutsideAnyWindow = windows.value.every((window) => {
    const windowElement = document.getElementById(window.id)
    return windowElement && !windowElement.contains(event.target)
  })

  if (clickedOutsideAnyWindow) {
    setActiveWindow(null)
  }
}

// Provide functions and refs to child components
provide('browserPageTitle', ref(profile.name))
provide('browserLocation', ref(profile.website))
provide('highestZIndex', highestZIndex)
provide(
  'activeWindow',
  computed({
    get: () => (session.desktopActive ? activeWindow.value : null),
    set: (value) => {
      activeWindow.value = value
    }
  })
)
provide('openWindow', openWindow)
provide('openFile', openFile)
provide('activateWindow', handleWindowClick)
provide('minimizeWindow', minimizeWindow)

// Open each window that was open before the page was reloaded
windowsStore.openWindowIds.forEach((windowId) => {
  openWindow(windowId)
})
</script>
