<script setup>
import { computed, inject, ref } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useGoBackStore } from '@/stores/goBackStore'
import windows from '@/data/windows-data.json'
const props = defineProps({ id: String, title: String, iconSrc: String, isSearchVisible: Boolean })
const locale = useLocaleStore()
const store = useGoBackStore()
const openWindow = inject('openWindow')
const destination = ref(props.id)
const address = computed(() => (props.id === 'myProjects' && store.currentActiveProject ? `${props.title}\\${store.currentActiveProject.name}` : props.title))
const navigate = () => openWindow(destination.value)
</script>
<template>
  <div v-if="isSearchVisible" class="flex items-center top-0 w-full h-5 px-0.5 bg-window-white border-top-grey shadow-header-window">
    <label :for="id + '-address'" class="small-p text-gray-500 px-1.5 cursor-default">{{ $t('common.address') }}</label>
    <div class="w-full min-w-0 h-full bg-white border border-blue-400 pl-1 flex items-center">
      <img :src="iconSrc" alt="" class="w-3.5 h-3.5 shrink-0" />
      <select :id="id + '-address'" v-model="destination" @keydown.enter="navigate" class="xp-address w-full h-full min-w-0 small-p bg-white">
        <option v-for="app in windows" :key="app.id" :value="app.id">{{ app.id === id ? address : app.title[locale.currentLocale] }}</option>
      </select>
    </div>
    <button @click="navigate" class="flex items-center px-2 gap-1 shrink-0" :aria-label="$t('common.go')">
      <img src="/img/icons/windows-header-tools/right-green-arrow-icon.webp" alt="" class="w-3.5 h-3.5" /><span class="small-p">{{ $t('common.go') }}</span>
    </button>
  </div>
</template>
<style scoped>
.xp-address {
  appearance: none;
  padding: 0 18px 0 4px;
  background: white url('/img/icons/windows-header-tools/down-icon.webp') no-repeat right 1px center / 14px 14px;
}
</style>
