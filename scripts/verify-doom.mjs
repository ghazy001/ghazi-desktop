import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
const base = new URL('../public/game/vendor/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('SOURCES.json', base)))
for (const asset of manifest.assets) {
  assert.equal(
    createHash('sha256')
      .update(readFileSync(new URL(asset.file, base)))
      .digest('hex'),
    asset.sha256,
    `Changed runtime asset: ${asset.file}`
  )
}
const binary = readFileSync(new URL('wdosbox.wasm.js', base))
assert.equal(binary.subarray(0, 8).toString('hex'), '0061736d01000000', 'Invalid WebAssembly binary')
// Exercise the shipped Asyncify sleep gate: ordinary MainLoop.pause does not stop this runtime.
const engine = readFileSync(new URL('wdosbox.js', base), 'utf8')
const sleep = engine.slice(engine.indexOf('function _emscripten_sleep('), engine.indexOf('function _SDL_Delay('))
let timer,
  resumed = 0
const module = { xpPaused: false }
const context = vm.createContext({
  Module: module,
  Asyncify: { handleSleep: (start) => start(() => resumed++) },
  Browser: {
    safeSetTimeout: (callback) => {
      timer = callback
    }
  }
})
vm.runInContext(sleep, context)
vm.runInContext('_emscripten_sleep(10)', context)
timer()
assert.equal(resumed, 1, 'A running game must continue')
vm.runInContext('_emscripten_sleep(10)', context)
module.xpPaused = true
timer()
assert.equal(resumed, 1, 'A paused game must not continue executing')
assert.equal(typeof module.xpWakeUp, 'function', 'The suspended continuation must be retained')
module.xpPaused = false
const pending = module.xpWakeUp
module.xpWakeUp = null
pending()
assert.equal(resumed, 2, 'Resume must continue the same game')
console.log('Doom checks passed: local runtime integrity, WebAssembly binary, and real Asyncify pause/resume gate.')
