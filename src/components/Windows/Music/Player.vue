<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useVolumeStore } from '@/stores/volumeStore'
import { useLocaleStore } from '@/stores/localeStore'
import MediaIcon from './MediaIcon.vue'
const props = defineProps({ playlist: { type: Array, required: true } })
const emit = defineEmits(['track-change', 'show-library', 'toggle-playlist'])
const maximize = inject('toggleWindowMaximize', () => {})
const shuffle = ref(false)
const repeat = ref(false)
const previousVolume = ref(0.2)
const volume = useVolumeStore()
const locale = useLocaleStore()
const audio = ref(null)
const index = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const actualDuration = ref(0)
const error = ref('')
const currentTrack = computed(() => props.playlist[index.value])
const duration = computed(() => actualDuration.value || currentTrack.value.duration)
const french = computed(() => locale.currentLocale === 'fr')
const formatTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
let request = 0
const play = async () => {
  const activeRequest = ++request
  try {
    error.value = ''
    await audio.value.play()
  } catch (cause) {
    if (activeRequest === request && cause.name !== 'AbortError')
      error.value = french.value ? 'Lecture impossible. Réessayez.' : 'Unable to play this track. Please try again.'
  }
}
const selectTrack = async (nextIndex, shouldPlay) => {
  request++
  audio.value.pause()
  index.value = nextIndex
  currentTime.value = 0
  actualDuration.value = 0
  emit('track-change', currentTrack.value.id)
  await nextTick()
  if (!audio.value) return
  audio.value.load()
  if (shouldPlay) await play()
}
const playTrack = (id) => {
  const nextIndex = props.playlist.findIndex((track) => track.id === id)
  if (nextIndex < 0) return
  if (nextIndex === index.value) play()
  else selectTrack(nextIndex, true)
}
const togglePlay = () => (isPlaying.value ? audio.value.pause() : play())
const move = (direction) => selectTrack(nextIndex(direction), isPlaying.value)
const nextIndex = (direction) => {
  if (shuffle.value && props.playlist.length > 1) return (index.value + 1 + Math.floor(Math.random() * (props.playlist.length - 1))) % props.playlist.length
  return (index.value + direction + props.playlist.length) % props.playlist.length
}
const nextTrack = () => {
  if (repeat.value) {
    audio.value.currentTime = 0
    play()
  } else selectTrack(nextIndex(1), true)
}
const stop = () => {
  request++
  audio.value.pause()
  audio.value.currentTime = 0
  currentTime.value = 0
}
const toggleShuffle = () => {
  shuffle.value = !shuffle.value
}
const toggleMute = () => {
  if (volume.volume > 0) {
    previousVolume.value = volume.volume
    volume.setVolume(0)
  } else volume.setVolume(previousVolume.value || 0.2)
}

