<script setup>
import { computed, inject } from 'vue'
import { useGoBackStore } from '@/stores/goBackStore'
const props = defineProps({ id: String, headerToolsId: String })
const store = useGoBackStore()
const openWindow = inject('openWindow')
const canGoBack = computed(() => props.id === 'myProjects' && !!store.currentActiveProject)
const back = () => {
  store.currentActiveProject = null
}
const search = () => {
  openWindow('myProjects')
  window.dispatchEvent(new CustomEvent('portfolio-search'))
}
</script>
<template>
  <div class="flex relative top-0 w-full h-9 bg-window-white border-top-grey overflow-hidden items-center gap-1 px-1" role="toolbar" aria-label="Explorer toolbar">
    <button @click="back" :disabled="!canGoBack" :class="{ 'grayscale opacity-50': !canGoBack }" class="xp-explorer-tool" :aria-label="$t('common.back')">
      <img src="/img/icons/windows-header-tools/right-arrow-green-icon.webp" alt="" width="28" height="28" /><span class="small-p">{{ $t('common.back') }}</span>
    </button>
    <button @click="openWindow('computer')" class="xp-explorer-tool" aria-label="My Computer">
      <img src="/img/icons/my-computer.png" alt="" width="24" height="24" />
    </button>
    <span class="xp-toolbar-divider" style="height: 24px"></span>
    <button @click="search" class="xp-explorer-tool" :aria-label="$t('common.search')">
      <img src="/img/icons/windows-header-tools/magnifier-icon.webp" alt="" width="24" height="24" /><span class="small-p">{{ $t('common.search') }}</span>
    </button>
    <button @click="openWindow('documents')" class="xp-explorer-tool" aria-label="My Documents">
      <img src="/img/icons/windows-header-tools/open-folders.webp" alt="" width="24" height="24" /><span class="small-p">{{ $t('common.folder') }}</span>
    </button>
  </div>
</template>
