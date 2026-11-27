<template>
  <div class="xp-notepad">
    <textarea
      aria-label="Notepad document"
      v-model="noteContent"
      :data-filename="file?.name || 'Notes.txt'"
      class="xp-notepad-editor"
      spellcheck="false"
      wrap="soft"
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

<style scoped>
.xp-notepad {
  height: calc(100% - 48px);
  min-height: 0;
  display: flex;
  background: white;
}
.xp-notepad-editor {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  resize: none;
  overflow: auto;
  border: 0;
  border-radius: 0;
  outline: none;
  background: white;
  color: #111;
  padding: 12px 14px;
  font:
    15px/1.65 'Lucida Console',
    'Courier New',
    monospace;
  tab-size: 4;
}
.xp-notepad-editor:focus-visible {
  box-shadow: inset 0 0 0 1px #b6cbe7;
}
@media (max-width: 600px) {
  .xp-notepad-editor {
    padding: 10px;
    font-size: 16px;
    line-height: 1.6;
  }
}
</style>
