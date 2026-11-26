<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import profile from '@/data/profile-data.json'
import config from '@/data/documents-data.json'
import { useLocaleStore } from '@/stores/localeStore'
import { DOCUMENTS_ROOT, documentCatalog, findDocuments, resolveDocumentFolder, sortDocuments, downloadableDocument } from '@/lib/document-files.mjs'
import GiftIcon from '../Gift/GiftIcon.vue'
import BrowserIcon from '../InternetExplorer/BrowserIcon.vue'
import '../MyComputer/computer.css'
import './documents.css'
const locale = useLocaleStore(),
  openWindow = inject('openWindow'),
  openFile = inject('openFile'),
  activeWindow = inject('activeWindow', ref(null))
const language = computed(() => (locale.currentLocale === 'fr' ? 'fr' : 'en')),
  copy = computed(() => config[language.value])
const catalog = computed(() => documentCatalog(profile, config, language.value))
const root = ref(null),
  width = ref(1000),
  history = ref([DOCUMENTS_ROOT]),
  position = ref(0),
  selectedId = ref('cv'),
  view = ref('tiles'),
  sort = ref('name'),
  query = ref(''),
  searchVisible = ref(false),
  sidebar = ref(true),
  mobilePane = ref(false),
  collapsed = ref({}),
  dialog = ref(null),
  address = ref(''),
  notice = ref('')
const searchField = ref(null),
  addressField = ref(null),
  dialogRoot = ref(null)
let observer
const current = computed(() => history.value[position.value]),
  currentFolder = computed(() => catalog.value.folders.get(current.value)),
  path = computed(() => catalog.value.path(current.value))
const canBack = computed(() => position.value > 0),
  canForward = computed(() => position.value < history.value.length - 1),
  narrow = computed(() => width.value <= 570),
  paneActive = computed(() => (narrow.value ? mobilePane.value : sidebar.value))
const items = computed(() =>
  sortDocuments(query.value.trim() ? findDocuments(catalog.value.entries, query.value) : catalog.value.children(current.value), sort.value, language.value)
)
const selected = computed(() => items.value.find((item) => item.id === selectedId.value))
const groups = computed(() => (query.value.trim() ? ['results'] : ['folders', 'files']))
const groupItems = (group) =>
  group === 'results' ? items.value : items.value.filter((item) => (item.kind === 'folder' || item.kind === 'shortcut') === (group === 'folders'))
