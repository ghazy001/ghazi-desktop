<script setup>
import { ref, watch, nextTick, inject } from 'vue'
import { useAssistantStore, portfolioProjects } from '@/stores/assistantStore'
import { useGoBackStore } from '@/stores/goBackStore'
import { commandCatalog } from '@/lib/portfolio-terminal.mjs'
const store = useAssistantStore(),
  navigation = useGoBackStore(),
  openWindow = inject('openWindow')
const input = ref(''),
  field = ref(null),
  scroll = ref(null),
  recall = ref([]),
  index = ref(0)
function execute() {
  if (!input.value.trim()) return
  recall.value.push(input.value)
  index.value = recall.value.length
  store.run(input.value, openWindow, navigation)
  input.value = ''
}
function move(delta) {
  index.value = Math.max(0, Math.min(recall.value.length, index.value + delta))
  input.value = recall.value[index.value] || ''
}
function complete() {
  const match = [...commandCatalog(portfolioProjects), 'clear'].filter((c) => c.startsWith(input.value.toLowerCase()))
  if (match.length === 1) input.value = match[0]
}
watch(
  () => store.terminal.at(-1),
  async () => {
    await nextTick()
    if (scroll.value) scroll.value.scrollTop = scroll.value.scrollHeight
  }
)
</script>
<template>
  <main class="portfolio-terminal" ref="scroll" @click="!$event.target.closest('button') && field?.focus()">
    <header><span>Microsoft Windows XP [Portfolio Edition]</span><button @click="openWindow('assistant')">Open MSN</button></header>
    <p>Ghazi Saoudi — Software Engineer<br />Virtual portfolio console. Type <b>help</b> to begin.</p>
    <div v-for="(entry, i) in store.terminal" :key="i" class="console-entry">
      <div><span v-if="entry.source === 'assistant'" class="console-source">[Assistant] </span>C:\Ghazi&gt; {{ entry.command }}</div>
      <pre :class="{ 'console-error': entry.error }">{{ entry.output }}</pre>
    </div>
    <form @submit.prevent="execute">
      <label for="portfolio-command">C:\Ghazi&gt;</label
      ><input
        id="portfolio-command"
        ref="field"
        v-model="input"
        maxlength="160"
        aria-label="Portfolio command"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown.up.prevent="move(-1)"
        @keydown.down.prevent="move(1)"
        @keydown.tab.prevent="complete"
      />
    </form>
  </main>
</template>
<style scoped>
.portfolio-terminal {
  height: calc(100% - 28px);
  margin-top: 28px;
  background: #0c0c0c;
  color: #e6e6e6;
  overflow: auto;
  padding: 14px 16px;
  user-select: text;
  font:
    14px/1.55 'Lucida Console',
    Consolas,
    monospace;
}
.portfolio-terminal header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  color: #aaa;
  margin-bottom: 12px;
}
.portfolio-terminal button {
  color: #a6d4ff;
  text-decoration: underline;
  font: inherit;
  font-size: 11px;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
}
.portfolio-terminal p {
  margin-bottom: 22px;
}
.console-entry {
  margin: 0 0 16px;
}
.console-entry pre {
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 4px 0 0;
  color: #ddd;
}
.console-source {
  color: #90c8ff;
}
.console-entry pre.console-error {
  color: #ffbf83;
}
.portfolio-terminal form {
  display: flex;
  gap: 9px;
  align-items: start;
}
.portfolio-terminal input {
  background: transparent;
  border: 0;
  outline: 0;
  color: white;
  min-width: 0;
  flex: 1;
  font: inherit;
  caret-color: #fff;
}
.portfolio-terminal :focus-visible {
  outline: 1px dotted #a6d4ff;
  outline-offset: 2px;
}
@media (max-width: 500px) {
  .portfolio-terminal {
    padding: 10px;
    font-size: 12px;
  }
  .portfolio-terminal header {
    flex-wrap: wrap;
  }
}
</style>
