import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useConnectionStore } from '../src/stores/connectionStore.js'
import { desktopAvailable, powerPhase, nextPowerPhase } from '../src/lib/session-lifecycle.mjs'
setActivePinia(createPinia())
const session = useConnectionStore()
assert.equal(session.desktopActive, true)
for (const invalid of ['unknown', 'toString', '__proto__']) {
  session.requestPower(invalid)
  assert.equal(session.powerDialog, null)
  assert.equal(powerPhase(invalid, 'shutdown'), null)
}
session.requestPower('shutdown')
assert.equal(session.desktopActive, false)
assert.equal(session.performPower('logoff'), false)
assert.equal(session.powerDialog, 'shutdown')
session.cancelPower()
assert.equal(session.desktopActive, true)
for (const [dialog, action, phase] of [
  ['shutdown', 'standby', 'standby'],
  ['shutdown', 'shutdown', 'shuttingDown'],
  ['shutdown', 'restart', 'restarting'],
  ['logoff', 'switch', 'login'],
  ['logoff', 'logoff', 'loggingOff']
]) {
  session.login()
  session.requestPower(dialog)
  assert.equal(session.performPower(action), true)
  assert.equal(session.powerPhase, phase)
  assert.equal(session.desktopActive, false)
  assert.equal(session.powerDialog, null)
  assert.equal(session.performPower(action), false)
  session.requestPower('shutdown')
  assert.equal(session.powerDialog, null)
}
session.login()
session.requestPower('shutdown')
session.performPower('standby')
session.wake()
assert.equal(session.desktopActive, true)
session.login()
session.requestPower('shutdown')
session.performPower('shutdown')
session.advancePower('loggingOff')
assert.equal(session.powerPhase, 'shuttingDown')
session.advancePower('shuttingDown')
assert.equal(session.powerPhase, 'off')
assert.equal(session.status, 'off')
session.powerOn()
assert.equal(session.powerPhase, 'bootBlank')
session.powerOn()
assert.equal(session.powerPhase, 'bootBlank')
for (const [current, next] of [
  ['bootBlank', 'bootLoading'],
  ['bootLoading', 'bootWelcome'],
  ['bootWelcome', 'login']
]) {
  session.advancePower(current)
  assert.equal(session.powerPhase, next)
}
session.login()
assert.equal(session.desktopActive, true)
session.advancePower('bootLoading')
assert.equal(session.powerPhase, 'running')
session.requestPower('shutdown')
session.performPower('restart')
session.advancePower('restarting')
assert.equal(session.powerPhase, 'bootBlank')
session.login()
session.advancePower('bootBlank')
assert.equal(session.powerPhase, 'running')
session.requestPower('logoff')
session.performPower('logoff')
session.advancePower('loggingOff')
assert.equal(session.powerPhase, 'login')
assert.equal(session.status, 'disconnected')
assert.equal(desktopAvailable('running', 'shutdown'), false)
assert.equal(nextPowerPhase('unknown'), 'unknown')
assert.equal(nextPowerPhase('toString'), 'toString')
console.log(
  'XP session checks passed: confirmation/cancel, standby/wake, logoff/switch, shutdown/off/power-on, restart/boot/login, invalid actions, paused desktop and stale-transition guards.'
)