const canDownload = computed(() => !!downloadableDocument(selected.value))
function size(bytes) {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  return `${new Intl.NumberFormat(language.value, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
}
function navigate(id) {
  if (!catalog.value.folders.has(id)) return
  if (id !== current.value) {
    history.value = history.value.slice(0, position.value + 1)
    history.value.push(id)
    position.value++
  }
  reset()
}
function reset() {
  query.value = ''
  selectedId.value = ''
  address.value = ''
  notice.value = ''
  mobilePane.value = false
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
function up() {
  if (currentFolder.value.parent) navigate(currentFolder.value.parent)
  else openWindow('computer')
}
function go() {
  const id = resolveDocumentFolder(address.value || path.value, catalog.value)
  if (id) navigate(id)
  else {
    notice.value = copy.value.invalid
    addressField.value?.focus()
  }
}
function open(item) {
  if (!item) return
  if (item.target) navigate(item.target)
  else if (item.app) openWindow(item.app)
  else openFile(item)
}
function choose(item, event) {
  selectedId.value = item.id
  if (event.pointerType === 'touch' || window.matchMedia('(max-width:600px)').matches) open(item)
}
function enter(item, event) {
  if (event.altKey) {
    event.stopPropagation()
    properties(item)
  } else open(item)
}
function togglePane() {
  if (narrow.value) {
    sidebar.value = true
    mobilePane.value = !mobilePane.value
  } else sidebar.value = !sidebar.value
}
function toggleSearch() {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) nextTick(() => searchField.value?.focus())
  else query.value = ''
}
function save(item = selected.value) {
  const file = downloadableDocument(item)
  if (!file) return
  const a = document.createElement('a')
  let url = file.url
  if (!url) url = URL.createObjectURL(new Blob([file.text], { type: file.type }))
  a.href = url
  a.download = file.name
  a.hidden = true
  document.body.append(a)
  a.click()
  a.remove()
  if (!file.url) setTimeout(() => URL.revokeObjectURL(url), 1000)
}
async function copyName() {
  if (!selected.value) return
  try {
    await navigator.clipboard.writeText(selected.value.name)
    notice.value = copy.value.copied
  } catch {
    properties()
    notice.value = copy.value.copyFailed
  }
}
function properties(item = selected.value) {
  if (item) selectedId.value = item.id
  dialog.value = 'properties'
  nextTick(() => dialogRoot.value?.querySelector('input,button')?.focus())
}
function help() {
  dialog.value = 'help'
  nextTick(() => dialogRoot.value?.querySelector('button')?.focus())
}
function openFromDialog() {
  const item = selected.value
  dialog.value = null
  open(item)
}
function command({ detail }) {
  if (activeWindow.value !== 'documents' || dialog.value) return
  const actions = {
    open: () => open(selected.value),
    save: () => save(),
    properties: () => properties(),
    help,
    back,
    forward,
    up,
    home: () => navigate(DOCUMENTS_ROOT),
    search: toggleSearch,
    folders: togglePane,
    copy: copyName,
    tiles: () => (view.value = 'tiles'),
    list: () => (view.value = 'list'),
    name: () => (sort.value = 'name'),
    size: () => (sort.value = 'size')
  }
  actions[detail]?.()
}
function keydown(event) {
  if (activeWindow.value !== 'documents') return
  if (dialog.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialog.value = null
    }
    if (event.key === 'Tab') {
      const nodes = [...dialogRoot.value.querySelectorAll('input,button')]
      const i = nodes.indexOf(document.activeElement)
      if ((event.shiftKey && i <= 0) || (!event.shiftKey && i === nodes.length - 1)) {
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
    up()
  }
  if (event.altKey && event.key === 'Enter') {
    event.preventDefault()
    properties()
  }
  if (event.key === 'Escape') {
    query.value = ''
    notice.value = ''
  }
}
onMounted(() => {
  observer = new ResizeObserver(() => (width.value = root.value.clientWidth))
  observer.observe(root.value)
  window.addEventListener('documents-command', command)
  window.addEventListener('keydown', keydown)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('documents-command', command)
  window.removeEventListener('keydown', keydown)
})
</script>
<template>
  <div ref="root" class="xp-computer xp-documents" :class="{ 'computer-mobile-tasks': mobilePane }">
    <nav class="computer-toolbar" :aria-label="copy.title">
      <button :disabled="!canBack" :aria-label="copy.back" @click="back">
        <GiftIcon name="back" /><span>{{ copy.back }}</span></button
      ><button :disabled="!canForward" :aria-label="copy.forward" @click="forward"><GiftIcon name="forward" /></button
      ><button :aria-label="copy.up" @click="up"><GiftIcon name="up" /></button><i></i
      ><button :aria-label="copy.search" :aria-pressed="searchVisible" @click="toggleSearch">
        <BrowserIcon name="search" /><span>{{ copy.search }}</span></button
      ><button :aria-label="copy.folders" :aria-pressed="paneActive" @click="togglePane">
        <img src="/img/icons/windows-header-tools/open-folders.webp" alt="" /><span>{{ copy.folders }}</span></button
      ><i></i
      ><label class="documents-view-control"
        ><span>{{ copy.views }}</span
        ><select v-model="view" :aria-label="copy.views">
          <option value="tiles">{{ copy.tiles }}</option>
          <option value="list">{{ copy.list }}</option>
        </select></label
      >
    </nav>
    <form class="computer-address" @submit.prevent="go">
      <label for="documents-location">{{ copy.address }}</label>
      <div>
        <img src="/img/icons/documents/folder-docs-icon-sm.webp" alt="" /><input
          ref="addressField"
          id="documents-location"
          :value="address || path"
          @input="address = $event.target.value"
          @focus="$event.target.select()"
          :aria-label="copy.address"
          autocomplete="off"
        /><select :value="current" @change="navigate($event.target.value)" :aria-label="copy.location">
          <option v-for="folder in catalog.folders.values()" :key="folder.id" :value="folder.id">{{ catalog.path(folder.id) }}</option>
        </select>
      </div>
      <button type="submit"><img src="/img/icons/windows-header-tools/right-green-arrow-icon.webp" alt="" />{{ copy.go }}</button>
    </form>
    <div v-if="searchVisible" class="computer-search">
      <label for="documents-search">{{ copy.searchLabel }}</label><input id="documents-search" ref="searchField" v-model="query" type="search" /><button
        v-if="query"
        @click="query = ''"
      >
        {{ copy.reset }}
      </button>
    </div>
    <p v-if="notice" class="computer-search documents-notice" role="status">{{ notice }}</p>
    <div class="computer-body">
      <aside v-if="sidebar" class="computer-taskpane">
        <section v-for="section in ['tasks', 'places', 'details']" :key="section" class="computer-task-section">
          <button class="computer-task-heading" :aria-expanded="!collapsed[section]" @click="collapsed[section] = !collapsed[section]">
            {{ copy[section] }}<span aria-hidden="true">{{ collapsed[section] ? '⌄' : '⌃' }}</span>
          </button>
          <div v-show="!collapsed[section]" class="computer-task-content">
            <template v-if="section === 'tasks'"
              ><button :disabled="!selected" @click="open(selected)"><img src="/img/icons/windows-header-tools/folder-opening-icon.webp" alt="" />{{ copy.open }}</button
              ><button :disabled="!canDownload" @click="save()"><GiftIcon name="save" />{{ copy.download }}</button
              ><button :disabled="!selected" @click="copyName"><img src="/img/icons/contact/copy-icon.webp" alt="" />{{ copy.copyName }}</button
              ><button @click="properties()"><img src="/img/icons/info-icon.webp" alt="" />{{ copy.properties }}</button></template
            >
            <template v-else-if="section === 'places'"
              ><button @click="openWindow('computer')"><img src="/img/icons/my-computer.png" alt="" />{{ language === 'fr' ? 'Poste de travail' : 'My Computer' }}</button
              ><button v-if="current !== DOCUMENTS_ROOT" @click="navigate(DOCUMENTS_ROOT)">
                <img src="/img/icons/documents/folder-docs-icon-sm.webp" alt="" />{{ copy.title }}</button
              ><button @click="openWindow('myProjects')"><img src="/img/icons/projects/projects-icon-sm.webp" alt="" />{{ copy.projects }}</button
              ><button @click="openWindow('contact')"><img src="/img/icons/contact/email-icon-sm.webp" alt="" />Outlook Express</button></template
            >
            <template v-else
              ><div class="documents-detail-image" :class="{ 'documents-paper': selected?.kind === 'pdf' }">
                <img :src="selected?.icon || currentFolder.icon" alt="" />
              </div>
              <strong>{{ selected?.name || currentFolder.name }}</strong>
              <p>{{ selected?.type || copy.folder }}</p>
              <p v-if="selected?.bytes !== undefined">{{ size(selected.bytes) }}</p>
              <p v-if="selected?.count !== undefined">{{ selected.count }} {{ copy.items }}</p>
              <p v-if="selected?.issuer">{{ selected.issuer }}</p>
              <p v-if="selected?.issued">{{ selected.issued }}</p>
              <p v-if="selected?.description" class="documents-detail-description">{{ selected.description }}</p>
              <pre v-if="selected?.text" class="documents-text-preview">{{ selected.text.slice(0, 220) }}</pre>
              <p v-else-if="selected?.summary" class="documents-text-preview">{{ selected.summary }}</p>
              <p v-if="!selected">{{ currentFolder.description || profile.name }}</p></template
            >
          </div>
        </section>
      </aside>
      <main class="computer-content documents-content" :aria-label="query ? copy.search : path" @click.capture="mobilePane = false">
        <header class="documents-heading">
          <div class="documents-breadcrumb">
            <button @click="navigate(DOCUMENTS_ROOT)">{{ copy.title }}</button><template v-if="current !== DOCUMENTS_ROOT"
              ><span aria-hidden="true">›</span
              ><button v-if="currentFolder.parent !== DOCUMENTS_ROOT" @click="navigate(currentFolder.parent)">{{ catalog.folders.get(currentFolder.parent).name }}</button
              ><span v-if="currentFolder.parent !== DOCUMENTS_ROOT" aria-hidden="true">›</span><span>{{ currentFolder.name }}</span></template
            >
          </div>
          <div class="documents-folder-title">
            <div>
              <h1>{{ query ? copy.search : currentFolder.name }}</h1>
              <p>
                {{ profile.name }}<span v-if="current === DOCUMENTS_ROOT"> · {{ profile.title }}</span>
              </p>
            </div>
            <img :src="currentFolder.preview || currentFolder.icon" alt="" />
          </div>
          <div class="documents-sort">
            <span>{{ items.length }} {{ copy.items }}</span
            ><label
              >{{ copy.sort }}
              <select v-model="sort" :aria-label="copy.sort">
                <option value="name">{{ copy.sortName }}</option>
                <option value="size">{{ copy.sortSize }}</option>
              </select></label
            >
          </div>
        </header>
        <div v-if="view === 'list'" class="documents-table-heading">
          <button @click="sort = 'name'">{{ copy.name }}</button><span>{{ copy.type }}</span
          ><button @click="sort = 'size'">{{ copy.size }}</button>
        </div>
        <section v-for="group in groups" :key="group" v-show="groupItems(group).length" class="computer-group">
          <h2>{{ group === 'results' ? copy.search : copy[group] }}</h2>
          <div class="documents-items" :class="{ 'documents-list': view === 'list' }">
            <button
              v-for="item in groupItems(group)"
              :key="item.id"
              class="documents-item"
              :class="{ selected: selectedId === item.id }"
              :aria-label="item.name"
              :aria-pressed="selectedId === item.id"
              :title="item.description || item.name"
              @click="choose(item, $event)"
              @dblclick="open(item)"
              @keydown.enter.prevent="enter(item, $event)"
              @keydown.space.prevent="open(item)"
              @contextmenu.prevent="properties(item)"
            >
              <span class="documents-file-icon" :class="{ 'documents-shortcut': item.kind === 'shortcut', 'documents-badge-folder': item.preview }"
                ><img :src="item.icon" alt="" loading="lazy" /><img v-if="item.preview" :src="item.preview" alt="" class="documents-folder-badge" /></span
              ><span class="documents-file-name"
                >{{ item.name }}<small v-if="view === 'tiles'">{{ item.target ? `${item.count} ${copy.items}` : item.description || item.type }}</small></span
              ><span v-if="view === 'list'" class="documents-file-type">{{ item.type }}</span
              ><span v-if="view === 'list'" class="documents-file-size">{{ item.bytes !== undefined ? size(item.bytes) : '—' }}</span>
            </button>
          </div>
        </section>
        <div v-if="!items.length" class="computer-empty">
          <BrowserIcon name="search" />
          <p>{{ copy.empty }}</p>
          <button @click="query = ''">{{ copy.reset }}</button>
        </div>
      </main>
    </div>
    <footer class="computer-status">
      <span>{{ items.length }} {{ copy.items }}{{ selected ? ' · 1 ' + copy.selected : '' }}</span
      ><span :title="notice || selected?.name || copy.fileHint">{{ notice || selected?.name || copy.fileHint }}</span
      ><button v-if="selected" @click="open(selected)">{{ copy.open }}</button><button v-if="canDownload" @click="save()">{{ copy.download }}</button>
    </footer>
    <div v-if="dialog" class="computer-modal">
      <section ref="dialogRoot" class="computer-dialog" role="dialog" aria-modal="true" :aria-label="dialog === 'help' ? copy.helpTitle : copy.properties">
        <header>{{ dialog === 'help' ? copy.helpTitle : copy.properties }}<button aria-label="Close" @click="dialog = null">×</button></header>
        <div class="computer-dialog-inside">
          <div class="computer-property-body">
            <p v-if="dialog === 'help'">{{ copy.help }}</p>
            <template v-else
              ><div class="computer-property-item">
                <img :src="selected?.icon || currentFolder.icon" alt="" /><input
                  class="documents-property-name"
                  readonly
                  :value="selected?.name || currentFolder.name"
                  :aria-label="copy.name"
                  @focus="$event.target.select()"
                />
              </div>
              <dl>
                <dt>{{ copy.type }}</dt>
                <dd>{{ selected?.type || copy.folder }}</dd>
                <dt>{{ copy.location }}</dt>
                <dd>{{ catalog.path(selected?.parent || current) }}</dd>
                <template v-if="selected?.bytes !== undefined"
                  ><dt>{{ copy.size }}</dt>
                  <dd>{{ size(selected.bytes) }} ({{ selected.bytes }} B)</dd></template
                ><template v-if="selected?.issuer"
                  ><dt>{{ copy.issuer }}</dt>
                  <dd>{{ selected.issuer }}</dd>
                  <dt>{{ copy.issued }}</dt>
                  <dd>{{ selected.issued || copy.notProvided }}</dd></template
                >
              </dl>
              <p>{{ selected?.description || currentFolder.description }}</p>
              <p v-if="selected?.count !== undefined">{{ selected.count }} {{ copy.items }}</p>
              <div class="documents-property-actions">
                <button v-if="selected" class="xp-button" @click="openFromDialog">{{ copy.open }}</button><button v-if="canDownload" class="xp-button" @click="save()">
                  {{ copy.download }}
                </button>
              </div></template
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
