<script setup>
import { computed, inject, ref } from 'vue'
const openWindow = inject('openWindow')
import { useLocaleStore } from '@/stores/localeStore'
import leftMenuData from '@/data/left-menu-data.json'

const props = defineProps({
  leftMenuType: String
})

// Get the current locale from the locale store
const localeStore = useLocaleStore()
const collapsed = ref({})
const toggleSection = (id) => {
  collapsed.value[id] = !collapsed.value[id]
}
const currentLocale = computed(() => localeStore.currentLocale)
const leftMenu = leftMenuData.leftMenuItems[props.leftMenuType]

const getLocalizedTitle = (item) => {
  return item.title[currentLocale.value] || item.title['fr']
}

const getLocalizedSubtitle = (subtask) => {
  return subtask.subtitle[currentLocale.value] || subtask.subtitle['fr']
}
</script>

<template>
  <div class="flex flex-col flex-shrink-0 gap-3 bg-window-side-menu hidden sm:flex w-32 md:w-12.125 h-full p-2.5 overflow-auto z-20">
    <div
      v-for="item in leftMenu"
      :key="item.id"
      :class="[
        'text-twilight-blue rounded-t-sm',
        item.iconHeader ? 'mt-1 md:mt-2' : '',
        item.bgColor,
        item.bgImage ? 'bg-no-repeat bg-16 bg-bottom-right-picture-menu' : ''
      ]"
      :style="
        item.bgImage
          ? {
              backgroundImage: `url(${item.bgImage})`
            }
          : {}
      "
    >
      <div
        v-if="item.iconHeader"
        @click="toggleSection(item.id)"
        @keydown.enter.prevent="toggleSection(item.id)"
        @keydown.space.prevent="toggleSection(item.id)"
        role="button"
        tabindex="0"
        :aria-expanded="!collapsed[item.id]"
      >
        <img :src="item.iconHeader" :alt="getLocalizedTitle(item)" class="absolute w-5 h-5 md:w-7 md:h-7 top-3 md:top-2.5" />
        <div
          :class="[
            'flex flex-row justify-between items-center bg-window-menu-card-header rounded-t-sm px-1 py-px sm:px-2 sm:py-0.5 text-xs-mobile md:text-xs font-bold cursor-pointer hover:text-heroic-blue',
            { 'bg-window-menu-card-header-active text-white hover:text-white': item['headerActive'] }
          ]"
        >
          <h3 class="ml-4 md:ml-6 text-xs-mobile md:text-xxs">{{ getLocalizedTitle(item) }}</h3>
          <img :src="item.iconSrc" alt="plus" class="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-lg" />
        </div>
      </div>
      <div
        v-else
        @click="toggleSection(item.id)"
        @keydown.enter.prevent="toggleSection(item.id)"
        @keydown.space.prevent="toggleSection(item.id)"
        role="button"
        tabindex="0"
        :aria-expanded="!collapsed[item.id]"
        :class="[
          'flex flew-row justify-between items-center bg-window-menu-card-header rounded-t-sm px-1 py-px sm:px-2 sm:py-0.5 text-xs-mobile md:text-xs font-bold cursor-pointer hover:text-heroic-blue',
          { 'bg-window-menu-card-header-active text-white hover:text-white': item['headerActive'] }
        ]"
      >
        <h3 class="text-xs-mobile md:text-xxs">{{ getLocalizedTitle(item) }}</h3>
        <img :src="item.iconSrc" alt="plus" class="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-lg" />
      </div>
      <div v-show="!collapsed[item.id]" class="px-1 py-0.5 md:py-0.75 md:px-2" v-for="subtask in item.subtasks" :key="subtask.id">
        <a
          v-if="subtask.url"
          :href="subtask.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-row items-center gap-1 cursor-pointer hover:underline hover:text-heroic-blue"
        >
          <img :src="subtask.iconUrl" :alt="getLocalizedSubtitle(subtask)" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          <p class="font-light text-xxs-mobile md:text-xxs">{{ getLocalizedSubtitle(subtask) }}</p>
        </a>
        <button v-else @click="openWindow(subtask.action)" class="text-left flex flex-row items-center gap-1 cursor-pointer hover:underline hover:text-heroic-blue">
          <img :src="subtask.iconUrl" :alt="getLocalizedSubtitle(subtask)" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          <p class="font-light text-xxs-mobile md:text-xxs">{{ getLocalizedSubtitle(subtask) }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
