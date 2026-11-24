<template>
  <div class="relative right-0 h-full flex">
    <textarea
      aria-label="Notepad document"
      v-model="noteContent"
      :data-filename="file?.name || 'Notes.txt'"
      class="w-full h-content-headless-toolbox bg-white overflow-y-scroll outline-none resize-none px-1 font-trebuchet-pixel text-md"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import profile from '@/data/profile-data.json'
const props = defineProps({ file: Object })

const noteContent = ref(
  `${profile.name}\n${profile.title}\n\n${profile.bio.join('\n\n')}\n\n${profile.email}\n${profile.github}\n\nWelcome! Use this notepad for your own notes.`
)
watch(
  () => props.file,
  (file) => {
    if (file?.kind === 'text') noteContent.value = file.text
  },
  { immediate: true }
)
</script>
