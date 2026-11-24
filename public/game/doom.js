const $ = (id) => document.getElementById(id)
const canvas = $('screen')
let ci,
  dos,
  gain,
  audioContext,
  phase = 'idle',
  hostActive = true,
  hostVolume = 0.2,
  muted = false,
  helpWasRunning = false,
  restartWasRunning = false,
  watchdog
let locale = new URLSearchParams(location.search).get('lang') === 'fr' ? 'fr' : 'en'
const keys = new Map()
const touchKeys = new Map()
const copy = {
  en: {
    pause: 'Pause',
    resume: 'Resume',
    full: 'Full Screen',
    exitFull: 'Exit Full Screen',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    controls: 'Controls',
    restart: 'Restart',
    smooth: 'Smooth picture',
    intro: 'Ready for a quick trip to 1993?',
    play: 'Play Doom',
    hint: 'Arrows / WASD to move · Ctrl to fire · Space to open',
    paused: 'Doom — Paused',
    pausedText: 'Your game is paused.',
    resumeGame: 'Resume Game',
    help: 'Doom — Controls',
    close: 'Close',
    restartTitle: 'Restart Doom?',
    restartNote: 'This will end the current run. Saved games will remain.',
    cancel: 'Cancel',
    ready: 'Ready',
    running: 'Playing',
    loading: 'Loading Doom…',
    focus: 'Click the game to focus',
    retry: 'Try Again',
    error: 'Doom could not start. Reopen the game or try again.',
    note: 'Click the screen before playing. Esc opens the game menu. Shift+Tab returns to the toolbar. F2 saves and F3 loads; saves stay in this browser when site storage is available. On a phone, use the buttons below the screen. Full screen is recommended.',
    open: 'Open',
    fire: 'Fire',
    rows: [
      ['Arrows', 'Move / turn'],
      ['W / S', 'Forward / backward'],
      ['A / D', 'Strafe left / right'],
      ['Ctrl / click', 'Fire'],
      ['Space / E', 'Open doors / use'],
      ['Shift', 'Run'],
      ['1–7', 'Choose weapon'],
      ['Enter / Esc', 'Select / menu'],
      ['Tab', 'Map'],
      ['F2 / F3', 'Save / load game']
    ]
  },
  fr: {
    pause: 'Pause',
    resume: 'Reprendre',
    full: 'Plein écran',
    exitFull: 'Quitter plein écran',
    soundOn: 'Son activé',
    soundOff: 'Son coupé',
    controls: 'Commandes',
    restart: 'Redémarrer',
    smooth: 'Image lissée',
    intro: 'Prêt pour un voyage en 1993 ?',
    play: 'Jouer à Doom',
    hint: 'Flèches / WASD : déplacer · Ctrl : tirer · Espace : ouvrir',
    paused: 'Doom — En pause',
    pausedText: 'Votre partie est en pause.',
    resumeGame: 'Reprendre la partie',
    help: 'Doom — Commandes',
    close: 'Fermer',
    restartTitle: 'Redémarrer Doom ?',
    restartNote: 'La partie en cours sera arrêtée. Les sauvegardes seront conservées.',
    cancel: 'Annuler',
    ready: 'Prêt',
    running: 'Partie en cours',
    loading: 'Chargement de Doom…',
    focus: 'Cliquez sur le jeu pour jouer',
    retry: 'Réessayer',
    error: 'Doom ne démarre pas. Rouvrez le jeu ou réessayez.',
    note: 'Cliquez sur le jeu avant de jouer. Échap ouvre le menu. Maj+Tab revient à la barre d’outils. F2 sauvegarde et F3 charge ; les sauvegardes restent dans ce navigateur si le stockage est disponible. Sur téléphone, utilisez les boutons sous le jeu. Le plein écran est conseillé.',
    open: 'Ouvrir',
    fire: 'Tirer',
    rows: [
      ['Flèches', 'Déplacer / tourner'],
      ['W / S', 'Avancer / reculer'],
      ['A / D', 'Déplacement latéral'],
      ['Ctrl / clic', 'Tirer'],
      ['Espace / E', 'Ouvrir / utiliser'],
      ['Maj', 'Courir'],
      ['1–7', 'Choisir une arme'],
      ['Entrée / Échap', 'Sélection / menu'],
      ['Tab', 'Carte'],
      ['F2 / F3', 'Sauvegarder / charger']
    ]
  }
}
const text = () => copy[locale]
function renderLabels() {
  const t = text()
  document.documentElement.lang = locale
  const labels = {
    fullscreen: document.fullscreenElement ? t.exitFull : t.full,
    sound: muted || hostVolume === 0 ? t.soundOff : t.soundOn,
    controls: t.controls,
    restart: t.restart,
    'smooth-label': t.smooth,
    intro: t.intro,
    'launch-hint': t.hint,
    'paused-title': t.paused,
    'paused-text': t.pausedText,
    resume: t.resumeGame,
    'help-title': t.help,
    'help-note': t.note,
    'close-help': t.close,
    'restart-title': t.restartTitle,
    'restart-note': t.restartNote,
    'confirm-restart': t.restart,
    'cancel-restart': t.cancel,
    'touch-use': t.open,
    'touch-fire': t.fire,
    'status-hint': t.focus
  }
  for (const [id, value] of Object.entries(labels)) $(id).textContent = value
  $('pause').textContent = phase === 'paused' ? t.resume : t.pause
  $('start').textContent = phase === 'error' ? t.retry : t.play
  $('status').textContent = phase === 'running' ? t.running : phase === 'paused' ? t.paused : phase === 'loading' ? t.loading : phase === 'error' ? t.error : t.ready
  $('key-list').replaceChildren(
    ...t.rows.flatMap(([key, description]) => {
      const dt = document.createElement('dt'),
        dd = document.createElement('dd')
      dt.textContent = key
      dd.textContent = description
      return [dt, dd]
    })
  )
  $('sound').setAttribute('aria-pressed', String(muted || hostVolume === 0))
}
function setPhase(next) {
  phase = next
  document.body.dataset.phase = phase
  $('cover').hidden = !['idle', 'loading', 'error'].includes(phase)
  $('paused-overlay').hidden = phase !== 'paused' || !$('help').hidden || !$('restart-dialog').hidden
  $('pause').disabled = !ci
  $('restart').disabled = !ci
  renderLabels()
}
function configureAudio() {
  const context = dos?.SDL?.audioContext
  if (!context) return
  if (audioContext !== context) {
    audioContext = context
    gain = context.createGain()
    gain.connect(context.destination)
    const create = context.createBufferSource.bind(context)
    context.createBufferSource = () => {
      const source = create(),
        connect = source.connect.bind(source)
      source.connect = (target, ...args) => connect(target === context.destination ? gain : target, ...args)
      return source
    }
  }
  gain.gain.value = muted ? 0 : hostVolume
}
function releaseKeys() {
  for (const code of new Set([...keys.values(), ...touchKeys.values()])) ci?.simulateKeyEvent(code, false)
  keys.clear()
  touchKeys.clear()
}
function pause() {
  if (phase !== 'running' || !dos) return
  releaseKeys()
  dos.xpPaused = true
  dos.xpPauseAudio()
  dos.pause() // Flush the persistent DOS filesystem.
  audioContext?.suspend().catch(() => {})
  document.exitPointerLock?.()
  setPhase('paused')
}
function resume() {
  if (!ci || !hostActive || document.hidden) return
  $('help').hidden = true
  $('restart-dialog').hidden = true
  dos.xpPaused = false
  const wakeUp = dos.xpWakeUp
  dos.xpWakeUp = null
  if (wakeUp) wakeUp()
  // If no wake-up is queued yet, the pending Asyncify timer will resume itself.
  dos.xpResumeAudio()
  setPhase('running')
  configureAudio()
  audioContext?.resume().catch(() => {})
  canvas.focus({ preventScroll: true })
}
function fail(error) {
  console.error('Doom startup failed:', error)
  clearTimeout(watchdog)
  dos?.pauseMainLoop?.()
  if (dos) {
    dos.xpPaused = true
    dos.xpPauseAudio?.()
  }
  audioContext?.suspend().catch(() => {})
  $('loading').hidden = false
  $('loading').textContent = text().error
  $('progress').hidden = true
  $('start').hidden = false
  setPhase('error')
}
async function start() {
  if (phase === 'error') {
    location.reload()
    return
  }
  if (phase !== 'idle') return
  setPhase('loading')
  $('start').hidden = true
  $('loading').hidden = false
  $('progress').hidden = false
  $('loading').textContent = text().loading
  watchdog = setTimeout(() => fail(new Error('Startup timed out')), 60000)
  try {
    if (typeof window.Dos !== 'function' || !window.WebAssembly) throw new Error('WebAssembly runtime unavailable')
    const runtime = await window.Dos(canvas, {
      // Version the URL because js-dos also caches its engine in IndexedDB.
      wdosboxUrl: '/game/vendor/wdosbox.js?v=xp-pause-1',
      cycles: 'max 80% limit 35000',
      autolock: false,
      onerror: fail,
      log: (message) => {
        if (message.includes('[ERROR]')) console.error(message)
      },
      onprogress: (_, total, loaded) => {
        $('progress').value = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0
      }
    })
    dos = runtime.fs.dos
    await runtime.fs.extract('/game/DOOM-@evilution.zip', '/doom')
    const config = runtime.fs.fs
      .readFile('/doom/DOOM/DEFAULT.CFG', { encoding: 'utf8' })
      .replace(/key_fire\s+\d+/, 'key_fire 29')
      .replace(/key_use\s+\d+/, 'key_use 57')
      .replace(/key_speed\s+\d+/, 'key_speed 54')
      .replace(/snd_channels\s+\d+/, 'snd_channels 8')
    runtime.fs.fs.writeFile('/doom/DOOM/XP.CFG', config)
    runtime.fs.fs.writeFile(
      '/doom/performance.conf',
      '[render]\nframeskip=0\naspect=false\nscaler=none\n[cpu]\ncore=auto\ncycles=max 80% limit 35000\n[mixer]\nrate=22050\nblocksize=1024\nprebuffer=25\n[sblaster]\noplrate=22050\n[gus]\ngus=false\n[speaker]\npcspeaker=false\ntandy=off\ndisney=false\n[joystick]\njoysticktype=none\n'
    )
    ci = await runtime.main(['-conf', '/doom/performance.conf', '-c', 'cd doom\\DOOM', '-c', 'DOOM.EXE -config XP.CFG -warp 1 1 -skill 2'])
    clearTimeout(watchdog)
    let frames = 0
    dos.registerTickListener(() => {
      if (!gain) configureAudio()
      if (++frames % 35 === 0) canvas.dataset.frames = String(frames)
    })
    if (phase === 'error') return
    setPhase('running')
    fit()
    canvas.focus({ preventScroll: true })
    if (!hostActive || document.hidden) pause()
  } catch (error) {
    fail(error)
  }
}
function fit() {
  const box = $('viewport'),
    width = Math.floor(Math.min(box.clientWidth, (box.clientHeight * 4) / 3))
  box.style.setProperty('--game-width', width + 'px')
  box.style.setProperty('--game-height', Math.floor((width * 3) / 4) + 'px')
}
new ResizeObserver(fit).observe($('viewport'))
$('start').addEventListener('click', start)
$('pause').addEventListener('click', () => (phase === 'running' ? pause() : resume()))
$('resume').addEventListener('click', resume)
canvas.addEventListener('pointerdown', (event) => {
  parent.postMessage({ type: 'doom-focus' }, location.origin)
  if (phase === 'running') {
    configureAudio()
    audioContext?.resume().catch(() => {})
    if (event.pointerType === 'mouse' && event.button === 0) {
      canvas.setPointerCapture(event.pointerId)
      touchKeys.set(event.pointerId, 17)
      ci.simulateKeyEvent(17, true)
    }
  }
})
function releasePointer(event) {
  const code = touchKeys.get(event.pointerId)
  touchKeys.delete(event.pointerId)
  if (code && !Array.from(touchKeys.values()).includes(code) && !Array.from(keys.values()).includes(code)) ci?.simulateKeyEvent(code, false)
}
canvas.addEventListener('pointerup', releasePointer)
canvas.addEventListener('pointercancel', releasePointer)
canvas.addEventListener('lostpointercapture', releasePointer)
canvas.addEventListener('contextmenu', (event) => event.preventDefault())
$('sound').addEventListener('click', () => {
  muted = !muted
  configureAudio()
  renderLabels()
  if (phase === 'running') {
    audioContext?.resume().catch(() => {})
    canvas.focus()
  }
})
$('smooth').addEventListener('change', () => {
  canvas.classList.toggle('smooth', $('smooth').checked)
  if (phase === 'running') canvas.focus()
})
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if ($('player').requestFullscreen) await $('player').requestFullscreen()
    else if ($('player').webkitRequestFullscreen) $('player').webkitRequestFullscreen()
    else parent.postMessage({ type: 'doom-maximize' }, location.origin)
    if (phase === 'running') canvas.focus()
  } catch {
    parent.postMessage({ type: 'doom-maximize' }, location.origin)
  }
})
document.addEventListener('fullscreenchange', () => {
  fit()
  renderLabels()
})
$('controls').addEventListener('click', () => {
  helpWasRunning = phase === 'running'
  pause()
  $('help').hidden = false
  $('paused-overlay').hidden = true
  $('close-help').focus()
})
$('close-help').addEventListener('click', () => {
  $('help').hidden = true
  if (helpWasRunning) resume()
  else setPhase(phase)
})
$('restart').addEventListener('click', () => {
  restartWasRunning = phase === 'running'
  pause()
  $('restart-dialog').hidden = false
  $('paused-overlay').hidden = true
  $('cancel-restart').focus()
})
$('cancel-restart').addEventListener('click', () => {
  $('restart-dialog').hidden = true
  if (restartWasRunning) resume()
  else setPhase(phase)
})
$('confirm-restart').addEventListener('click', async () => {
  await dos?.fs?.syncFs()
  location.reload()
})
const remap = { KeyW: 38, KeyS: 40, KeyE: 32 }
function key(event, pressed) {
  // js-dos's forwarded key events have no physical code; let SDL receive those directly.
  if (!event.code) return
  if (event.target !== canvas) {
    // Keep DOSBox's document keyboard listeners away from native UI controls.
    event.stopImmediatePropagation()
    if (pressed && !event.repeat && ['Enter', 'Space'].includes(event.code) && event.target.matches('button')) {
      event.preventDefault()
      event.target.click()
      return
    }
    const overlay = [$('help'), $('restart-dialog'), $('paused-overlay')].find((element) => !element.hidden)
    if (pressed && event.code === 'Tab' && overlay) {
      event.preventDefault()
      const buttons = Array.from(overlay.querySelectorAll('button:not(:disabled)'))
      const index = buttons.indexOf(document.activeElement)
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }
    if (pressed && event.code === 'Escape' && overlay) {
      event.preventDefault()
      if (!$('help').hidden) $('close-help').click()
      else if (!$('restart-dialog').hidden) $('cancel-restart').click()
      else resume()
    }
    return
  }
  if (pressed && event.code === 'Tab' && event.shiftKey) {
    event.preventDefault()
    event.stopImmediatePropagation()
    releaseKeys()
    $('pause').focus()
    return
  }
  if (phase !== 'running') return
  const code = remap[event.code]
  if (code) {
    event.preventDefault()
    event.stopImmediatePropagation()
    if (pressed && !keys.has(event.code)) {
      keys.set(event.code, code)
      ci.simulateKeyEvent(code, true)
    } else if (!pressed) {
      keys.delete(event.code)
      ci.simulateKeyEvent(code, false)
    }
  } else {
    if (pressed) keys.set(event.code, event.keyCode)
    else keys.delete(event.code)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(event.code)) event.preventDefault()
  }
}
window.addEventListener('keydown', (event) => key(event, true), true)
window.addEventListener('keyup', (event) => key(event, false), true)
window.addEventListener(
  'keypress',
  (event) => {
    if (event.target !== canvas) event.stopImmediatePropagation()
  },
  true
)
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('click', (event) => {
    if (event.detail === 0 && phase === 'running') {
      ci.simulateKeyPress(Number(button.dataset.key))
      canvas.focus({ preventScroll: true })
    }
  })
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    if (phase !== 'running') return
    canvas.focus({ preventScroll: true })
    button.setPointerCapture(event.pointerId)
    const code = Number(button.dataset.key)
    touchKeys.set(event.pointerId, code)
    ci.simulateKeyEvent(code, true)
  })
  button.addEventListener('pointerup', releasePointer)
  button.addEventListener('pointercancel', releasePointer)
  button.addEventListener('lostpointercapture', releasePointer)
}
window.addEventListener('blur', () => {
  releaseKeys()
  pause()
})
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause()
})
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'doom-host') return
  hostActive = event.data.active === true
  hostVolume = Math.min(1, Math.max(0, Number(event.data.volume) || 0))
  locale = event.data.locale === 'fr' ? 'fr' : 'en'
  configureAudio()
  renderLabels()
  if (!hostActive) pause()
})
window.addEventListener('pagehide', () => {
  releaseKeys()
  dos?.pauseMainLoop?.()
  dos?.pause()
  audioContext?.close().catch(() => {})
})
renderLabels()
fit()
