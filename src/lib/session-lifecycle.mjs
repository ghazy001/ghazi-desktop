export const POWER_CHOICES = Object.freeze({ shutdown: ['standby', 'shutdown', 'restart'], logoff: ['switch', 'logoff'] })
const START_PHASE = Object.freeze({ standby: 'standby', shutdown: 'shuttingDown', restart: 'restarting', switch: 'login', logoff: 'loggingOff' })
const NEXT_PHASE = Object.freeze({
  loggingOff: 'login',
  shuttingDown: 'off',
  restarting: 'bootBlank',
  bootBlank: 'bootLoading',
  bootLoading: 'bootWelcome',
  bootWelcome: 'login'
})
export function powerPhase(dialog, action) {
  return Object.hasOwn(POWER_CHOICES, dialog) && POWER_CHOICES[dialog].includes(action) ? START_PHASE[action] : null
}
export function nextPowerPhase(phase) {
  return Object.hasOwn(NEXT_PHASE, phase) ? NEXT_PHASE[phase] : phase
}
export function desktopAvailable(phase, dialog) {
  return phase === 'running' && !dialog
}
