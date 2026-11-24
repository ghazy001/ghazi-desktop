<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useGoBackStore } from '@/stores/goBackStore'

import ProjectFolder from './MyProjects/ProjectFolder.vue'
import projectData from '@/data/projects-data.json'
import WindowLeftMenu from '@/components/Windows/WindowLeftMenu.vue'

const props = defineProps({
  leftMenuType: String
})

// Locale management
const isTouch = window.matchMedia('(pointer: coarse)').matches
const localeStore = useLocaleStore()
const goBackStore = useGoBackStore()

onUnmounted(() => {
  goBackStore.currentActiveProject = null
})

const categories = ref(
  projectData.categories.map((category) => ({
    ...category,
    projects: category.projects.map((project) => ({ ...project, isFocus: false, isActive: false }))
  }))
)

const search = ref('')
const searchInput = ref(null)
const filteredCategories = computed(() =>
  categories.value.map((category) => ({
    ...category,
    projects: category.projects.filter((project) =>
      `${project.name} ${project.summary} ${project.technologies.join(' ')}`.toLowerCase().includes(search.value.toLowerCase())
    )
  }))
)
const focusSearch = async () => {
  goBackStore.currentActiveProject = null
  await nextTick()
  searchInput.value?.focus()
}
onMounted(() => window.addEventListener('portfolio-search', focusSearch))
onUnmounted(() => window.removeEventListener('portfolio-search', focusSearch))

const state = reactive({
  selectedProject: null
})

const focusProject = (project) => {
  if (project.isFocus) {
    return
  }

  project.isFocus = !project.isFocus

  categories.value.forEach((category) => {
    category.projects.forEach((p) => {
      if (p.name !== project.name) {
        p.isFocus = false
      }
    })
  })
  state.selectedProject = project
}

const toggleProject = (project) => {
  // Before opening a project, close all others
  closeAllProjects()

  // Then open the selected project
  project.isActive = true
  state.selectedProject = project

  goBackStore.currentActiveProject = project
}

const closeAllProjects = () => {
  categories.value.forEach((category) => {
    category.projects.forEach((project) => {
      project.isActive = false
    })
  })
}

const getLocalizedCategoryName = (category) => category.name[localeStore.currentLocale] || category.name.en

// Watch for changes in currentActiveProject
watch(
  () => goBackStore.currentActiveProject,
  (newProject) => {
    if (!newProject) {
      closeAllProjects()
    }
  },
  { immediate: true }
)

// Unfocus the project when the user clicks outside the project card
const clearSelection = (e) => {
  if (!e.target.closest('.project-card') && state.selectedProject) {
    state.selectedProject.isFocus = false
    state.selectedProject = null
  }
}
window.addEventListener('click', clearSelection)
onUnmounted(() => window.removeEventListener('click', clearSelection))
</script>

<template>
  <div class="relative right-0 h-content-window flex">
    <WindowLeftMenu :leftMenuType="props.leftMenuType" />
    <!-- Content of project -->
    <ProjectFolder v-if="goBackStore.currentActiveProject" :key="goBackStore.currentActiveProject.id" :project="goBackStore.currentActiveProject" />
    <!-- Content window Foreach categories and projects -->
    <div v-else class="flex flex-col w-full h-full bg-white overflow-auto pt-0.5">
      <label class="text-xs px-3 py-2"
        >{{ $t('common.search') }}: <input ref="searchInput" v-model="search" type="search" class="xp-input" placeholder="Project or technology"
      /></label>
      <p v-if="filteredCategories.every((category) => !category.projects.length)" class="p-3 text-xs" role="status">No matching projects.</p>
      <div v-for="category in filteredCategories" :key="category.name" class="relative group mb-3">
        <h1 class="text-xs font-semibold px-3">{{ getLocalizedCategoryName(category) }}</h1>
        <div class="absolute left-[-12px] top-5 w-80 h-px bg-gradient-to-r from-blue-300 to-white"></div>

        <!-- Content for the projects -->
        <div class="flex flex-wrap gap-2 pt-2 md:pt-3 pb-3 w-full">
          <div
            v-for="project in category.projects"
            :key="project.name"
            @click="isTouch ? toggleProject(project) : focusProject(project)"
            @dblclick="toggleProject(project)"
            @keydown.enter.prevent="toggleProject(project)"
            @keydown.space.prevent="toggleProject(project)"
            role="button"
            tabindex="0"
            class="flex items-center px-4 pb-2 gap-2.5 cursor-pointer project-card"
            :class="{ active: project.isFocus }"
          >
            <img :src="'/img/icons/' + project.icon" alt="project" class="w-10 h-10" :style="{ opacity: project.isFocus ? 0.5 : 1 }" />
            <p
              class="text-xs font-tahoma font-medium"
              :style="{
                backgroundColor: project.isFocus ? '#0B61FF' : 'transparent',
                color: project.isFocus ? 'white' : 'black'
              }"
            >
              {{ project.name }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
