<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import { useGoBackStore } from '@/stores/goBackStore'
import profile from '@/data/profile-data.json'
import apps from '@/data/windows-data.json'
import projectData from '@/data/projects-data.json'
import playlist from '@/data/playlist-data.json'
import config from '@/data/computer-data.json'
import { ROOT, computerCatalog, resolveComputerLocation, searchComputer } from '@/lib/computer-explorer.mjs'
import DriveIcon from './DriveIcon.vue'
import GiftIcon from '../Gift/GiftIcon.vue'
import BrowserIcon from '../InternetExplorer/BrowserIcon.vue'
import './computer.css'
const locale = useLocaleStore(),
  projectStore = useGoBackStore(),
  openWindow = inject('openWindow'),
  openFile = inject('openFile'),
  activeWindow = inject('activeWindow', ref(null))
const lang = computed(() => (locale.currentLocale === 'fr' ? 'fr' : 'en')),
  copy = computed(() => config[lang.value])
const projects = projectData.categories.flatMap((c) => c.projects)
const catalog = computed(() => computerCatalog({ config, profile, projects, playlist, apps }, lang.value))
const history = ref([ROOT]),
  position = ref(0),
  selectedId = ref(''),
  query = ref(''),
  searchVisible = ref(false),
  sidebar = ref(true),
  view = ref('tiles'),
  viewMenu = ref(false),
  collapsed = ref({}),
  dialog = ref(null),
  tab = ref('general'),
  address = ref(''),
  invalid = ref('')
const host = ref(null),
  containerWidth = ref(960),
  mobileTasks = ref(false)
let observer
const narrow = computed(() => containerWidth.value <= 570)
const paneActive = computed(() => (narrow.value ? mobileTasks.value : sidebar.value))
function toggleSidebar() {
  if (narrow.value) {
    sidebar.value = true
    mobileTasks.value = !mobileTasks.value
  } else sidebar.value = !sidebar.value
}
const addressField = ref(null),
  searchField = ref(null),
  dialogRoot = ref(null)
const current = computed(() => history.value[position.value]),
  canBack = computed(() => position.value > 0),
  canForward = computed(() => position.value < history.value.length - 1)
