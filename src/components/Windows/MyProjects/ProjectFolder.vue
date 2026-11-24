<script setup>
import { computed, inject, ref } from 'vue'
import { projectFiles } from '@/lib/project-files.mjs'
const props = defineProps({ project: { type: Object, required: true } })
const openFile = inject('openFile')
const files = computed(() => projectFiles(props.project))
const selected = ref('')
const isTouch = window.matchMedia('(pointer:coarse)').matches
const icons = {
  text: '/img/icons/documents/txt-icon.webp',
  image: '/img/icons/pictures/image-file.svg',
  video: '/img/icons/music/windows-media-player.png',
  link: '/img/icons/explorer-icon-lg.webp'
}
const choose = (file) => {
  selected.value = file.name
  if (isTouch) openFile(file)
}
</script>
<template>
  <div class="xp-project-folder">
    <div class="xp-project-files" :aria-label="project.name + ' files'">
      <component
        :is="file.kind === 'link' ? 'a' : 'button'"
        v-for="file in files"
        :key="file.name"
        :href="file.kind === 'link' ? file.url : undefined"
        :target="file.kind === 'link' ? '_blank' : undefined"
        :rel="file.kind === 'link' ? 'noopener noreferrer' : undefined"
        class="xp-project-file"
        :class="{ selected: selected === file.name }"
        :title="file.availability || file.caption || file.url || file.name"
        @click.prevent="choose(file)"
        @dblclick.prevent="openFile(file)"
        @keydown.enter.prevent="openFile(file)"
        @keydown.space.prevent="openFile(file)"
      >
        <img :src="icons[file.kind]" alt="" /><span>{{ file.name }}</span>
      </component>
    </div>
    <footer class="xp-project-folder-status">
      {{ files.length }} objects<span>{{ selected || project.name }}</span>
    </footer>
  </div>
</template>
<style scoped>
.xp-project-folder {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  background: white;
  color: #111;
  font:
    12px Tahoma,
    sans-serif;
}
.xp-project-files {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px 3px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 8px;
}
.xp-project-file {
  width: 108px;
  min-height: 85px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  padding: 3px 5px;
  text-align: center;
  text-decoration: none;
  color: #111;
}
.xp-project-file img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}
.xp-project-file span {
  padding: 1px 3px;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
.xp-project-file.selected span {
  background: #316ac5;
  color: white;
  outline: 1px dotted #333;
}
.xp-project-file.selected img {
  filter: opacity(0.65);
}
.xp-project-file:focus-visible {
  outline: 1px dotted #333;
  outline-offset: -2px;
}
.xp-project-folder-status {
  height: 23px;
  flex-shrink: 0;
  border-top: 1px solid #aaa;
  background: #ece9d8;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 5px;
  font-size: 11px;
}
.xp-project-folder-status span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 1px solid #aaa;
  padding-left: 8px;
}
</style>
