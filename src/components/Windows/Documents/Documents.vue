<script setup>
import { inject } from 'vue'
import profile from '@/data/profile-data.json'
import WindowLeftMenu from '@/components/Windows/WindowLeftMenu.vue'
const props = defineProps({ leftMenuType: String })
const openWindow = inject('openWindow')
const documents = [
  { name: 'About Me.txt', icon: '/img/icons/documents/txt-icon.webp', app: 'about', type: 'Text Document' },
  { name: 'My CV', icon: '/img/icons/cv/adobe-pdf.png', app: 'myCV', type: 'PDF Reader' },
  { name: 'Certifications', icon: '/img/icons/cv/cv-icon-lg.webp', app: 'certifications', type: 'Credentials' }
]
</script>
<template>
  <div class="relative h-content-window flex">
    <WindowLeftMenu :leftMenuType="props.leftMenuType" />
    <div class="bg-white w-full h-full overflow-auto p-3 xp-content">
      <h1>{{ $t('common.files') }}</h1>
      <div class="xp-document-list">
        <a :href="profile.cv.url" :download="profile.cv.filename" class="xp-document"
          ><img src="/img/icons/cv/adobe-pdf.png" alt="" width="40" height="40" /><span
            >{{ profile.cv.filename }}<small>PDF Document · English · {{ $t('buttons.downloadCV') }}</small></span
          ></a
        >
        <button v-for="doc in documents" :key="doc.name" @click="openWindow(doc.app)" class="xp-document">
          <img :src="doc.icon" alt="" width="40" height="40" /><span
            >{{ doc.name }}<small>{{ doc.type }}</small></span
          >
        </button>
      </div>
      <p><a :href="profile.cv.url" target="_blank" rel="noopener noreferrer">Open original CV in a new tab</a></p>
    </div>
  </div>
</template>
