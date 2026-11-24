<script setup>
import { ref, computed, inject, onMounted, nextTick, onUnmounted } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useGoBackStore } from '@/stores/goBackStore'
import ProjectFolder from './MyProjects/ProjectFolder.vue'
import ProjectPreview from './MyProjects/ProjectPreview.vue'
import projectData from '@/data/projects-data.json'
import { matchesProject } from '@/lib/project-presentation.mjs'
import WindowLeftMenu from '@/components/Windows/WindowLeftMenu.vue'
import './MyProjects/project-explorer.css'
const props = defineProps({ leftMenuType: String })
const localeStore = useLocaleStore()
const goBackStore = useGoBackStore()
const openWindow = inject('openWindow')
const featured = projectData.featuredIds || []
const rank = (project) => (featured.includes(project.id) ? featured.indexOf(project.id) : featured.length)
const projects = projectData.categories.flatMap((category) => category.projects).sort((a, b) => rank(a) - rank(b))
const search = ref('')
const filter = ref('all')
const selectedId = ref(projects[0].id)
const searchInput = ref(null)
const filters = ['all', 'video', 'live', 'source']
const filteredProjects = computed(() => projects.filter((project) => matchesProject(project, search.value, filter.value)))
const selected = computed(() => filteredProjects.value.find((project) => project.id === selectedId.value) || filteredProjects.value[0])
const position = computed(() => filteredProjects.value.indexOf(selected.value))
const openProject = (project) => {
  selectedId.value = project.id
  goBackStore.currentActiveProject = project
}
const move = (direction) => {
  const count = filteredProjects.value.length
  if (count) selectedId.value = filteredProjects.value[(position.value + direction + count) % count].id
}
const focusSearch = async () => {
  goBackStore.currentActiveProject = null
  await nextTick()
  searchInput.value?.focus()
}
const resetFilters = () => {
  search.value = ''
  filter.value = 'all'
}
onMounted(() => window.addEventListener('portfolio-search', focusSearch))
onUnmounted(() => {
  window.removeEventListener('portfolio-search', focusSearch)
  goBackStore.currentActiveProject = null
})
</script>

<template>
  <div class="relative right-0 h-content-window flex xp-projects-window">
    <WindowLeftMenu :leftMenuType="props.leftMenuType" />
    <main class="xp-projects-main">
      <ProjectFolder v-if="goBackStore.currentActiveProject" :key="goBackStore.currentActiveProject.id" :project="goBackStore.currentActiveProject" />
      <template v-else>
        <div class="xp-projects-scroll">
          <header class="xp-projects-welcome">
            <img src="/img/icons/projects/projects-icon-lg.webp" alt="" width="48" height="48" />
            <div>
              <h1>{{ $t('projectExplorer.title') }}</h1>
              <p>{{ $t('projectExplorer.introduction') }}</p>
            </div>
            <button class="xp-button xp-project-contact" @click="openWindow('contact')">
              <img src="/img/icons/contact/email-icon-sm.webp" alt="" />{{ $t('projectExplorer.contact') }}
            </button>
          </header>
          <div class="xp-project-find">
            <label
              ><img src="/img/icons/windows-header-tools/magnifier-icon.webp" alt="" /><span class="sr-only">{{ $t('common.search') }}</span
              ><input ref="searchInput" v-model="search" type="search" :placeholder="$t('projectExplorer.search')" class="xp-input"
            /></label>
            <div class="xp-project-filters" role="group" :aria-label="$t('projectExplorer.filterProjects')">
              <button v-for="kind in filters" :key="kind" :aria-pressed="filter === kind" @click="filter = kind">{{ $t('projectExplorer.filters.' + kind) }}</button>
            </div>
          </div>
          <ProjectPreview v-if="selected" :project="selected" @open-folder="openProject(selected)">
            <template #navigation
              ><div class="xp-project-preview-nav">
                <button @click="move(-1)" :disabled="filteredProjects.length < 2" :aria-label="$t('projectExplorer.previous')">
                  <img src="/img/icons/pictures/previous-icon.svg" alt="" /></button
                ><span>{{ position + 1 }} / {{ filteredProjects.length }}</span
                ><button @click="move(1)" :disabled="filteredProjects.length < 2" :aria-label="$t('projectExplorer.next')">
                  <img src="/img/icons/pictures/next-icon.svg" alt="" />
                </button></div
            ></template>
          </ProjectPreview>
          <section class="xp-project-collection" :aria-label="$t('projectExplorer.collection')">
            <h2>
              {{ $t('projectExplorer.collection')
              }}<span>{{ filteredProjects.length }} {{ $t(filteredProjects.length === 1 ? 'projectExplorer.projectSingular' : 'projectExplorer.projects') }}</span>
            </h2>
            <div v-if="filteredProjects.length" class="xp-project-thumbnails">
              <button
                v-for="project in filteredProjects"
                :key="project.id"
                class="xp-project-thumbnail"
                :class="{ selected: selected.id === project.id }"
                :aria-pressed="selected.id === project.id"
                @click="selectedId = project.id"
                @dblclick="openProject(project)"
                @keydown.enter.prevent="openProject(project)"
                :title="$t('projectExplorer.openFolder') + ' — ' + project.name"
              >
                <span class="xp-project-thumbnail-picture"
                  ><img :src="project.image" :alt="project.caseStudyName" loading="lazy" decoding="async" /><img
                    class="xp-project-folder-corner"
                    src="/img/icons/windows-header-tools/open-folders.webp"
                    alt=""
                /></span>
                <span class="xp-project-thumbnail-name">{{ project.caseStudyName || project.name }}</span>
                <span class="xp-project-thumbnail-type">{{ $t('projectExplorer.coverIllustration') }}</span>
                <span class="xp-project-thumbnail-tech">{{ project.technologies.slice(0, 3).join(' · ') }}</span>
              </button>
            </div>
            <div v-else class="xp-project-empty" role="status">
              <img src="/img/icons/windows-header-tools/magnifier-icon.webp" alt="" />
              <h3>{{ $t('projectExplorer.noMatches') }}</h3>
              <p>{{ $t('projectExplorer.tryAnother') }}</p>
              <button class="xp-button" @click="resetFilters">{{ $t('projectExplorer.clearFilters') }}</button>
            </div>
          </section>
        </div>
        <footer class="xp-project-status">
          <span>{{ filteredProjects.length }} {{ $t(filteredProjects.length === 1 ? 'projectExplorer.projectSingular' : 'projectExplorer.projects') }}</span
          ><span>{{ selected?.caseStudyName || $t('projectExplorer.noMatches') }}</span
          ><span>{{ localeStore.currentLocale === 'fr' ? 'Portfolio de Ghazi Saoudi' : 'Ghazi Saoudi’s portfolio' }}</span>
        </footer>
      </template>
    </main>
  </div>
</template>