const currentLabel = computed(() => (current.value === ROOT ? copy.value.computer : `${catalog.value.drives.find((d) => d.target === current.value)?.name}\\`))
const entries = computed(() => (query.value.trim() ? searchComputer(catalog.value.all, query.value) : catalog.value.locations[current.value]))
const selected = computed(() => entries.value.find((e) => e.id === selectedId.value))
const groupNames = computed(() => (query.value.trim() ? ['search'] : current.value === ROOT ? ['files', 'disks', 'removable', 'network'] : ['contents']))
const appTitle = (id) => apps.find((a) => a.id === id)?.title[lang.value] || id
function navigate(target) {
  if (!catalog.value.locations[target]) return
  history.value = history.value.slice(0, position.value + 1)
  if (current.value !== target) {
    history.value.push(target)
    position.value++
  }
  reset()
}
function reset() {
  selectedId.value = ''
  query.value = ''
  invalid.value = ''
  address.value = ''
  viewMenu.value = false
}
function back() {
  if (canBack.value) {
    position.value--
    reset()
  }
}
function forward() {
  if (canForward.value) {
    position.value++
    reset()
  }
}
function go() {
  const target = resolveComputerLocation(address.value || current.value, config)
  if (target) navigate(target)
  else {
    invalid.value = copy.value.invalid
    addressField.value?.focus()
  }
}
function open(item) {
  if (!item) return
  if (item.target) navigate(item.target)
  else if (item.project) {
    projectStore.currentActiveProject = item.project
    openWindow('myProjects')
  } else if (item.file) openFile(item.file)
  else if (item.app) openWindow(item.app)
}
function choose(item, event) {
  selectedId.value = item.id
  if (event.pointerType === 'touch' || window.matchMedia('(max-width:600px)').matches) open(item)
}
function showDialog(kind) {
  viewMenu.value = false
  dialog.value = kind
  tab.value = 'general'
  nextTick(() => dialogRoot.value?.querySelector('button')?.focus())
}
function toggleSearch() {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) nextTick(() => searchField.value?.focus())
  else query.value = ''
}
function groupEntries(group) {
  return group === 'search' || group === 'contents' ? entries.value : entries.value.filter((e) => e.group === group)
}
function sectionName(group) {
  return group === 'contents' ? currentLabel.value : group === 'search' ? copy.value.search : copy.value[group]
}
function detailsType(item) {
  return item?.target ? `${item.count} ${copy.value.items}` : item?.type
}
function setView(mode) {
  view.value = mode
  viewMenu.value = false
}
function entryEnter(item, event) {
  if (event.altKey) {
    event.stopPropagation()
    itemProperties(item)
  } else open(item)
}
function itemProperties(item) {
  selectedId.value = item.id
  showDialog('item')
}
function openSelected() {
  dialog.value = null
  open(selected.value)
}
function command(event) {
  if (activeWindow.value !== 'computer') return
  const action = event.detail
  if (action === 'back') back()
  if (action === 'forward') forward()
  if (action === 'home') navigate(ROOT)
  if (action === 'open') open(selected.value)
  if (action === 'properties') showDialog(selected.value ? 'item' : 'system')
  if (action === 'system') showDialog('system')
  if (action === 'help') showDialog('help')
  if (action === 'tiles' || action === 'list') view.value = action
  if (action === 'folders') toggleSidebar()
  if (action === 'search') toggleSearch()
}
function keydown(event) {
  if (activeWindow.value !== 'computer') return
  if (dialog.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialog.value = null
    }
    if (event.key === 'Tab') {
      const nodes = [...dialogRoot.value.querySelectorAll('button')]
      const index = nodes.indexOf(document.activeElement)
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === nodes.length - 1)) {
        event.preventDefault()
        nodes[event.shiftKey ? nodes.length - 1 : 0]?.focus()
      }
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault()
    searchVisible.value = true
    nextTick(() => searchField.value?.focus())
    return
  }
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault()
    back()
  }
  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault()
    forward()
  }
  if (event.altKey && event.key === 'ArrowUp') {
    event.preventDefault()
    navigate(ROOT)
  }
  if (event.key === 'Escape') {
    viewMenu.value = false
    query.value = ''
    invalid.value = ''
  }
  if (event.altKey && event.key === 'Enter') {
    event.preventDefault()
    showDialog(selected.value ? 'item' : 'system')
  }
}
const outside = (event) => {
  if (!event.target.closest('.computer-views')) viewMenu.value = false
}
onMounted(() => {
  observer = new ResizeObserver(() => (containerWidth.value = host.value.clientWidth))
  observer.observe(host.value)
  window.addEventListener('computer-command', command)
  window.addEventListener('keydown', keydown)
  document.addEventListener('pointerdown', outside)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('computer-command', command)
  window.removeEventListener('keydown', keydown)
  document.removeEventListener('pointerdown', outside)
})
</script>
<template>
  <div ref="host" class="xp-computer" :class="{ 'computer-mobile-tasks': mobileTasks }">
    <nav class="computer-toolbar" :aria-label="copy.computer">
      <button :aria-label="copy.back" :disabled="!canBack" @click="back">
        <GiftIcon name="back" /><span>{{ copy.back }}</span></button
      ><button :aria-label="copy.forward" :disabled="!canForward" @click="forward"><GiftIcon name="forward" /></button
      ><button :aria-label="copy.up" :disabled="current === ROOT && !query" @click="navigate(ROOT)"><GiftIcon name="up" /></button><i></i>
      <button :aria-label="copy.search" :aria-pressed="searchVisible" @click="toggleSearch">
        <BrowserIcon name="search" /><span>{{ copy.search }}</span></button
      ><button :aria-label="copy.folders" :aria-pressed="paneActive" @click="toggleSidebar">
        <img src="/img/icons/windows-header-tools/open-folders.webp" alt="" /><span>{{ copy.folders }}</span></button
      ><i></i>
      <div class="computer-views">
        <button :aria-label="copy.views" aria-haspopup="menu" :aria-expanded="viewMenu" @click="viewMenu = !viewMenu">
          <span class="computer-view-icon" aria-hidden="true">▦</span><span>{{ copy.views }}</span
          ><small aria-hidden="true">▾</small>
        </button>
        <div v-if="viewMenu" role="menu">
          <button v-for="mode in ['tiles', 'list']" :key="mode" role="menuitemradio" :aria-checked="view === mode" @click="setView(mode)">{{ copy[mode] }}</button>
        </div>
      </div>
    </nav>
    <form class="computer-address" @submit.prevent="go">
      <label for="computer-location">{{ copy.address }}</label>
      <div>
        <img src="/img/icons/my-computer.png" alt="" /><input
          id="computer-location"
          ref="addressField"
          :value="address || currentLabel"
          @input="address = $event.target.value"
          @focus="$event.target.select()"
          :aria-label="copy.address"
          autocomplete="off"
        /><select :value="current" :aria-label="copy.location" @change="navigate($event.target.value)">
          <option value="computer">{{ copy.computer }}</option>
          <option v-for="drive in catalog.drives" :value="drive.target" :key="drive.id">{{ drive.name }}</option>
        </select>
      </div>
      <button type="submit"><img src="/img/icons/windows-header-tools/right-green-arrow-icon.webp" alt="" />{{ copy.go }}</button>
    </form>
    <div v-if="searchVisible" class="computer-search">
      <label for="computer-search">{{ copy.searchLabel }}</label><input
        id="computer-search"
        ref="searchField"
        v-model="query"
        type="search"
        :placeholder="copy.name"
      /><button v-if="query" @click="query = ''">
        {{ copy.reset }}
      </button>
    </div>
    <p v-if="invalid" class="computer-error" role="alert">{{ invalid }}</p>
    <div class="computer-body">
      <aside v-if="sidebar" class="computer-taskpane">
        <section v-for="section in ['systemTasks', 'otherPlaces', 'details']" :key="section" class="computer-task-section">
          <button class="computer-task-heading" :aria-expanded="!collapsed[section]" @click="collapsed[section] = !collapsed[section]">
            {{ copy[section] }}<span aria-hidden="true">{{ collapsed[section] ? '⌄' : '⌃' }}</span>
          </button>
          <div v-show="!collapsed[section]" class="computer-task-content">
            <template v-if="section === 'systemTasks'"
              ><button @click="showDialog('system')"><img src="/img/icons/side-menu/computer-icon.webp" alt="" />{{ copy.systemInfo }}</button
              ><button v-if="selected" @click="showDialog('item')"><img src="/img/icons/info-icon.webp" alt="" />{{ copy.properties }}</button
              ><button v-if="selected?.target" @click="open(selected)">
                <img src="/img/icons/windows-header-tools/folder-opening-icon.webp" alt="" />{{ copy.driveContents }}
              </button></template
            >
            <template v-else-if="section === 'otherPlaces'"
              ><button v-if="current !== ROOT" @click="navigate(ROOT)"><img src="/img/icons/my-computer.png" alt="" />{{ copy.computer }}</button
              ><button v-for="id in ['documents', 'myProjects', 'contact']" :key="id" @click="openWindow(id)">
                <img :src="apps.find((a) => a.id === id).imgSrc" alt="" />{{ appTitle(id) }}
              </button></template
            >
            <template v-else
              ><DriveIcon v-if="selected?.iconKind" :kind="selected.iconKind" class="computer-detail-icon" /><img
                v-else
                :src="selected?.icon || '/img/icons/my-computer.png'"
                alt=""
                class="computer-detail-icon"
              /><strong>{{ selected?.name || currentLabel }}</strong>
              <p>{{ selected?.type || profile.name }}</p>
              <p v-if="selected">{{ selected.description }}</p>
              <p v-else>{{ current === ROOT ? profile.title : config.drives.find((d) => d.id === current)?.description[lang] }}</p>
              <p v-if="selected?.target">{{ detailsType(selected) }}</p></template
            >
          </div>
        </section>
      </aside>
      <main @click.capture="mobileTasks = false" class="computer-content" :aria-label="query ? copy.search : currentLabel" @click.self="selectedId = ''">
        <header v-if="current === ROOT && !query" class="computer-watermark">
          <img src="/img/icons/my-computer.png" alt="" />
          <div>
            <h1>{{ copy.computer }}</h1>
            <p>{{ profile.name }}<span> · Ghazi XP</span></p>
          </div>
        </header>
        <div v-if="view === 'list'" class="computer-list-heading">
          <span>{{ copy.name }}</span><span>{{ copy.type }}</span
          ><span>{{ copy.location }}</span>
        </div>
        <section v-for="group in groupNames" :key="group" v-show="groupEntries(group).length" class="computer-group">
          <h2>{{ sectionName(group) }}</h2>
          <div class="computer-items" :class="{ 'computer-list': view === 'list' }">
            <button
              v-for="item in groupEntries(group)"
              :key="item.id"
              class="computer-item"
              :class="{ selected: selectedId === item.id }"
              :aria-pressed="selectedId === item.id"
              :aria-label="item.name"
              :title="item.description || item.type"
              @click="choose(item, $event)"
              @dblclick="open(item)"
              @keydown.enter.prevent="entryEnter(item, $event)"
              @keydown.space.prevent="open(item)"
              @contextmenu.prevent="itemProperties(item)"
            >
              <DriveIcon v-if="item.iconKind" :kind="item.iconKind" /><img v-else :src="item.icon" alt="" loading="lazy" /><span class="computer-item-name"
                >{{ item.name }}<small v-if="view === 'tiles'">{{ item.description || item.type }}</small></span
              ><span v-if="view === 'list'" class="computer-item-type">{{ item.type }}</span
              ><span v-if="view === 'list'" class="computer-item-location">{{ item.parent === ROOT ? copy.computer : item.parent + '\\' }}</span>
            </button>
          </div>
        </section>
        <div v-if="!entries.length" class="computer-empty">
          <BrowserIcon name="search" />
          <p>{{ copy.empty }}</p>
          <button @click="query = ''">{{ copy.reset }}</button>
        </div>
      </main>
    </div>
    <footer class="computer-status">
      <span>{{ entries.length }} {{ copy.items }}{{ selected ? ' · 1 ' + copy.selected : '' }}</span
      ><span v-if="selected">{{ selected.name }}</span
      ><span v-else>{{ copy.rootHint }}</span
      ><button v-if="selected" @click="open(selected)">{{ copy.open }}</button><button v-if="selected" @click="showDialog('item')">{{ copy.properties }}</button>
    </footer>
    <div v-if="dialog" class="computer-modal">
      <section
        ref="dialogRoot"
        class="computer-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="dialog === 'help' ? copy.helpTitle : dialog === 'system' ? copy.systemProperties : copy.properties"
      >
        <header>
          {{ dialog === 'help' ? copy.helpTitle : dialog === 'system' ? copy.systemProperties : copy.properties
          }}<button @click="dialog = null" aria-label="Close">×</button>
        </header>
        <div class="computer-dialog-inside">
          <div v-if="dialog === 'system'" class="computer-property-tabs">
            <button :aria-pressed="tab === 'general'" @click="tab = 'general'">{{ copy.general }}</button><button
              :aria-pressed="tab === 'volumes'"
              @click="tab = 'volumes'"
            >
              {{ copy.volumes }}
            </button>
          </div>
          <div class="computer-property-body">
            <template v-if="dialog === 'help'"
              ><p>{{ copy.help }}</p></template
            ><template v-else-if="dialog === 'system' && tab === 'general'"
              ><div class="computer-system-brand">
                <img src="/img/icons/windows-icon.webp" alt="" />
                <div>
                  <h2>Ghazi<span>xp</span></h2>
                  <p>{{ copy.edition }}</p>
                </div>
              </div>
              <dl>
                <dt>{{ copy.system }}</dt>
                <dd>Ghazi XP · {{ copy.edition }}</dd>
                <dt>{{ copy.registered }}</dt>
                <dd>{{ profile.name }}<br />{{ profile.title }}<br />{{ profile.location }}</dd>
              </dl>
              <p class="computer-property-note">{{ copy.driveNote }}</p></template
            ><template v-else-if="dialog === 'system'"
              ><div v-for="drive in catalog.drives" :key="drive.id" class="computer-volume-row">
                <DriveIcon :kind="drive.iconKind" />
                <div>
                  <strong>{{ drive.name }}</strong>
                  <p>{{ drive.count }} {{ copy.items }}</p>
                </div>
              </div></template
            ><template v-else-if="selected"
              ><div class="computer-property-item">
                <DriveIcon v-if="selected.iconKind" :kind="selected.iconKind" /><img v-else :src="selected.icon" alt="" /><strong>{{ selected.name }}</strong>
              </div>
              <dl>
                <dt>{{ copy.type }}</dt>
                <dd>{{ selected.type }}</dd>
                <dt>{{ copy.location }}</dt>
                <dd>{{ selected.parent === ROOT ? copy.computer : selected.parent + '\\' }}</dd>
                <dt>{{ copy.storage }}</dt>
                <dd>{{ selected.description || detailsType(selected) }}</dd>
              </dl>
              <p v-if="selected.target">{{ selected.count }} {{ copy.items }}</p>
              <button class="xp-button" @click="openSelected">{{ copy.open }}</button></template
            >
          </div>
          <div class="computer-dialog-actions">
            <button class="xp-button" @click="dialog = null">{{ copy.ok }}</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