const seek = (event) => {
  if (audio.value.readyState >= 1) audio.value.currentTime = Number(event.target.value)
}
const handleCommand = (event) => {
  if (event.detail === 'play') togglePlay()
  if (event.detail === 'next') move(1)
  if (event.detail === 'previous') move(-1)
  if (event.detail === 'stop') stop()
  if (event.detail === 'shuffle') toggleShuffle()
  if (event.detail === 'repeat') repeat.value = !repeat.value
  if (event.detail === 'mute') toggleMute()
}
onMounted(() => window.addEventListener('music-playback', handleCommand))
onBeforeUnmount(() => {
  request++
  audio.value?.pause()
  window.removeEventListener('music-playback', handleCommand)
})
defineExpose({ playTrack, toggleShuffle, shuffle })
</script>
<template>
  <footer class="wmp8-player">
    <Teleport to="#wmp-video-host" :disabled="currentTrack.type !== 'video'" defer>
      <component
        :is="currentTrack.type === 'video' ? 'video' : 'audio'"
        ref="audio"
        :src="currentTrack.src"
        :volume="volume.volume"
        :poster="currentTrack.cover"
        playsinline
        preload="metadata"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="nextTrack"
        @timeupdate="currentTime = $event.target.currentTime"
        @loadedmetadata="actualDuration = Number.isFinite($event.target.duration) ? $event.target.duration : 0"
        @error="error = french ? 'Fichier multimédia indisponible.' : 'Media file unavailable.'"
      ></component>
    </Teleport>
    <div class="wmp8-status" role="status">
      <span>{{ error || (isPlaying ? (french ? 'Lecture' : 'Playing') : currentTime > 0 ? (french ? 'Pause' : 'Paused') : french ? 'Prêt' : 'Ready') }}</span><time>{{
        formatTime(currentTime)
      }}</time>
    </div>
    <div class="wmp8-footer-body">
      <div class="wmp8-controls">
        <label class="wmp8-seek"
          ><MediaIcon name="rewind" /><input
            type="range"
            min="0"
            :max="duration"
            :value="currentTime"
            step="0.1"
            @input="seek"
            :aria-label="french ? 'Position' : 'Seek'" /><MediaIcon name="fast-forward"
        /></label>
        <div class="wmp8-transport">
          <button @click="togglePlay" class="wmp8-play" :class="{ playing: isPlaying }" :aria-label="isPlaying ? 'Pause' : 'Play'">
            <MediaIcon :name="isPlaying ? 'pause' : 'play'" />
          </button>
          <button @click="stop" class="wmp8-stop wmp8-small-button" aria-label="Stop"><MediaIcon name="stop" /></button>
          <button @click="move(-1)" class="wmp8-previous wmp8-small-button" :aria-label="french ? 'Piste précédente' : 'Previous track'">
            <MediaIcon name="previous" />
          </button>
          <button @click="move(1)" class="wmp8-next wmp8-small-button" :aria-label="french ? 'Piste suivante' : 'Next track'"><MediaIcon name="next" /></button>
          <button @click="emit('toggle-playlist')" class="wmp8-queue-toggle wmp8-small-button" aria-label="Toggle playlist">
            <MediaIcon name="playlist" />
          </button>
          <button
            @click="toggleMute"
            class="wmp8-mute"
            :class="{ muted: volume.volume === 0 }"
            :aria-label="volume.volume === 0 ? 'Unmute' : 'Mute'"
            :aria-pressed="volume.volume === 0"
          >
            <MediaIcon :name="volume.volume === 0 ? 'muted' : 'volume'" />
          </button>
          <input
            class="wmp8-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume.volume"
            @input="volume.setVolume(Number($event.target.value))"
            aria-label="Volume"
            :style="{ '--volume-level': volume.volume * 100 + '%' }"
          />
        </div>
      </div>
      <div class="wmp8-footer-right">
        <button @click="emit('show-library')" class="wmp8-library-shortcut" aria-label="Open Media Library"><MediaIcon name="document" /></button
        ><button @click="maximize" class="wmp8-size-button" aria-label="Maximize or restore player"><MediaIcon name="maximize" /></button>
      </div>
    </div>
  </footer>
