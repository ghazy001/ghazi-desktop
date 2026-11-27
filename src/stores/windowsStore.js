import { defineStore } from 'pinia'
import { restoredWindows, storeValue } from '../lib/browser-storage.mjs'

export const useWindowsStore = defineStore('windows', {
  state: () => ({
    openWindowIds: restoredWindows()
  }),
  actions: {
    saveState() {
      storeValue('windows', JSON.stringify(this.openWindowIds))
    },
    loadState() {
      this.openWindowIds = restoredWindows()
    },
    addWindowStore(windowId) {
      if (!this.openWindowIds.includes(windowId)) {
        this.openWindowIds.push(windowId)
        this.saveState()
      }
    },
    removeWindowStore(windowId) {
      this.openWindowIds = this.openWindowIds.filter((id) => id !== windowId)
      this.saveState()
    }
  }
})
