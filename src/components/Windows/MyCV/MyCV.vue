<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import profile from '@/data/profile-data.json'
import reader from '@/data/cv-reader-data.json'
import { useLocaleStore } from '@/stores/localeStore'
import ReaderIcon from './ReaderIcon.vue'
import { indexPdfText, findPdfMatches } from '@/lib/pdf-navigation.mjs'
import { readPdfTextContent } from '@/lib/pdf-text-content.mjs'
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
const openWindow = inject('openWindow')
const readerRoot = ref(null)
const stage = ref(null)
const searchInput = ref(null)
const pages = ref([])
const pageElements = new Map()
const pageText = new Map()
const currentPage = ref(1)
const pageInput = ref(1)
const editingPage = ref(false)
const scale = ref(1)
const zoomMode = ref('page')
const showPane = ref(window.innerWidth > 640)
const paneTab = ref('bookmarks')
const activeBookmark = ref('')
const loading = ref(true)
const rendering = ref(false)
const error = ref('')
const status = ref('')
const showStatus = ref(true)
const showSearch = ref(false)
const query = ref('')
const matchCount = ref(0)
const matchIndex = ref(-1)
let pdfjs,
  pdfDocument,
  loadingTask,
  resizeObserver,
  renderTimer,
  renderToken = 0
let renderChain = Promise.resolve()
let activeTasks = []
let textLayers = []
let matches = []
let destroyed = false
let printFrame = null
let wasNarrow = window.innerWidth <= 640
let requestedPage = 1
let navigationTarget = { type: 'page' }
let stageWidth = 0
let stageHeight = 0
const rememberStageSize = () => {
  stageWidth = stage.value.clientWidth
  stageHeight = stage.value.clientHeight
}
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
const label = (bookmark) => bookmark[locale.currentLocale] || bookmark.en
const fileName = profile.cv.filename
const attachElement = (number, el) => (el ? pageElements.set(number, el) : pageElements.delete(number))
const scrollToElement = (el) => {
  if (!el || !stage.value) return
  const bounds = el.getBoundingClientRect()
  const container = stage.value.getBoundingClientRect()
  stage.value.scrollTop += bounds.top - container.top - 12
  if (bounds.left < container.left || bounds.right > container.right) stage.value.scrollLeft += bounds.left - container.left - 12
}
const goPage = (value) => {
  const number = Math.max(1, Math.min(pages.value.length, Math.trunc(Number(value)) || 1))
  if (!pages.value.length) return
  currentPage.value = number
  pageInput.value = number
  requestedPage = number
  navigationTarget = { type: 'page' }
  activeBookmark.value = ''
  if (!rendering.value) {
    paintHighlights()
    scrollToElement(pageElements.get(number))
  }
}
const onPageInput = (event) => {
  const number = Number(event.target.value)
  if (Number.isInteger(number) && number >= 1 && number <= pages.value.length) goPage(number)
}
const finishPageInput = () => {
  editingPage.value = false
  goPage(pageInput.value)
}
const onScroll = () => {
  if (rendering.value || stage.value.clientWidth !== stageWidth || stage.value.clientHeight !== stageHeight) return
  const viewport = stage.value.getBoundingClientRect()
  let visiblePage = currentPage.value
  let largestVisibleArea = 0
  for (const page of pages.value) {
    const bounds = pageElements.get(page.number)?.getBoundingClientRect()
    if (bounds) {
      const visibleArea = Math.max(0, Math.min(bounds.bottom, viewport.bottom) - Math.max(bounds.top, viewport.top))
      if (visibleArea > largestVisibleArea) {
        visiblePage = page.number
        largestVisibleArea = visibleArea
      }
    }
  }
  const target = navigationMatch()
  if (target) visiblePage = target.page
  currentPage.value = visiblePage
  requestedPage = visiblePage
  if (!editingPage.value) pageInput.value = visiblePage
}
const rebuildMatches = (preserve = false) => {
  const previousIndex = matchIndex.value
  matches = findPdfMatches([...pageText.values()], query.value)
  matchCount.value = matches.length
  matchIndex.value = matches.length ? (preserve ? Math.max(0, Math.min(previousIndex, matches.length - 1)) : 0) : -1
}
const matchRanges = (match) => {
  const data = pageText.get(match?.page)
  if (!data?.divs) return []
  return match.segments.flatMap((segment) => {
    const node = data.divs[segment.item]?.firstChild
    if (!node || segment.end > node.textContent.length) return []
    const range = document.createRange()
    range.setStart(node, segment.start)
    range.setEnd(node, segment.end)
    return [range]
  })
}
const bookmarkMatch = () => {
  if (navigationTarget.type !== 'bookmark') return null
  const item = reader.bookmarks.find((entry) => entry.id === navigationTarget.id)
  const data = pageText.get(item?.page)
  return data ? findPdfMatches([data], item.match)[0] : null
}
const navigationMatch = () =>
  navigationTarget.type === 'search' ? matches[matchIndex.value] : navigationTarget.type === 'location' ? navigationTarget.match : bookmarkMatch()
