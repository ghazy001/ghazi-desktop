<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import playlist from '@/data/playlist-data.json'
import Player from './Player.vue'
import MediaIcon from './MediaIcon.vue'
const props = defineProps({ file: Object })
const isVideo = computed(() => props.file?.kind === 'video')
const mediaTracks = computed(() =>
  isVideo.value
    ? [
        {
          id: 'project-video',
          type: 'video',
          title: props.file.name,
          artist: props.file.projectName,
          album: '',
          src: props.file.src,
          cover: props.file.cover,
          duration: 0
        }
      ]
    : playlist.tracks
)
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
const player = ref(null)
const selected = ref(playlist.tracks[0].id)
const mode = ref('now')
const showPlaylist = ref(true)
const showArtwork = ref(false)
const artist = ref('')
const query = ref('')
const about = ref(false)
const current = computed(() => mediaTracks.value.find((track) => track.id === selected.value) || mediaTracks.value[0])
const artists = computed(() => [...new Set(mediaTracks.value.map((track) => track.artist))])
const mediaName = computed(() => (isVideo.value ? props.file.projectName : playlist.name[locale.currentLocale]))
const tracks = computed(() =>
  mediaTracks.value.filter(
    (track) => (!artist.value || track.artist === artist.value) && `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query.value.toLowerCase())
  )
)
watch(
  () => props.file,
  () => {
    mode.value = 'now'
    artist.value = ''
    query.value = ''
    showArtwork.value = false
    showPlaylist.value = !isVideo.value
    selected.value = mediaTracks.value[0].id
  },
  { immediate: true }
)
const formatTime = (value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`
const handleView = (event) => {
  if (event.detail === 'now' || event.detail === 'library') mode.value = event.detail
  if (event.detail === 'playlist') showPlaylist.value = !showPlaylist.value
  if (event.detail === 'about') about.value = true
}
onMounted(() => window.addEventListener('music-view', handleView))
onBeforeUnmount(() => window.removeEventListener('music-view', handleView))
</script>
<template>
  <div class="wmp8-app" @keydown.esc="about = false">
    <div class="wmp8-top">
      <svg class="wmp8-silver-wing" viewBox="0 0 106 44" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="wmp8-wing-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7d99db" />
            <stop offset="1" stop-color="#5b7cc5" />
          </linearGradient>
        </defs>
        <path d="M0 43C34 43 61 36 83 21C91 15 96 14 106 14V44H0Z" fill="url(#wmp8-wing-blue)" />
        <path d="M0 41C34 41 61 34 83 19C91 13 96 12 106 12" fill="none" stroke="#f3f4fb" stroke-width="1.5" />
        <path d="M0 43C34 43 61 36 83 21C91 15 96 14 106 14" fill="none" stroke="#637eb8" />
      </svg>
      <div class="wmp8-top-tools">
        <button class="wmp8-round-tool wmp8-switch" @click="mode = mode === 'now' ? 'library' : 'now'" aria-label="Switch between Now Playing and Media Library">
          <MediaIcon name="switch" />
        </button>
        <div class="wmp8-tools-right">
          <button class="wmp8-round-tool" @click="showArtwork = !showArtwork" :aria-pressed="showArtwork" aria-label="Show album artwork" title="Show album artwork">
            <MediaIcon name="artwork" /></button
          ><button class="wmp8-round-tool" @click="player.toggleShuffle()" :aria-pressed="player?.shuffle || false" aria-label="Shuffle" title="Shuffle">
            <MediaIcon name="shuffle" /></button
          ><button class="wmp8-round-tool playlist" @click="showPlaylist = !showPlaylist" :aria-pressed="showPlaylist" aria-label="Show playlist" title="Show playlist">
            <MediaIcon name="document" />
          </button>
        </div>
      </div>
      <label class="wmp8-playlist-select"
        ><svg class="wmp8-playlist-cap" viewBox="0 0 260 44" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="wmp8-cap-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#91acec" />
              <stop offset=".55" stop-color="#6e91df" />
              <stop offset="1" stop-color="#4a70bc" />
            </linearGradient>
          </defs>
          <path d="M0 44V23C12 23 14 1 34 1H260V44Z" fill="url(#wmp8-cap-blue)" />
          <path d="M0 23C12 23 14 1 34 1H260" fill="none" stroke="#d4e0ff" stroke-width="1.3" /></svg
        ><MediaIcon name="document" class="wmp8-playlist-document" /><select v-model="artist" aria-label="Playlist artist filter">
          <option value="">{{ mediaName }}</option>
          <option v-for="name in artists" :key="name" :value="name">{{ name }}</option>
        </select></label
      >
    </div>
    <div class="wmp8-middle">
      <nav class="wmp8-sidebar" :aria-label="french ? 'Navigation du lecteur' : 'Player navigation'">
        <div class="wmp8-sidebar-top"><span>⌃</span></div>
        <button :class="{ active: mode === 'now' }" @click="mode = 'now'" :aria-current="mode === 'now' ? 'page' : undefined">
          <span>{{ french ? 'Lecture' : 'Now' }}<br />{{ french ? 'en cours' : 'Playing' }}</span>
        </button>
        <button :class="{ active: mode === 'library' }" @click="mode = 'library'" :aria-current="mode === 'library' ? 'page' : undefined">
          {{ french ? 'Bibliothèque multimédia' : 'Media Library' }}
        </button>
        <div class="wmp8-sidebar-fill"></div>
        <div class="wmp8-sidebar-bottom"><span>⌄</span></div>
      </nav>
      <main class="wmp8-screen" :class="{ 'library-view': mode === 'library' }">
        <section v-show="mode === 'now'" class="wmp8-now" :class="{ 'wmp8-video-now': isVideo }" aria-label="Now Playing">
          <p class="wmp8-artist">{{ current.artist }}</p>
          <h1>{{ current.title }}</h1>
          <div id="wmp-video-host" v-show="isVideo" class="wmp8-video-host"></div>
          <p v-if="isVideo" class="wmp8-video-caption">{{ file.caption }}</p>
          <div v-if="showArtwork" class="wmp8-artwork"><img :src="current.cover" :alt="current.title + ' artwork'" /></div>
        </section>
        <section v-show="mode === 'library'" class="wmp8-library" aria-label="Media Library">
          <div class="wmp8-library-heading">
            <img src="/img/icons/music/windows-media-player.png" alt="" />
            <div>
              <h1>{{ french ? 'Bibliothèque multimédia' : 'Media Library' }}</h1>
              <p>{{ mediaTracks.length }} {{ french ? 'fichiers' : 'media files' }}</p>
            </div>
          </div>
          <label class="wmp8-search"
            >{{ french ? 'Rechercher' : 'Search' }}<input v-model="query" type="search" :aria-label="french ? 'Rechercher un titre' : 'Search music'"
          /></label>
          <div class="wmp8-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ french ? 'Titre' : 'Title' }}</th>
                  <th>{{ french ? 'Artiste' : 'Artist' }}</th>
                  <th>{{ french ? 'Durée' : 'Length' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="track in tracks" :key="track.id" :class="{ selected: selected === track.id }">
                  <td>
                    <button @click="player.playTrack(track.id)" :aria-label="'Play ' + track.title">
                      <img :src="track.cover" alt="" loading="lazy" />{{ track.title }}
                    </button>
                  </td>
                  <td>{{ track.artist }}</td>
                  <td>{{ formatTime(track.duration) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!tracks.length" class="wmp8-no-results" role="status">{{ french ? 'Aucun titre trouvé.' : 'No matching tracks.' }}</p>
          </div>
        </section>
        <aside v-if="showPlaylist" class="wmp8-queue" aria-label="Playlist">
          <button
            v-for="track in tracks"
            :key="track.id"
            @click="player.playTrack(track.id)"
            :class="{ current: selected === track.id }"
            :aria-current="selected === track.id ? 'true' : undefined"
          >
            <span class="wmp8-track-cross">+</span><span>{{ track.title }}</span>
          </button>
        </aside>
      </main>
    </div>
    <Player
      :key="file?.src || 'music'"
      ref="player"
      :playlist="mediaTracks"
      @track-change="selected = $event"
      @show-library="mode = 'library'"
      @toggle-playlist="showPlaylist = !showPlaylist"
    />
    <div class="wmp8-brand">
      <img src="/img/icons/windows-icon.webp" alt="" /><span>Windows<small>Media Player</small></span>
    </div>
    <div v-if="about" class="wmp8-dialog-overlay">
      <section class="wmp8-about" role="dialog" aria-modal="true" aria-label="About Windows Media Player">
        <h2>Windows Media Player<button @click="about = false" aria-label="Close">×</button></h2>
        <div>
          <img src="/img/icons/music/windows-media-player.png" alt="" width="48" height="48" />
          <p>{{ mediaName }}<br />{{ mediaTracks.length }} {{ french ? 'fichiers' : 'media files' }}</p>
        </div>
        <button class="xp-button" @click="about = false">OK</button>
      </section>
    </div>
  </div>
</template>
<style src="./media-player.css"></style>
