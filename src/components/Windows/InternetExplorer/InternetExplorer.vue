<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import profile from '@/data/profile-data.json'
import configuration from '@/data/browser-data.json'
import favorites from '@/data/browser-links.js'
import { normalizeWebAddress, frameRestriction } from '@/lib/internet-explorer.mjs'
import { useLocaleStore } from '@/stores/localeStore'
import BrowserIcon from './BrowserIcon.vue'
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
const home = { name: profile.name, url: normalizeWebAddress(profile.website, profile.website), icon: '/img/icons/explorer-icon-sm.webp' }
const pageTitle = inject('browserPageTitle', ref(profile.name))
const pageLocation = inject('browserLocation', ref(home.url))
const address = ref(home.url)
const addressInput = ref(null)
const history = ref([home])
const position = ref(0)
const current = computed(() => history.value[position.value])
const restriction = computed(() => frameRestriction(current.value.url, configuration.frameRestrictions))
const loading = ref(true)
const stopped = ref(false)
const failed = ref(false)
const message = ref('')
const frameKey = ref(0)
const linksVisible = ref(true)
const pane = ref('')
const about = ref(false)
const printing = ref(false)
const canBack = computed(() => position.value > 0)
const canForward = computed(() => position.value < history.value.length - 1)
const visited = computed(() => [...new Map(history.value.map((page) => [page.url, page])).values()].reverse())
const status = computed(
  () =>
    message.value ||
    (restriction.value
      ? french.value
        ? 'Ouverture dans une fenêtre distincte disponible.'
        : 'This website can be opened in a separate browser window.'
      : loading.value
        ? french.value
          ? 'Ouverture de la page…'
          : 'Opening page…'
        : french.value
          ? 'Terminé'
          : 'Done')
)
const start = () => {
  pageTitle.value = current.value.name
  pageLocation.value = current.value.url
  address.value = current.value.url
  loading.value = !restriction.value
  stopped.value = false
  failed.value = false
  message.value = ''
  frameKey.value++
}
const navigate = (value, label) => {
  try {
    const url = normalizeWebAddress(value, home.url)
    const name = label || profile.links.find((link) => normalizeWebAddress(link.url, home.url) === url)?.name || new URL(url).hostname
    if (url !== current.value.url) {
      history.value = history.value.slice(0, position.value + 1)
      history.value.push({ name, url })
      position.value++
    }
    start()
  } catch {
    message.value = french.value ? 'Entrez une adresse Web HTTP ou HTTPS valide.' : 'Please enter a valid HTTP or HTTPS website address.'
  }
}
const back = () => {
  if (canBack.value) {
    position.value--
    start()
  }
}
const forward = () => {
  if (canForward.value) {
    position.value++
    start()
  }
}
const stop = () => {
  if (loading.value) {
    stopped.value = true
    loading.value = false
    message.value = french.value ? 'Navigation annulée.' : 'Navigation canceled.'
  }
}
const focusAddress = () => {
  addressInput.value?.focus()
  addressInput.value?.select()
}
const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(current.value.url)
    message.value = french.value ? 'Adresse copiée.' : 'Address copied.'
  } catch {
    focusAddress()
  }
}
const closeDialogs = () => {
  about.value = false
  printing.value = false
}
const frameError = () => {
  loading.value = false
  failed.value = true
}
const handleCommand = (event) => {
  const command = event.detail
  if (typeof command === 'object' && command.url) {
    navigate(command.url, command.name)
    return
  }
  if (command === 'back') back()
  if (command === 'forward') forward()
  if (command === 'home') navigate(home.url, home.name)
  if (command === 'refresh') start()
  if (command === 'stop') stop()
  if (command === 'address') focusAddress()
  if (command === 'copy') copyAddress()
  if (command === 'favorites') pane.value = pane.value === 'favorites' ? '' : 'favorites'
  if (command === 'history') pane.value = pane.value === 'history' ? '' : 'history'
  if (command === 'links') linksVisible.value = !linksVisible.value
  if (command === 'about') about.value = true
}
onMounted(() => {
  start()
  window.addEventListener('browser-command', handleCommand)
})
onBeforeUnmount(() => window.removeEventListener('browser-command', handleCommand))
</script>
<template>
  <div class="ie-app" @keydown.esc="closeDialogs" @keydown.ctrl.l.prevent="focusAddress" @keydown.alt.left.prevent="back" @keydown.alt.right.prevent="forward">
    <div class="ie-toolbar" role="toolbar" aria-label="Internet Explorer toolbar">
      <span class="ie-grip"></span>
      <button class="ie-tool ie-history-tool" @click="back" :disabled="!canBack" aria-label="Back" title="Back">
        <img src="/img/icons/windows-header-tools/right-arrow-green-icon.webp" alt="" /><span class="ie-drop"></span>
      </button>
      <button class="ie-tool ie-history-tool" @click="forward" :disabled="!canForward" aria-label="Forward" title="Forward">
        <img src="/img/icons/windows-header-tools/left-arrow-green-icon.webp" alt="" /><span class="ie-drop"></span>
      </button>
      <button class="ie-tool" @click="stop" :disabled="!loading" aria-label="Stop loading" title="Stop">
        <img src="/img/icons/windows-header-tools/document-error-icon.webp" alt="" />
      </button>
      <button class="ie-tool" @click="start" aria-label="Refresh" title="Refresh"><img src="/img/icons/windows-header-tools/document-refresh-icon.webp" alt="" /></button>
      <button class="ie-tool" @click="navigate(home.url, home.name)" aria-label="Home" title="Home"><BrowserIcon name="home" /></button>
      <span class="ie-separator"></span
      ><button class="ie-tool" @click="pane = pane === 'favorites' ? '' : 'favorites'" :aria-pressed="pane === 'favorites'" aria-label="Favorites" title="Favorites">
        <BrowserIcon name="favorites" />
      </button>
      <button class="ie-tool" @click="pane = pane === 'history' ? '' : 'history'" :aria-pressed="pane === 'history'" aria-label="History" title="History">
        <BrowserIcon name="history" />
      </button>
      <span class="ie-separator"></span><button class="ie-tool" @click="printing = true" aria-label="Print page" title="Print"><BrowserIcon name="print" /></button>
      <a
        class="ie-tool ie-open-browser"
        :href="current.url"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open page in browser"
        :title="french ? 'Ouvrir dans le navigateur' : 'Open in browser'"
        ><BrowserIcon name="external"
      /></a>
    </div>
    <form class="ie-addressbar" @submit.prevent="navigate(address)">
      <span class="ie-grip"></span><label for="ie-web-address" class="ie-address-label">{{ french ? 'Adresse' : 'Address' }}</label>
      <div class="ie-address-input">
        <img src="/img/icons/explorer-icon-xs.webp" alt="" /><input
          id="ie-web-address"
          ref="addressInput"
          v-model="address"
          type="text"
          autocomplete="off"
          spellcheck="false"
          aria-label="Website address"
        /><button type="button" @click="pane = pane === 'history' ? '' : 'history'" aria-label="Address history" class="ie-address-history">
          <img src="/img/icons/windows-header-tools/down-icon.webp" alt="" />
        </button>
      </div>
      <button type="submit" class="ie-go"><img src="/img/icons/windows-header-tools/right-green-arrow-icon.webp" alt="" />{{ french ? 'OK' : 'Go' }}</button>
    </form>
    <nav v-if="linksVisible" class="ie-links" :aria-label="french ? 'Liens favoris' : 'Favorites links'">
      <span class="ie-grip"></span
      ><button v-for="link in favorites" :key="link.url" @click="navigate(link.url, link.name)" :title="link.url"><img :src="link.icon" alt="" />{{ link.name }}</button
      ><button class="ie-links-more" @click="pane = pane === 'favorites' ? '' : 'favorites'" aria-label="Show all favorites">»</button>
    </nav>
    <div class="ie-browser-area">
      <aside v-if="pane" class="ie-side-pane">
        <div class="ie-pane-heading">
          <strong>{{ pane === 'favorites' ? (french ? 'Favoris' : 'Favorites') : french ? 'Historique' : 'History' }}</strong
          ><button @click="pane = ''" aria-label="Close sidebar">×</button>
        </div>
        <div class="ie-pane-items">
          <button v-for="page in pane === 'favorites' ? favorites : visited" :key="page.url" @click="navigate(page.url, page.name)">
            <img :src="page.icon || '/img/icons/explorer-icon-xs.webp'" alt="" /><span>{{ page.name }}</span>
          </button>
        </div>
      </aside>
      <main class="ie-document">
        <section v-if="restriction || stopped || failed" class="ie-error-page">
          <div class="ie-error-heading">
            <img src="/img/icons/explorer-icon-lg.webp" alt="" />
            <h1>
              {{
                restriction
                  ? french
                    ? 'Ce site doit être ouvert dans votre navigateur'
                    : 'This website must open in your browser'
                  : french
                    ? 'La page n’a pas été chargée'
                    : 'The page was not loaded'
              }}
            </h1>
          </div>
          <hr />
          <p v-if="restriction">
            {{ restriction.name }}
            {{ french ? 'n’autorise pas l’affichage de ses pages dans un autre site.' : 'does not allow its pages to be displayed inside another website.' }}
          </p>
          <p v-else>
            {{
              stopped
                ? french
                  ? 'Vous avez interrompu cette navigation.'
                  : 'You stopped this navigation.'
                : french
                  ? 'La connexion à cette page a échoué.'
                  : 'The connection to this page failed.'
            }}
          </p>
          <p class="ie-page-url">{{ current.url }}</p>
          <div class="ie-error-actions">
            <a class="xp-button" :href="current.url" target="_blank" rel="noopener noreferrer">{{ french ? 'Ouvrir le site' : 'Open Website' }}</a
            ><button v-if="!restriction" class="xp-button" @click="start">{{ french ? 'Réessayer' : 'Try Again' }}</button
            ><button class="xp-button" @click="navigate(home.url, home.name)">{{ french ? 'Page d’accueil' : 'Home Page' }}</button>
          </div>
        </section>
        <iframe
          v-else
          :key="frameKey"
          :src="current.url"
          :title="current.name + ' — live website'"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          referrerpolicy="strict-origin-when-cross-origin"
          @load="loading = false"
          @error="frameError"
        ></iframe>
        <div v-if="loading" class="ie-loading" role="status">
          <img src="/img/icons/explorer-icon-sm.webp" alt="" />{{ french ? 'Ouverture…' : 'Opening…' }}
          <a :href="current.url" target="_blank" rel="noopener noreferrer">{{ french ? 'Ouvrir dans le navigateur' : 'Open in browser' }}</a>
        </div>
      </main>
    </div>
    <footer class="ie-statusbar">
      <span role="status" aria-live="polite">{{ status }}</span
      ><span v-if="loading" class="ie-progress"><i></i><i></i><i></i><i></i><i></i></span
      ><span class="ie-zone"><img src="/img/icons/explorer-icon-xs.webp" alt="" />Internet</span><span class="ie-resize-grip"></span>
    </footer>
    <div v-if="about || printing" class="ie-dialog-shade">
      <section class="ie-dialog" role="dialog" aria-modal="true" :aria-label="printing ? 'Print page' : 'About Internet Explorer'">
        <h2>{{ printing ? (french ? 'Imprimer' : 'Print') : 'Internet Explorer' }}<button @click="closeDialogs" aria-label="Close">×</button></h2>
        <div class="ie-dialog-body">
          <img :src="printing ? '/img/icons/side-menu/print-picture-icon.webp' : '/img/icons/explorer-icon-lg.webp'" alt="" />
          <p>
            {{
              printing
                ? french
                  ? 'Ouvrez le site dans votre navigateur, puis choisissez Imprimer.'
                  : 'Open this website in your browser, then choose Print.'
                : french
                  ? 'Explorez les sites de Ghazi Saoudi depuis son bureau Windows XP.'
                  : 'Explore Ghazi Saoudi’s websites from his Windows XP desktop.'
            }}
          </p>
        </div>
        <div class="ie-dialog-actions">
          <a v-if="printing" class="xp-button" :href="current.url" target="_blank" rel="noopener noreferrer" @click="printing = false">{{
            french ? 'Ouvrir le site' : 'Open Website'
          }}</a
          ><button class="xp-button" @click="closeDialogs">OK</button>
        </div>
      </section>
    </div>
  </div>
</template>
<style src="./internet-explorer.css"></style>
