<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import profile from '@/data/profile-data.json'
import browserLinks from '@/data/browser-links.js'
import cvReader from '@/data/cv-reader-data.json'
const props = defineProps({ id: String, dropdownItems: { type: Array, default: () => [] }, windowsHeaderLogo: { type: Boolean, default: true } })
const emit = defineEmits(['close', 'minimize', 'maximize'])
const openWindow = inject('openWindow')
const browserLocation = inject('browserLocation', ref(profile.website))
const active = ref(null)
const menu = ref(null)
const close = (e) => {
  if (!menu.value?.contains(e.target)) active.value = null
}
onMounted(() => document.addEventListener('pointerdown', close))
onUnmounted(() => document.removeEventListener('pointerdown', close))
const run = (action) => {
  active.value = null
  action()
}
const selectText = () => {
  const area = document.getElementById(props.id)?.querySelector('textarea, main, article, .xp-content')
  if (!area) return
  if (area.select) {
    area.focus()
    area.select()
  } else {
    const range = document.createRange()
    range.selectNodeContents(area)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
const saveNotes = () => {
  const text = document.getElementById(props.id)?.querySelector('textarea')?.value || ''
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = document.getElementById(props.id)?.querySelector('textarea')?.dataset.filename || 'Notes.txt'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const actions = computed(() => {
  const name = (props.dropdownItems[active.value] || '').toLowerCase()
  if (props.id === 'documents') {
    const fr = props.dropdownItems.includes('Fichier')
    const item = (en, french, detail) => ({ name: fr ? french : en, action: () => window.dispatchEvent(new CustomEvent('documents-command', { detail })) })
    if (['file', 'fichier'].includes(name))
      return [
        item('Open', 'Ouvrir', 'open'),
        item('Save a Copy…', 'Enregistrer une copie…', 'save'),
        item('Properties', 'Propriétés', 'properties'),
        { name: fr ? 'Fermer' : 'Close', action: () => emit('close') }
      ]
    if (['edit', 'édition'].includes(name)) return [item('Copy Filename', 'Copier le nom du fichier', 'copy'), item('Search…', 'Rechercher…', 'search')]
    if (['view', 'affichage'].includes(name))
      return [
        item('Tiles', 'Mosaïques', 'tiles'),
        item('Details', 'Détails', 'list'),
        item('Sort by Name', 'Trier par nom', 'name'),
        item('Sort by Size', 'Trier par taille', 'size'),
        item('Show / Hide Task Pane', 'Afficher / masquer le volet', 'folders'),
        item('Back', 'Retour', 'back'),
        item('Forward', 'Suivant', 'forward'),
        item('Up', 'Dossier parent', 'up')
      ]
    if (['favorites', 'favoris'].includes(name))
      return [item('My Documents', 'Mes documents', 'home'), { name: fr ? 'Mon CV' : 'My CV', action: () => openWindow('myCV') }]
    if (['tools', 'outils'].includes(name))
      return [
        { name: fr ? 'Poste de travail' : 'My Computer', action: () => openWindow('computer') },
        { name: 'Outlook Express', action: () => openWindow('contact') }
      ]
    return [item('Help Topics', 'Rubriques d’aide', 'help')]
  }
  if (props.id === 'computer') {
    const fr = props.dropdownItems.includes('Fichier')
    const item = (en, french, detail) => ({ name: fr ? french : en, action: () => window.dispatchEvent(new CustomEvent('computer-command', { detail })) })
    if (['file', 'fichier'].includes(name))
      return [item('Open', 'Ouvrir', 'open'), item('Properties', 'Propriétés', 'properties'), { name: fr ? 'Fermer' : 'Close', action: () => emit('close') }]
    if (['edit', 'édition'].includes(name)) return [item('Search…', 'Rechercher…', 'search')]
    if (['view', 'affichage'].includes(name))
      return [
        item('Tiles', 'Mosaïques', 'tiles'),
        item('Details', 'Détails', 'list'),
        item('Show / Hide Task Pane', 'Afficher / masquer le volet', 'folders'),
        item('Back', 'Retour', 'back'),
        item('Forward', 'Suivant', 'forward'),
        item('My Computer', 'Poste de travail', 'home')
      ]
    if (['favorites', 'favoris'].includes(name))
      return ['myProjects', 'myCV', 'music', 'gift'].map((id) => ({
        name: { myProjects: fr ? 'Mes projets' : 'My Projects', myCV: fr ? 'Mon CV' : 'My CV', music: 'Windows Media Player', gift: 'gift.exe' }[id],
        action: () => openWindow(id)
      }))
    if (['tools', 'outils'].includes(name)) return [item('System Properties', 'Propriétés système', 'system')]
    return [item('Help Topics', 'Rubriques d’aide', 'help'), item('System Properties', 'Propriétés système', 'system')]
  }
  if (props.id === 'gift') {
    const fr = props.dropdownItems.includes('Fichier')
    const item = (en, french, detail) => ({ name: fr ? french : en, action: () => window.dispatchEvent(new CustomEvent('gift-command', { detail })) })
    if (['file', 'fichier'].includes(name))
      return [
        item('New Certificate', 'Nouveau certificat', 'new'),
        item('Save as Image…', 'Enregistrer l’image…', 'save'),
        { name: fr ? 'Fermer' : 'Close', action: () => emit('close') }
      ]
    if (['view', 'affichage'].includes(name))
      return [
        item('Back', 'Retour', 'back'),
        item('Forward', 'Suivant', 'forward'),
        item('Fit to Window', 'Ajuster à la fenêtre', 'fit'),
        item('Actual Size', 'Taille réelle', 'actual'),
        item('Show / Hide Status Bar', 'Afficher / masquer la barre d’état', 'status')
      ]
    return [item('About gift.exe', 'À propos de gift.exe', 'help')]
  }
  if (props.id === 'paint') {
    const fr = props.dropdownItems.includes('Fichier')
    const item = (en, french, detail) => ({ name: fr ? french : en, action: () => window.dispatchEvent(new CustomEvent('paint-command', { detail })) })
    if (['file', 'fichier'].includes(name))
      return [
        item('New', 'Nouveau', 'new'),
        item('Open…', 'Ouvrir…', 'open'),
        item('Save as PNG…', 'Enregistrer en PNG…', 'save'),
        item('Restore About Me', 'Restaurer À propos de moi', 'reset'),
        { name: fr ? 'Fermer' : 'Close', action: () => emit('close') }
      ]
    if (['edit', 'édition'].includes(name))
      return [
        item('Undo', 'Annuler', 'undo'),
        item('Redo', 'Rétablir', 'redo'),
        item('Select All', 'Tout sélectionner', 'selectAll'),
        item('Delete Selection', 'Effacer la sélection', 'delete')
      ]
    if (['view', 'affichage'].includes(name))
      return [
        item('Show / Hide Toolbox', 'Afficher / masquer les outils', 'toolbox'),
        item('Show / Hide Color Box', 'Afficher / masquer la palette', 'colors'),
        item('Show / Hide Status Bar', 'Afficher / masquer la barre d’état', 'status'),
        item('Zoom In', 'Agrandir', 'zoomIn'),
        item('Zoom Out', 'Réduire', 'zoomOut'),
        item('Actual Size', 'Taille réelle', 'actual'),
        item('Fit to Window', 'Ajuster à la fenêtre', 'fit')
      ]
    if (name === 'image')
      return [
        item('Flip Horizontal', 'Retourner horizontalement', 'flipH'),
        item('Flip Vertical', 'Retourner verticalement', 'flipV'),
        item('Rotate 90°', 'Pivoter de 90°', 'rotate'),
        item('Clear Image', 'Effacer l’image', 'clear'),
        item('Attributes…', 'Attributs…', 'attributes')
      ]
    if (['colors', 'couleurs'].includes(name))
      return [
        item('Swap Foreground / Background', 'Inverser premier plan / arrière-plan', 'swap'),
        item('Show / Hide Color Box', 'Afficher / masquer la palette', 'colors')
      ]
    return [item('Paint Help', 'Aide de Paint', 'help')]
  }
  if (props.id === 'myCV') {
    const command = (detail) => () => window.dispatchEvent(new CustomEvent('pdf-reader-command', { detail }))
    if (['file', 'fichier'].includes(name))
      return [
        { name: 'Open Original PDF', href: profile.cv.url },
        { name: 'Save a Copy…', href: profile.cv.url, download: profile.cv.filename },
        { name: 'Print…', action: command('print') },
        { name: 'Close', action: () => emit('close') }
      ]
    if (['view', 'affichage'].includes(name))
      return [
        { name: 'Bookmarks', action: command('bookmarks') },
        { name: 'Page Thumbnails', action: command('thumbnails') },
        { name: 'Find…', action: command('find') }
      ]
    if (['go to', 'aller à'].includes(name))
      return [
        { name: 'Previous Page', action: command('previous') },
        { name: 'Next Page', action: command('next') },
        { name: 'First Page', action: command('first') },
        { name: 'Last Page', action: command('last') }
      ]
    if (name === 'zoom')
      return [
        { name: 'Zoom In', action: command('in') },
        { name: 'Zoom Out', action: command('out') },
        { name: 'Actual Size', action: command('actual') },
        { name: 'Fit Width', action: command('width') },
        { name: 'Fit Page', action: command('page') }
      ]
    if (['favorites', 'favoris'].includes(name)) return cvReader.bookmarks.map((item) => ({ name: item.en, action: command({ bookmark: item.id }) }))
    if (['settings', 'paramètres'].includes(name)) return [{ name: 'Show / Hide Status Bar', action: command('status') }]
    return [{ name: 'About This Document', action: command('help') }]
  }
  if (props.id === 'contact') {
    const command = (detail) => () => window.dispatchEvent(new CustomEvent('contact-command', { detail }))
    if (['file', 'fichier'].includes(name))
      return [
        { name: 'New Message', action: command('clear') },
        { name: 'Send Message', action: command('send') },
        { name: 'Close', action: () => emit('close') }
      ]
    if (['edit', 'édition'].includes(name))
      return ['undo', 'cut', 'copy', 'paste', 'selectAll'].map((action) => ({
        name: action === 'selectAll' ? 'Select All' : action[0].toUpperCase() + action.slice(1),
        action: command(action)
      }))
    if (['view', 'affichage'].includes(name))
      return [
        { name: 'Message Body', action: command('focus') },
        { name: 'Maximize / Restore', action: () => emit('maximize') }
      ]
    if (['insert', 'insertion'].includes(name)) return [{ name: 'Line Break', action: command('insertLineBreak') }]
    if (name === 'format') return ['bold', 'italic', 'underline'].map((action) => ({ name: action[0].toUpperCase() + action.slice(1), action: command(action) }))
    if (['tools', 'outils'].includes(name)) return [{ name: 'Check Addresses and Message', action: command('check') }]
    if (name === 'message') return [{ name: 'Send Message', action: command('send') }]
    return [{ name: 'About Sending Messages', action: command('help') }]
  }
  if (props.id === 'internet') {
    const command = (detail) => () => window.dispatchEvent(new CustomEvent('browser-command', { detail }))
    if (['file', 'fichier'].includes(name))
      return [
        { name: 'Open Address…', action: command('address') },
        { name: 'Open in Browser', href: browserLocation.value },
        { name: 'Close', action: () => emit('close') }
      ]
    if (['edit', 'édition'].includes(name))
      return [
        { name: 'Select Address', action: command('address') },
        { name: 'Copy Address', action: command('copy') }
      ]
    if (['view', 'affichage'].includes(name))
      return [
        { name: 'Back', action: command('back') },
        { name: 'Forward', action: command('forward') },
        { name: 'Refresh', action: command('refresh') },
        { name: 'Stop', action: command('stop') },
        { name: 'Home', action: command('home') }
      ]
    if (['favorites', 'favoris'].includes(name)) return browserLinks.map((link) => ({ name: link.name, action: command({ url: link.url, name: link.name }) }))
    if (['tools', 'outils'].includes(name))
      return [
        { name: 'Show / Hide Links Bar', action: command('links') },
        { name: 'Favorites Pane', action: command('favorites') },
        { name: 'History Pane', action: command('history') }
      ]
    return [{ name: 'About Internet Explorer', action: command('about') }]
  }
  if (props.id === 'music') {
    const command = (detail) => () => window.dispatchEvent(new CustomEvent('music-playback', { detail }))
    const view = (detail) => () => window.dispatchEvent(new CustomEvent('music-view', { detail }))
    if (['file', 'fichier'].includes(name))
      return [
        { name: 'Media Library', action: view('library') },
        { name: 'Close', action: () => emit('close') }
      ]
    if (['view', 'affichage'].includes(name))
      return [
        { name: 'Now Playing', action: view('now') },
        { name: 'Media Library', action: view('library') },
        { name: 'Show / Hide Playlist', action: view('playlist') }
      ]
    if (['play', 'lecture'].includes(name))
      return [
        { name: 'Play / Pause', action: command('play') },
        { name: 'Stop', action: command('stop') },
        { name: 'Previous', action: command('previous') },
        { name: 'Next', action: command('next') }
      ]
    if (['tools', 'outils'].includes(name))
      return [
        { name: 'Shuffle', action: command('shuffle') },
        { name: 'Repeat track', action: command('repeat') },
        { name: 'Mute / Unmute', action: command('mute') }
      ]
    return [{ name: 'About Windows Media Player', action: view('about') }]
  }
  if (['file', 'fichier'].includes(name))
    return [
      ...(props.id === 'notepad' ? [{ name: 'Save notes…', action: saveNotes }] : []),
      ...(props.id !== 'notepad' ? [{ name: 'Download CV…', href: profile.cv.url, download: profile.cv.filename }] : []),
      { name: 'Close', action: () => emit('close') }
    ]
  if (['edit', 'édition'].includes(name)) return [{ name: 'Select All', action: selectText }]
  if (['view', 'affichage'].includes(name))
    return [
      { name: 'Minimize', action: () => emit('minimize') },
      { name: 'Maximize / Restore', action: () => emit('maximize') }
    ]
  if (['game', 'jeu'].includes(name)) return [{ name: 'New Game', action: () => window.dispatchEvent(new CustomEvent('minesweeper-new-game')) }]
  if (['favorites', 'favoris'].includes(name)) return profile.links.map((link) => ({ name: link.name, href: link.url }))
  if (['tools', 'outils'].includes(name))
    return [
      { name: 'Command Prompt', action: () => openWindow('terminal') },
      { name: 'Notepad', action: () => openWindow('notepad') }
    ]
  if (['message', 'insert', 'insertion', 'format'].includes(name)) return [{ name: 'Contact information', action: () => openWindow('internet') }]
  return [
    { name: 'About Ghazi Saoudi', action: () => openWindow('about') },
    { name: 'My Computer', action: () => openWindow('computer') }
  ]
})
</script>
<template>
  <div v-if="dropdownItems.length" ref="menu" class="relative top-0 w-full h-6 mt-6 bg-window-white flex justify-between" @keydown.esc.stop="active = null">
    <div class="w-full h-full px-0.5 pt-0.5 pb-px flex items-center border-window-header-right border-window-header-bot">
      <div v-for="(item, index) in dropdownItems" :key="index" class="relative h-full">
        <button
          @click="active = active === index ? null : index"
          class="h-full small-p hover:bg-dropdown hover:text-white px-1.5 flex items-center cursor-pointer"
          :aria-expanded="active === index"
          aria-haspopup="menu"
        >
          {{ item }}
        </button>
        <div v-if="active === index" class="xp-system-menu" role="menu">
          <template v-for="action in actions" :key="action.name">
            <a
              v-if="action.href"
              :href="action.href"
              :download="action.download"
              :target="action.download ? undefined : '_blank'"
              rel="noopener noreferrer"
              role="menuitem"
              @click="active = null"
              >{{ action.name }}</a
            >
            <button v-else @click="run(action.action)" role="menuitem">{{ action.name }}</button>
          </template>
        </div>
      </div>
    </div>
    <img v-if="windowsHeaderLogo" src="/img/icons/windows-header-window-icon.webp" alt="Windows" class="h-6 w-10 pt-0.5 border-window-header-bot" />
  </div>
</template>
