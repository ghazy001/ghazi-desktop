import { defineStore } from 'pinia'
import { storedValue, storeValue } from '../lib/browser-storage.mjs'

export const useVolumeStore = defineStore('volume', {
  state: () => {
    let volume = parseFloat(storedValue('volume'))
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      volume = 0.2
      storeValue('volume', volume.toString())
    }
    return {
      volume: volume,
      audioElements: {}
    }
  },
  actions: {
    setVolume(newVolume) {
      this.volume = newVolume
      storeValue('volume', newVolume)
      Object.values(this.audioElements).forEach((audio) => {
        audio.volume = newVolume
      })
    },
    playAudio(audioFile) {
      if (this.audioElements[audioFile]) {
        this.audioElements[audioFile].play().catch((error) => {
          console.log('Autoplay prevented:', error)
        })
      } else {
        const audio = new Audio(audioFile)
        audio.volume = this.volume
        audio.play().catch((error) => {
          console.log('Autoplay prevented:', error)
        })
        this.audioElements[audioFile] = audio
      }
    },
    pauseAudio(audioFile) {
      if (this.audioElements[audioFile]) {
        this.audioElements[audioFile].pause()
      }
    },
    resetAudio(audioFile) {
      if (this.audioElements[audioFile]) {
        this.audioElements[audioFile].currentTime = 0
      }
    },
    unmuteAudio() {
      Object.values(this.audioElements).forEach((audio) => {
        audio.volume = this.volume
      })
    }
  }
})