</template>
<style scoped>
.wmp8-player {
  flex-shrink: 0;
  height: 90px;
  position: relative;
  background: linear-gradient(#b7c4e9, #a5b2d1);
}
.wmp8-status {
  height: 20px;
  margin-left: var(--wmp-side);
  background: #000;
  color: #00ff00;
  border: 1px solid #a3a7b1;
  border-top-color: #8f91a1;
  border-radius: 0 0 20px 0;
  display: flex;
  justify-content: space-between;
  padding: 1px 12px 2px 68px;
  font:
    bold 11px Tahoma,
    sans-serif;
  line-height: 15px;
  box-shadow: 0 2px 2px #fff;
}
.wmp8-footer-body {
  height: 70px;
  display: flex;
  position: relative;
  background: linear-gradient(90deg, #ced0d8, #a7a9b4 65%, #dedee1);
  border-bottom: 1px solid #757e99;
}
.wmp8-footer-body::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 0;
  width: calc(var(--wmp-side) + 55px);
  height: 77px;
  border-top: 2px solid #7e92c7;
  border-top-right-radius: 78px 58px;
  box-shadow: 1px -1px #cad7f5;
  background: linear-gradient(145deg, #9297ac, #e5e6eb 56%, #b4b5c0);
}
.wmp8-controls {
  position: relative;
  margin-left: var(--wmp-side);
  width: 357px;
  flex-shrink: 0;
  height: 70px;
  border-radius: 0 0 46px 55px;
  background: linear-gradient(#9db8ed 0%, #5d7bc8 8%, #8eabe9 30%, #4363b1 80%, #2e4b93);
  border-bottom: 2px solid #849edf;
  border-right: 2px solid #839cce;
  box-shadow:
    inset 1px 1px 1px #d4dfff,
    1px 1px 2px #7b8194;
}
.wmp8-seek {
  position: absolute;
  top: 5px;
  left: 87px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #becff1;
  font-size: 10px;
  text-shadow: 0 1px #415f9e;
}
.wmp8-seek :deep(svg) {
  width: 14px;
  height: 12px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px #45649e);
}
.wmp8-seek input {
  width: 100%;
  min-width: 0;
}
.wmp8-transport {
  height: 45px;
  position: absolute;
  left: 44px;
  right: 14px;
  top: 21px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.wmp8-play {
  width: 45px;
  height: 45px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid #39518d;
  background: radial-gradient(ellipse at 38% 20%, #fff 2%, #e4f2ff 22%, #b6d7fb 48%, #6e96d0 77%, #c1d4f3 100%);
  box-shadow:
    inset 1px 2px 1px #fff,
    0 0 0 2px #8da7da,
    1px 2px 2px #3f4f7c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wmp8-play {
  padding: 0;
  color: #172f53;
}
.wmp8-play :deep(svg) {
  width: 23px;
  height: 23px;
  filter: drop-shadow(0 1px #e9f4ff);
}
.wmp8-small-button {
  width: 29px;
  height: 21px;
  flex-shrink: 0;
  border: 1px solid #3f5f9a;
  border-radius: 50%;
  background: linear-gradient(#f9fcff, #bcd2f7 45%, #6d8cbf 95%);
  box-shadow:
    inset 1px 1px #fff,
    0 1px 1px #314f8c;
  color: #2e4365;
  font-size: 9px;
  line-height: 17px;
  text-align: center;
}
.wmp8-stop {
  width: 24px;
  height: 27px;
}
.wmp8-small-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #354d74;
}
.wmp8-small-button :deep(svg) {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 1px #edf6ff);
}
.wmp8-queue-toggle {
  margin-left: 2px;
}
.wmp8-mute {
  width: 25px;
  height: 25px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  border: 1px solid transparent;
  border-radius: 3px;
}
.wmp8-mute :deep(svg) {
  width: 23px;
  height: 22px;
  filter: drop-shadow(0 1px #3c5996);
}
.wmp8-mute:hover {
  border-color: #93afe3;
  background: #6b89c4;
}
.wmp8-mute.muted {
  background: #496db1;
  box-shadow: inset 0 1px 2px #2a437b;
}
.wmp8-volume {
  width: 64px;
  min-width: 24px;
}
.wmp8-player input[type='range'] {
  appearance: none;
  height: 6px;
  border: 1px solid #5d7ea9;
  border-radius: 5px;
  background: linear-gradient(#bacfed, #7695c2 50%, #b4d0f9);
  box-shadow: 0 1px #9fb7e2;
}
.wmp8-player input.wmp8-volume {
  background: linear-gradient(to right, #24f86b 0 var(--volume-level), #6686b9 var(--volume-level) 100%);
}
.wmp8-player input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 15px;
  border: 1px solid #6d83a5;
  border-radius: 5px;
  background: linear-gradient(90deg, #fff, #d4dfed 60%, #9fadc8);
  box-shadow: 1px 1px 1px #395589;
}
.wmp8-player input[type='range']::-moz-range-thumb {
  width: 6px;
  height: 13px;
  border: 1px solid #6d83a5;
  border-radius: 5px;
  background: #d7e5f9;
}
.wmp8-footer-right {
  flex: 1;
  min-width: 0;
  height: 34px;
  margin-top: 2px;
  border-radius: 14px 0 0 14px;
  background: linear-gradient(#aaaeb9, #eeeff3 48%, #a4a6b3);
  border-top: 1px solid #8d97b0;
  border-bottom: 1px solid #e7e9ef;
  box-shadow: 0 1px 2px #62687d;
  position: relative;
}
.wmp8-library-shortcut {
  width: 25px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(#f6f7fa, #9ea5b2);
  border: 1px solid #8a909e;
  margin-left: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wmp8-library-shortcut {
  color: #f8fbff;
}
.wmp8-library-shortcut :deep(svg) {
  width: 17px;
  height: 18px;
  filter: drop-shadow(0 1px #747e94);
}
.wmp8-size-button {
  position: absolute;
  right: 2px;
  top: 40px;
  width: 18px;
  height: 15px;
  border-radius: 2px;
  border: 1px dotted #999;
}
.wmp8-size-button {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wmp8-size-button :deep(svg) {
  width: 14px;
  height: 14px;
  filter: drop-shadow(0 1px #777);
}
.wmp8-player button:hover {
  filter: brightness(1.12);
}
.wmp8-player button:active {
  filter: brightness(0.92);
}
@media (max-width: 650px) {
  .wmp8-controls {
    width: 310px;
  }
  .wmp8-transport {
    left: 30px;
    right: 9px;
    gap: 3px;
  }
  .wmp8-play {
    width: 39px;
    height: 39px;
  }
  .wmp8-small-button {
    width: 25px;
  }
  .wmp8-seek {
    left: 75px;
  }
  .wmp8-volume {
    width: 43px;
  }
  .wmp8-status {
    padding-left: 20px;
  }
}
@media (max-width: 470px) {
  .wmp8-controls {
    width: calc(100% - var(--wmp-side));
  }
  .wmp8-transport {
    left: 14px;
    gap: 2px;
  }
  .wmp8-play {
    width: 34px;
    height: 34px;
  }
  .wmp8-small-button {
    width: 22px;
  }
  .wmp8-queue-toggle {
    display: none;
  }
  .wmp8-seek {
    left: 55px;
    right: 10px;
  }
  .wmp8-volume {
    width: 40px;
  }
  .wmp8-footer-right {
    display: none;
  }
}
</style>
