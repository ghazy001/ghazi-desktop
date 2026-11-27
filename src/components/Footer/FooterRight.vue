<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useVolumeStore } from '@/stores/volumeStore'
import { useLocaleStore } from '@/stores/localeStore'
import CurrentTime from './CurrentTime.vue'
import NotificationModal from '@/components/Modals/NotificationModal.vue'
import MusicVolumeModal from '@/components/Modals/MusicVolumeModal.vue'
import LanguageModal from '@/components/Modals/LanguageModal.vue'

const volumeStore = useVolumeStore()
const volume = computed(() => volumeStore.volume)
const localeStore = useLocaleStore()

const localeNames = {
  en: 'EN',
  fr: 'FR'
}

// Initialize refs
const isFullScreen = ref(false)
const originalTitle = ref('Mode plein écran')
const isVolumeSettingsDisplayed = ref(false)
const isLanguageSettingsDisplayed = ref(false)
const musicModalRef = ref(null)
const languageRoot = ref(null)
const languageButton = ref(null)
const volumeButton = ref(null)
const currentLocale = computed(() => localeStore.currentLocale)

const enterFullScreen = () => {
  if (isFullScreen.value) {
    // Exit full-screen mode
    document.exitFullscreen()
    originalTitle.value = 'Mode plein écran'
    isFullScreen.value = false
  } else {
    // Enter full-screen mode only if the device is not a mobile device
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen()
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen()
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen()
    }
    originalTitle.value = 'Quitter le mode plein écran'
    isFullScreen.value = true
  }
}

const toggleMusicModal = () => {
  isVolumeSettingsDisplayed.value = !isVolumeSettingsDisplayed.value
  if (isVolumeSettingsDisplayed.value) {
    isLanguageSettingsDisplayed.value = false
  }
}

function closeLanguage(restoreFocus = false) {
  isLanguageSettingsDisplayed.value = false
  if (restoreFocus) nextTick(() => languageButton.value?.focus())
}
function selectLanguage(language) {
  localeStore.setLocale(language)
  closeLanguage(true)
}
function handleOutside(event) {
  const { target } = event
  if (!languageRoot.value?.contains(target)) closeLanguage()
  if (event.type === 'pointerdown' && !musicModalRef.value?.$el.contains(target) && !volumeButton.value?.contains(target)) isVolumeSettingsDisplayed.value = false
}
function handleEscape(event) {
  if (event.key === 'Escape' && isLanguageSettingsDisplayed.value) {
    event.preventDefault()
    closeLanguage(true)
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', handleOutside)
  document.addEventListener('focusin', handleOutside)
  document.addEventListener('keydown', handleEscape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutside)
  document.removeEventListener('focusin', handleOutside)
  document.removeEventListener('keydown', handleEscape)
})

const volumeIconSrc = computed(() => {
  return volume.value === 0 ? '/img/icons/mute-icon-sm.webp' : '/img/icons/volume-icon-sm.webp'
})

// Function to toggle the language modal
const toggleLanguageModal = () => {
  if (isLanguageSettingsDisplayed.value) closeLanguage()
  else openLanguage()
  if (isLanguageSettingsDisplayed.value) {
    isVolumeSettingsDisplayed.value = false
  }
}

function openLanguage() {
  isLanguageSettingsDisplayed.value = true
  isVolumeSettingsDisplayed.value = false
}

const flagSrc = computed(() => {
  return `/img/icons/langs/flag-${currentLocale.value}.webp`
})
</script>

<template>
  <div class="relative shrink-0 text-white h-full flex items-center px-1.5 sm:px-3 gap-0.5 bg-footer-right-component footer-left-shadow select-none">
    <div ref="languageRoot" class="relative h-full flex items-center">
      <button
        ref="languageButton"
        @click="toggleLanguageModal"
        @keydown.down.prevent="openLanguage"
        @keydown.up.prevent="openLanguage"
        aria-label="Language"
        :title="`${$t('common.language')}: ${localeNames[currentLocale]}`"
        :aria-expanded="isLanguageSettingsDisplayed"
        aria-haspopup="menu"
        aria-controls="taskbar-languages"
        class="taskbar-language-toggle"
      >
        <img
          class="w-4 h-3 cursor-pointer"
          :src="flagSrc"
          :alt="$t('alt.currLang') + ' ' + localeNames[currentLocale]"
          :title="$t('alt.currLang') + ' ' + localeNames[currentLocale]"
        />
        <span aria-hidden="true">{{ localeNames[currentLocale] }}</span>
      </button>
      <LanguageModal v-if="isLanguageSettingsDisplayed" :currentLocale="currentLocale" @select="selectLanguage" @close="closeLanguage(true)" />
    </div>
    <button @click="enterFullScreen" aria-label="Full screen">
      <img class="w-4 h-4 cursor-pointer" src="/img/icons/full-screen-icon-sm.webp" alt="" :title="originalTitle" />
    </button>
    <button ref="volumeButton" @click.stop="toggleMusicModal" aria-label="Volume">
      <img class="w-4 h-4 mt-px cursor-pointer" :src="volumeIconSrc" alt="" title="Volume" />
    </button>
    <MusicVolumeModal v-if="isVolumeSettingsDisplayed" ref="musicModalRef" />
    <NotificationModal class="md:block z-fmax" />
    <CurrentTime />
  </div>
</template>

<style scoped>
.taskbar-language-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 5px;
  border: 1px solid transparent;
  color: white;
  font:
    11px Tahoma,
    Arial,
    sans-serif;
}
.taskbar-language-toggle:hover,
.taskbar-language-toggle[aria-expanded='true'] {
  border-color: #6bc1ef;
  background: #147ac1;
  box-shadow: inset 1px 1px #0865a6;
}
.taskbar-language-toggle:focus-visible {
  outline: 1px dotted white;
  outline-offset: -3px;
}
</style>
