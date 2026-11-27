import { defineStore } from 'pinia'
import { powerPhase, nextPowerPhase, desktopAvailable, POWER_CHOICES } from '../lib/session-lifecycle.mjs'
export const useConnectionStore = defineStore('connection', {
  state: () => ({ status: 'restart', powerDialog: null, powerPhase: 'running' }),
  getters: {
    desktopActive: (state) => desktopAvailable(state.powerPhase, state.powerDialog)
  },
  actions: {
    requestPower(kind) {
      if (this.powerPhase === 'running' && Object.hasOwn(POWER_CHOICES, kind)) this.powerDialog = kind
    },
    cancelPower() {
      this.powerDialog = null
    },
    performPower(action) {
      const phase = powerPhase(this.powerDialog, action)
      if (!phase || this.powerPhase !== 'running') return false
      this.powerDialog = null
      this.powerPhase = phase
      if (phase === 'login') this.status = 'disconnected'
      if (phase === 'restarting') this.status = 'restart'
      return true
    },
    advancePower(expected) {
      if (this.powerPhase !== expected) return
      this.powerPhase = nextPowerPhase(this.powerPhase)
      if (this.powerPhase === 'login') this.status = 'disconnected'
      if (this.powerPhase === 'off') this.status = 'off'
    },
    powerOn() {
      if (this.powerPhase !== 'off') return
      this.status = 'restart'
      this.powerPhase = 'bootBlank'
    },
    wake() {
      if (this.powerPhase === 'standby') this.login()
    },
    disconnect() {
      this.status = 'disconnected'
    },
    restart() {
      this.status = 'restart'
    },
    login() {
      this.status = 'loggedIn'
      this.powerDialog = null
      this.powerPhase = 'running'
    }
  }
})
