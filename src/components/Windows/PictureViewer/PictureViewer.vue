<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useConnectionStore } from '@/stores/connectionStore'
import projects from '@/data/projects-data.json'
import { projectFiles } from '@/lib/project-files.mjs'
import PictureIcon from './PictureIcon.vue'
const session = useConnectionStore()
const props = defineProps({ file: Object })
const emit = defineEmits(['caption-change'])
const fallback = projectFiles(projects.categories[0].projects[0]).find((file) => file.kind === 'image')
const files = computed(() => props.file?.images || [fallback])
const index = ref(0)
const image = computed(() => files.value[index.value] || files.value[0])
const stage = ref(null)
const width = ref(1),
  height = ref(1),
  areaWidth = ref(400),
  areaHeight = ref(300),
  rotation = ref(0),
  zoom = ref(1),
  fitMode = ref(true),
  playing = ref(false),
  failed = ref(false)
const quarterTurn = computed(() => Math.abs(rotation.value % 180) === 90)
const rotatedWidth = computed(() => (quarterTurn.value ? height.value : width.value))
const rotatedHeight = computed(() => (quarterTurn.value ? width.value : height.value))
const factor = computed(() =>
  fitMode.value ? Math.min(1, Math.max(1, areaWidth.value - 8) / rotatedWidth.value, Math.max(1, areaHeight.value - 8) / rotatedHeight.value) : zoom.value
)
const surfaceStyle = computed(() => ({
  width: Math.max(areaWidth.value, rotatedWidth.value * factor.value) + 'px',
  height: Math.max(areaHeight.value, rotatedHeight.value * factor.value) + 'px'
}))
const boxStyle = computed(() => ({ width: rotatedWidth.value * factor.value + 'px', height: rotatedHeight.value * factor.value + 'px' }))
const imageStyle = computed(() => ({
  width: width.value + 'px',
  height: height.value + 'px',
  transform: `translate(-50%,-50%) rotate(${rotation.value}deg) scale(${factor.value})`
}))
const loadedImage = (event) => {
  width.value = event.target.naturalWidth
  height.value = event.target.naturalHeight
}
const actualSize = () => {
  zoom.value = 1
  fitMode.value = false
}
let observer, timer
const choose = (position) => {
  index.value = (position + files.value.length) % files.value.length
  rotation.value = 0
  fitMode.value = true
  failed.value = false
  emit('caption-change', `${image.value.name} - Windows Picture and Fax Viewer`)
}
watch(
  () => props.file,
  async (file) => {
    clearInterval(timer)
    playing.value = false
    index.value = file?.index || 0
    rotation.value = 0
    fitMode.value = true
    failed.value = false
    await nextTick()
    emit('caption-change', `${image.value.name} - Windows Picture and Fax Viewer`)
  },
  { immediate: true }
)
const changeZoom = (amount) => {
  zoom.value = Math.max(0.1, Math.min(5, factor.value + amount))
  fitMode.value = false
}
const toggleSlide = () => {
  playing.value = !playing.value
  clearInterval(timer)
  if (playing.value) timer = setInterval(() => choose(index.value + 1), 4000)
}
watch(
  () => session.powerPhase === 'running',
  (active) => {
    if (!active) {
      playing.value = false
      clearInterval(timer)
    }
  }
)
const print = () => {
  const win = window.open(image.value.src, '_blank', 'noopener,noreferrer')
  if (win) win.focus()
}
onMounted(() => {
  observer = new ResizeObserver(() => {
    if (stage.value.clientWidth) {
      areaWidth.value = stage.value.clientWidth
      areaHeight.value = stage.value.clientHeight
    }
  })
  observer.observe(stage.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearInterval(timer)
})
</script>
<template>
  <div class="xp-photo-viewer" @keydown.left.prevent="choose(index - 1)" @keydown.right.prevent="choose(index + 1)">
    <div ref="stage" class="xp-photo-stage" tabindex="0" aria-label="Image preview">
      <div class="xp-photo-surface" :style="surfaceStyle">
        <div class="xp-photo-box" :style="boxStyle">
          <img v-if="!failed" :key="image.src" :src="image.src" :alt="image.caption" :style="imageStyle" @load="loadedImage" @error="failed = true" draggable="false" />
          <p v-else role="status">Image unavailable.</p>
        </div>
      </div>
    </div>
    <div class="xp-photo-toolbar" role="toolbar" aria-label="Picture and Fax Viewer controls">
      <button @click="choose(index - 1)" :disabled="files.length < 2" aria-label="Previous image"><img src="/img/icons/pictures/previous-icon.svg" alt="" /></button
      ><button @click="choose(index + 1)" :disabled="files.length < 2" aria-label="Next image"><img src="/img/icons/pictures/next-icon.svg" alt="" /></button>
      <span></span><button @click="fitMode = true" :aria-pressed="fitMode" aria-label="Fit image"><PictureIcon name="fit" /></button
      ><button @click="actualSize" :aria-pressed="!fitMode && zoom === 1" aria-label="Actual size">
        <PictureIcon name="actual" /></button
      ><button @click="toggleSlide" :disabled="files.length < 2" :aria-pressed="playing" aria-label="Slideshow"><PictureIcon name="slideshow" /></button> <span></span
      ><button @click="changeZoom(0.25)" aria-label="Zoom in"><PictureIcon name="zoom-in" /></button
      ><button @click="changeZoom(-0.25)" aria-label="Zoom out"><PictureIcon name="zoom-out" /></button> <span></span
      ><button @click="rotation -= 90" aria-label="Rotate left"><img src="/img/icons/pictures/left.svg" alt="" /></button
      ><button @click="rotation += 90" aria-label="Rotate right"><img src="/img/icons/pictures/right.svg" alt="" /></button> <span></span
      ><a :href="image.src" :download="image.name" aria-label="Save image"><PictureIcon name="save" /></a
      ><button @click="print" aria-label="Open image for printing"><PictureIcon name="print" /></button>
    </div>
    <div class="xp-photo-status" :title="image.caption">
      {{ image.caption }}<span>{{ index + 1 }} / {{ files.length }}</span>
    </div>
  </div>
</template>
<style scoped>
.xp-photo-viewer {
  margin-top: 24px;
  height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #111;
  min-height: 0;
  font:
    11px Tahoma,
    sans-serif;
}
.xp-photo-stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
  border: 1px solid #7b8a9c;
}
.xp-photo-surface {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100%;
  min-height: 100%;
}
.xp-photo-box {
  position: relative;
  flex-shrink: 0;
}
.xp-photo-box > img {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  transform-origin: center;
  object-fit: contain;
}
.xp-photo-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 2px;
  height: 38px;
  background: #f5f4ec;
  border-top: 1px solid white;
  overflow-x: auto;
}
.xp-photo-toolbar > button,
.xp-photo-toolbar > a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 25px;
  height: 27px;
  padding: 3px;
  border: 1px solid transparent;
}
.xp-photo-toolbar img,
.xp-photo-toolbar svg {
  width: 19px;
  height: 19px;
}
.xp-photo-toolbar > span {
  height: 21px;
  border-left: 1px solid #ccc;
  margin: 0 3px;
  flex-shrink: 0;
}
.xp-photo-toolbar > button:hover:enabled,
.xp-photo-toolbar > a:hover,
.xp-photo-toolbar > [aria-pressed='true'] {
  border-color: #9baec7;
  background: linear-gradient(white, #dee8f6);
  box-shadow: inset 1px 1px white;
}
.xp-photo-toolbar > button:disabled {
  opacity: 0.35;
  cursor: default;
  filter: grayscale(1);
}
.xp-photo-status {
  flex-shrink: 0;
  display: flex;
  gap: 5px;
  align-items: center;
  height: 21px;
  background: #ece9d8;
  border-top: 1px solid #aaa;
  padding: 1px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xp-photo-status > span {
  margin-left: auto;
  flex-shrink: 0;
  background: #ece9d8;
  padding-left: 5px;
}
@media (max-width: 560px) {
  .xp-photo-toolbar {
    justify-content: flex-start;
  }
  .xp-photo-toolbar > button,
  .xp-photo-toolbar > a {
    width: 23px;
  }
  .xp-photo-toolbar > span {
    margin: 0 1px;
  }
}
</style>