const paintHighlights = () => {
  if (rendering.value) return
  for (const el of pageElements.values()) el.querySelector('.pdf-highlights')?.replaceChildren()
  const draw = (match, kind) => {
    const page = pageElements.get(match?.page)
    const container = page?.querySelector('.pdf-highlights')
    if (!container) return
    const origin = page.getBoundingClientRect()
    for (const range of matchRanges(match)) {
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue
        const mark = document.createElement('span')
        mark.className = `pdf-highlight ${kind}`
        mark.style.cssText = `left:${rect.left - origin.left}px;top:${rect.top - origin.top}px;width:${rect.width}px;height:${rect.height}px`
        container.append(mark)
      }
    }
  }
  matches.forEach((match, index) => draw(match, navigationTarget.type === 'search' && index === matchIndex.value ? 'pdf-match-active' : 'pdf-match'))
  const target = bookmarkMatch()
  if (target) draw(target, 'pdf-bookmark-highlight')
}
const restoreNavigation = () => {
  if (rendering.value) return
  const match = navigationMatch()
  if (match) {
    currentPage.value = requestedPage = match.page
    if (!editingPage.value) pageInput.value = match.page
    const range = matchRanges(match).find((entry) => entry.getBoundingClientRect().width)
    scrollToElement(range || pageElements.get(match.page))
  } else scrollToElement(pageElements.get(requestedPage))
}
const applySearch = () => {
  const previousTarget = navigationMatch()
  rebuildMatches()
  activeBookmark.value = ''
  navigationTarget = query.value.trim() ? { type: 'search' } : previousTarget ? { type: 'location', match: previousTarget } : { type: 'page' }
  paintHighlights()
  restoreNavigation()
}
const findNext = () => {
  if (!matches.length) return
  matchIndex.value = (matchIndex.value + 1) % matches.length
  navigationTarget = { type: 'search' }
  activeBookmark.value = ''
  paintHighlights()
  restoreNavigation()
}
const useManualScroll = () => {
  if (navigationTarget.type === 'page') return
  navigationTarget = { type: 'page' }
  activeBookmark.value = ''
  paintHighlights()
}
const onStageKeyDown = (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) useManualScroll()
}
const focusSearch = async () => {
  showSearch.value = true
  await nextTick()
  searchInput.value?.focus()
}
const closeSearch = () => {
  if (!showSearch.value) return
  showSearch.value = false
  query.value = ''
  applySearch()
}
const renderDocument = async (token) => {
  if (!pdfDocument || destroyed || token !== renderToken) return
  rendering.value = true
  const renderScale = scale.value
  try {
    for (const layer of textLayers) layer.cancel()
    textLayers = []
    // Lay out every page together so page 2 has its final scroll position
    // before the sequential drawing work starts.
    for (const record of pages.value) {
      record.width = record.baseWidth * renderScale
      record.height = record.baseHeight * renderScale
    }
    await nextTick()
    for (const record of pages.value) {
      if (token !== renderToken || destroyed) return
      const page = await pdfDocument.getPage(record.number)
      const viewport = page.getViewport({ scale: renderScale })
      if (token !== renderToken || destroyed) return
      const el = pageElements.get(record.number)
      if (!el) continue
      // Keep the previous page visible if a resize cancels this draw.
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const dpi = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.ceil(viewport.width * dpi)
      canvas.height = Math.ceil(viewport.height * dpi)
      const task = page.render({ canvasContext: context, viewport, transform: dpi === 1 ? null : [dpi, 0, 0, dpi, 0, 0] })
      activeTasks = [task]
      await task.promise
      if (token !== renderToken || destroyed) return
      const visibleCanvas = el.querySelector('canvas')
      visibleCanvas.width = canvas.width
      visibleCanvas.height = canvas.height
      visibleCanvas.getContext('2d').drawImage(canvas, 0, 0)
      const textContainer = el.querySelector('.pdf-text')
      textContainer.replaceChildren()
      const data = pageText.get(record.number)
      const content = data.content
      const layer = new pdfjs.TextLayer({ textContentSource: content, container: textContainer, viewport })
      textLayers.push(layer)
      await layer.render()
      data.divs = layer.textDivs
      const annotations = await page.getAnnotations()
      record.links = annotations
        .filter((a) => a.subtype === 'Link' && a.url && /^(https?:|mailto:)/i.test(a.url))
        .map((a) => {
          const rect = viewport.convertToViewportRectangle(a.rect)
          return {
            url: a.url,
            left: Math.min(rect[0], rect[2]),
            top: Math.min(rect[1], rect[3]),
            width: Math.abs(rect[2] - rect[0]),
            height: Math.abs(rect[3] - rect[1])
          }
        })
      const thumb = document.createElement('canvas')
      thumb.width = 120
      thumb.height = Math.round((canvas.height * 120) / canvas.width)
      thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height)
      record.thumbnail = thumb.toDataURL('image/png')
    }
    if (token === renderToken) {
      error.value = ''
      rendering.value = false
      paintHighlights()
      restoreNavigation()
    }
  } catch (cause) {
    if (cause.name !== 'RenderingCancelledException' && token === renderToken && !destroyed)
      error.value = french.value ? 'Impossible d’afficher le PDF.' : 'The PDF could not be displayed.'
  } finally {
    if (token === renderToken) {
      rendering.value = false
      activeTasks = []
    }
  }
}
const queueRender = () => {
  clearTimeout(renderTimer)
  rememberStageSize()
  const token = ++renderToken
  rendering.value = true
  for (const task of activeTasks) task.cancel()
  for (const layer of textLayers) layer.cancel()
  renderTimer = setTimeout(() => {
    renderChain = renderChain.catch(() => {}).then(() => renderDocument(token))
  }, 80)
}
const fit = (mode = zoomMode.value) => {
  if (!stage.value || !pages.value.length || stage.value.clientWidth === 0 || stage.value.clientHeight === 0) return
  zoomMode.value = mode
  const first = pages.value[0]
  // clientWidth rounds fractional layout pixels. Leave a small inset so a
  // fitted page cannot toggle the horizontal scrollbar and restart fitting.
  const width = Math.max(90, Math.floor(stage.value.clientWidth - 34)) / first.baseWidth
  const height = Math.max(90, Math.floor(stage.value.clientHeight - 32)) / first.baseHeight
  const fittedScale = Math.max(0.15, Math.min(3, mode === 'page' ? Math.min(width, height) : width))
  if (Math.abs(scale.value - fittedScale) < 0.001 && pages.value.every((record) => record.thumbnail)) {
    const sizeChanged = stage.value.clientWidth !== stageWidth || stage.value.clientHeight !== stageHeight
    rememberStageSize()
    if (sizeChanged) restoreNavigation()
    return
  }
  scale.value = fittedScale
  queueRender()
}
const zoom = (delta) => {
  zoomMode.value = 'custom'
  scale.value = Math.max(0.25, Math.min(3, Math.round((scale.value + delta) * 100) / 100))
  queueRender()
}
const togglePane = async (tab = 'bookmarks') => {
  showPane.value = paneTab.value !== tab || !showPane.value
  paneTab.value = tab
  await nextTick()
  if (zoomMode.value !== 'custom') fit()
}
const bookmark = (item) => {
  if (!item) return
  activeBookmark.value = item.id
  currentPage.value = requestedPage = item.page
  pageInput.value = item.page
  navigationTarget = { type: 'bookmark', id: item.id }
  paintHighlights()
  restoreNavigation()
}
const print = async () => {
  if (!pdfDocument || rendering.value) return
  status.value = french.value ? 'Préparation de l’impression…' : 'Preparing to print…'
  try {
    const images = []
    for (let number = 1; number <= pdfDocument.numPages; number++) {
      const page = await pdfDocument.getPage(number)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      images.push(canvas.toDataURL('image/png'))
    }
    if (destroyed) return
    printFrame?.remove()
    printFrame = document.createElement('iframe')
    printFrame.title = 'Print original CV pages'
    printFrame.style.cssText = 'position:fixed;width:0;height:0;border:0;'
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.onload = () => {
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()
    }
    printFrame.srcdoc = `<!doctype html><html><head><title>${fileName}</title><style>@page{size:A4;margin:0}body{margin:0}img{display:block;width:210mm;height:297mm;break-after:page}img:last-child{break-after:auto}</style></head><body>${images.map((src) => `<img src="${src}" alt="CV page">`).join('')}</body></html>`
    document.body.append(printFrame)
    status.value = ''
  } catch {
    status.value = french.value ? 'Téléchargez le PDF pour l’imprimer.' : 'Download the PDF to print it.'
  }
}
const command = ({ detail }) => {
  if (detail === 'previous') goPage(currentPage.value - 1)
  else if (detail === 'next') goPage(currentPage.value + 1)
  else if (detail === 'first') goPage(1)
  else if (detail === 'last') goPage(pages.value.length)
  else if (detail === 'in') zoom(0.15)
  else if (detail === 'out') zoom(-0.15)
  else if (detail === 'actual') {
    scale.value = 1
    zoomMode.value = 'custom'
    queueRender()
  } else if (['width', 'page'].includes(detail)) fit(detail)
  else if (['bookmarks', 'thumbnails'].includes(detail)) togglePane(detail)
  else if (detail === 'find') focusSearch()
  else if (detail === 'print') print()
  else if (detail === 'status') showStatus.value = !showStatus.value
  else if (detail === 'help') status.value = french.value ? 'CV original · PDF en anglais · 2 pages' : 'Original CV · English PDF · 2 pages'
  else if (detail?.bookmark) bookmark(reader.bookmarks.find((item) => item.id === detail.bookmark))
}
onMounted(async () => {
  window.addEventListener('pdf-reader-command', command)
  try {
    // PDF.js documents Safari support for its compatibility build. Keep the
    // reader and worker on the same bundled version for every browser.
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
    if (destroyed) return
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    loadingTask = pdfjs.getDocument(profile.cv.url)
    pdfDocument = await loadingTask.promise
    if (destroyed) return
    const records = []
    for (let number = 1; number <= pdfDocument.numPages; number++) {
      const page = await pdfDocument.getPage(number)
      const viewport = page.getViewport({ scale: 1 })
      const content = await readPdfTextContent(page)
      pageText.set(number, { number, content, index: indexPdfText(content.items), divs: [] })
      records.push({ number, baseWidth: viewport.width, baseHeight: viewport.height, width: viewport.width, height: viewport.height, thumbnail: '', links: [] })
    }
    pages.value = records
    rebuildMatches(true)
    loading.value = false
    await nextTick()
    wasNarrow = readerRoot.value.clientWidth <= 640
    if (wasNarrow) showPane.value = false
    await nextTick()
    fit('page')
    resizeObserver = new ResizeObserver(() => {
      if (!readerRoot.value.clientWidth || !stage.value.clientHeight) return
      const narrow = readerRoot.value.clientWidth <= 640
      if (narrow && !wasNarrow) showPane.value = false
      wasNarrow = narrow
      if (zoomMode.value !== 'custom') fit()
      else {
        rememberStageSize()
        restoreNavigation()
      }
    })
    resizeObserver.observe(stage.value)
  } catch (cause) {
    if (!destroyed) {
      loading.value = false
      error.value = french.value ? 'Impossible de charger le CV.' : 'The CV could not be loaded.'
      console.error('CV PDF loading failed:', cause)
    }
  }
})
onBeforeUnmount(() => {
  destroyed = true
  renderToken++
  clearTimeout(renderTimer)
  resizeObserver?.disconnect()
  for (const task of activeTasks) task.cancel()
  for (const layer of textLayers) layer.cancel()
  loadingTask?.destroy()
  printFrame?.remove()
  window.removeEventListener('pdf-reader-command', command)
})
</script>
<template>
  <div ref="readerRoot" class="pdf-reader" @keydown.ctrl.f.prevent="focusSearch" @keydown.meta.f.prevent="focusSearch" @keydown.esc="closeSearch">
    <div class="pdf-toolbar" role="toolbar" aria-label="PDF reader toolbar">
      <a :href="profile.cv.url" target="_blank" rel="noopener noreferrer" class="pdf-tool" aria-label="Open original PDF" title="Open original PDF"
        ><ReaderIcon name="open"
      /></a>
      <a :href="profile.cv.url" :download="fileName" class="pdf-tool" aria-label="Download CV" title="Save a copy"><ReaderIcon name="save" /></a>
      <button class="pdf-tool" @click="print" :disabled="loading || rendering" aria-label="Print CV" title="Print"><ReaderIcon name="print" /></button>
      <span class="pdf-divider"></span
      ><button class="pdf-tool" @click="openWindow('contact')" aria-label="Email Ghazi" title="Email Ghazi"><ReaderIcon name="mail" /></button>
      <span class="pdf-divider"></span>
      <button class="pdf-tool" @click="goPage(currentPage - 1)" :disabled="loading || currentPage <= 1" aria-label="Previous page" title="Previous page">
        <ReaderIcon name="previous" />
      </button>
      <button class="pdf-tool" @click="goPage(currentPage + 1)" :disabled="loading || currentPage >= pages.length" aria-label="Next page" title="Next page">
        <ReaderIcon name="next" />
      </button>
      <form class="pdf-page-control" @submit.prevent="goPage(pageInput)">
        <input
          v-model="pageInput"
          :disabled="loading"
          type="number"
          min="1"
          :max="pages.length || 1"
          aria-label="Page number"
          @focus="editingPage = true"
          @input="onPageInput"
          @blur="finishPageInput"
        /><span>/ {{ pages.length || '…' }}</span>
      </form>
      <span class="pdf-divider"></span>
      <button class="pdf-tool" @click="zoom(-0.15)" :disabled="loading || scale <= 0.25" aria-label="Zoom out" title="Zoom out"><ReaderIcon name="minus" /></button>
      <button class="pdf-tool" @click="zoom(0.15)" :disabled="loading || scale >= 3" aria-label="Zoom in" title="Zoom in"><ReaderIcon name="plus" /></button>
      <span class="pdf-divider"></span>
      <button class="pdf-tool" @click="fit('width')" :aria-pressed="zoomMode === 'width'" :disabled="loading" aria-label="Fit width" title="Fit width">
        <ReaderIcon name="width" />
      </button>
      <button class="pdf-tool" @click="fit('page')" :aria-pressed="zoomMode === 'page'" :disabled="loading" aria-label="Fit page" title="Fit page">
        <ReaderIcon name="page" />
      </button>
      <button
        class="pdf-tool"
        @click="togglePane('thumbnails')"
        :aria-pressed="showPane && paneTab === 'thumbnails'"
        aria-label="Page thumbnails"
        title="Page thumbnails"
      >
        <ReaderIcon name="grid" />
      </button>
      <button class="pdf-tool" @click="focusSearch" :aria-pressed="showSearch" aria-label="Find in CV" title="Find"><ReaderIcon name="search" /></button>
    </div>
    <form v-if="showSearch" class="pdf-findbar" @submit.prevent="findNext">
      <label for="pdf-find">{{ french ? 'Rechercher :' : 'Find:' }}</label><input
        id="pdf-find"
        ref="searchInput"
        v-model="query"
        @input="applySearch"
        autocomplete="off"
      /><button class="xp-button" type="submit" :disabled="!matchCount">
        {{ french ? 'Suivant' : 'Find Next' }}</button
      ><span role="status" aria-live="polite">{{
        query.trim() ? (matchCount ? matchIndex + 1 + ' / ' + matchCount : french ? 'Aucun résultat' : 'No matches') : ''
      }}</span
      ><button class="pdf-find-close" type="button" @click="closeSearch" aria-label="Close search">×</button>
    </form>
    <div class="pdf-main">
      <aside v-if="showPane" class="pdf-sidebar" :aria-label="paneTab === 'bookmarks' ? 'CV bookmarks' : 'Page thumbnails'">
        <div class="pdf-pane-heading">
          <button class="pdf-book-tab" @click="paneTab = 'bookmarks'" aria-label="Show bookmarks"><ReaderIcon name="book" /></button
          ><span>{{ paneTab === 'bookmarks' ? (french ? 'Signets' : 'Bookmarks') : french ? 'Pages' : 'Pages' }}</span
          ><button class="pdf-pane-close" @click="togglePane(paneTab)" aria-label="Close navigation pane">×</button>
        </div>
        <div class="pdf-pane-body">
          <div class="pdf-pane-rail">
            <button @click="paneTab = 'bookmarks'" :aria-pressed="paneTab === 'bookmarks'" aria-label="Bookmarks"><ReaderIcon name="bookmark" /></button
            ><button @click="paneTab = 'thumbnails'" :aria-pressed="paneTab === 'thumbnails'" aria-label="Thumbnails"><ReaderIcon name="grid" /></button>
          </div>
          <nav v-if="paneTab === 'bookmarks'" class="pdf-bookmark-tree" aria-label="CV sections">
            <button class="pdf-root-bookmark" @click="goPage(1)">
              <ReaderIcon name="bookmark" /><span>{{ fileName }}</span></button
            ><button
              v-for="item in reader.bookmarks"
              :key="item.id"
              class="pdf-bookmark"
              :aria-current="activeBookmark === item.id ? 'location' : undefined"
              @click="bookmark(item)"
            >
              <span class="pdf-tree-branch"></span><ReaderIcon name="bookmark" /><span>{{ label(item) }}</span>
            </button>
          </nav>
          <nav v-else class="pdf-thumbnails" aria-label="PDF pages">
            <button v-for="page in pages" :key="page.number" @click="goPage(page.number)" :aria-current="currentPage === page.number ? 'page' : undefined">
              <img v-if="page.thumbnail" :src="page.thumbnail" :alt="'CV page ' + page.number" /><span>{{ page.number }}</span>
            </button>
          </nav>
        </div>
      </aside>
      <button v-else class="pdf-reopen-pane" @click="togglePane('bookmarks')" aria-label="Open bookmarks" title="Bookmarks"><ReaderIcon name="book" /></button>
      <main
        ref="stage"
        class="pdf-workspace"
        tabindex="0"
        aria-label="Original CV PDF pages"
        @scroll.passive="onScroll"
        @wheel.passive="useManualScroll"
        @pointerdown="useManualScroll"
        @keydown="onStageKeyDown"
      >
        <div v-if="loading || error" class="pdf-notice" role="status">
          <img src="/img/icons/cv/adobe-pdf.png" alt="" />
          <p>{{ error || (french ? 'Ouverture du CV…' : 'Opening CV…') }}</p>
          <a v-if="error" :href="profile.cv.url" target="_blank" rel="noopener noreferrer">{{ french ? 'Ouvrir le PDF' : 'Open original PDF' }}</a>
        </div>
        <div class="pdf-pages">
          <section
            v-for="page in pages"
            :key="page.number"
            :ref="(el) => attachElement(page.number, el)"
            class="pdf-sheet"
            :style="{ width: page.width + 'px', height: page.height + 'px', '--total-scale-factor': scale }"
            :aria-label="'CV page ' + page.number"
          >
            <canvas aria-hidden="true"></canvas>
            <div class="pdf-text"></div>
            <div class="pdf-highlights" aria-hidden="true"></div>
            <a
              v-for="link in page.links"
              :key="link.url + link.top"
              class="pdf-link"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="link.url"
              :style="{ left: link.left + 'px', top: link.top + 'px', width: link.width + 'px', height: link.height + 'px' }"
            ></a>
          </section>
        </div>
      </main>
    </div>
    <footer v-if="showStatus" class="pdf-statusbar">
      <span role="status" aria-live="polite">{{ status || (loading || rendering ? (french ? 'Chargement…' : 'Loading…') : french ? 'Terminé' : 'Ready') }}</span><span
        >{{ currentPage }} / {{ pages.length || '…' }}</span
      ><span>{{ zoomLabel }}</span
      ><span>PDF · English</span><i></i>
    </footer>
  </div>
</template>
<style src="./pdf-reader.css"></style>
