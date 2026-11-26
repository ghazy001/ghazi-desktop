<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import profile from '@/data/profile-data.json'
import aboutData from '@/data/paint-about-data.json'
import { drawAbout } from './about-canvas.mjs'
import { bounds, fillPixels, shape, polygon, PaintHistory, palette, tools, MAX_DIMENSION } from './paint-engine.mjs'
import PaintToolIcon from './PaintToolIcon.vue'
import './paint.css'
const emit = defineEmits(['caption-change'])
const locale = useLocaleStore()
const activeWindow = inject('activeWindow', ref(null))
const root = ref(null),
  stage = ref(null),
  canvas = ref(null),
  importer = ref(null),
  editor = ref(null)
const tool = ref('pencil'),
  foreground = ref('#000000'),
  background = ref('#ffffff'),
  brushSize = ref(3),
  fillStyle = ref('outline')
const zoomMode = ref('fit'),
  fitScale = ref(1),
  canvasWidth = ref(aboutData.width),
  canvasHeight = ref(aboutData.height)
const showToolbox = ref(true),
  showColors = ref(true),
  showStatus = ref(true),
  loading = ref(true),
  dirty = ref(false),
  isAbout = ref(true)
const filename = ref(aboutData.en.filename),
  canUndo = ref(false),
  canRedo = ref(false),
  pointerPosition = ref('')
const selection = shallowRef(null),
  textPoint = ref(null),
  textDraft = ref(''),
  textSize = ref(28),
  textFont = ref('PaintHand')
const modal = ref(null),
  sizeWidth = ref(1000),
  sizeHeight = ref(720),
  notice = ref('')
const scale = computed(() => (zoomMode.value === 'fit' ? fitScale.value : Number(zoomMode.value)))
const surfaceStyle = computed(() => ({ width: canvasWidth.value * scale.value + 'px', height: canvasHeight.value * scale.value + 'px' }))
const editorStyle = computed(() => ({
  left: (textPoint.value?.x || 0) * scale.value + 'px',
  top: (textPoint.value?.y || 0) * scale.value + 'px',
  font: `${textSize.value * scale.value}px ${textFont.value}`,
  color: foreground.value,
  width: Math.max(150, Math.min(450, (canvasWidth.value - (textPoint.value?.x || 0)) * scale.value)) + 'px'
}))
const selectionPath = computed(() => {
  const s = selection.value
  if (!s) return ''
  if (s.mask) return s.mask.map((p, i) => `${i ? 'L' : 'M'}${p.x + s.x},${p.y + s.y}`).join(' ') + 'Z'
  return `M${s.x},${s.y}h${s.width}v${s.height}h${-s.width}Z`
})
let history,
  operation = null,
  curve = null,
  polygonDraft = null,
  sprayTimer,
  observer,
  alive = true
const spaceHeld = ref(false)
const t = (key) => (locale.currentLocale === 'fr' ? strings.fr[key] : strings.en[key])
const strings = {
  en: {
    new: 'New',
    open: 'Open…',
    save: 'Save as PNG',
    reset: 'Restore About Me',
    undo: 'Undo',
    redo: 'Redo',
    fit: 'Fit',
    size: 'Brush size',
    style: 'Shape style',
    outline: 'Outline',
    filled: 'Outline + fill',
    solid: 'Solid',
    font: 'Font',
    fontSize: 'Text size',
    help: 'Paint Help',
    cancel: 'Cancel',
    discard: 'Discard changes',
    confirm: 'OK',
    attributes: 'Image Attributes',
    width: 'Width',
    height: 'Height',
    clear: 'Clear image',
    about: 'About Me',
    loading: 'Drawing About Me…',
    ready: 'Choose a tool and make yourself at home.',
    colors: 'Colors: left click for foreground; right click for background.',
    saveDone: 'PNG saved. Your original About Me can be restored from File.',
    discardText: 'Save your drawing before continuing if you want to keep it. Discard changes?',
    invalid: 'Choose a size from 1 to 2000 pixels.',
    imageError: 'This image could not be opened. Choose a PNG, JPEG, WebP or GIF under 20 MB.',
    helpText:
      'Draw with the pencil, brush or spray. Drag to make shapes. A curve takes a line and two control points; a polygon closes with a double-click or Enter. Select an area, then drag it to move it. Delete clears a selection. The eraser uses the background color. Click with Text, type, then click outside to apply. Ctrl/Cmd+Z undoes, Ctrl/Cmd+Y redoes, and Ctrl/Cmd+S saves a PNG. Hold Space and drag to pan. Two fingers pan on a touch screen. Your edits stay while this window is open; save a PNG to keep them.',
    type: 'Type here…',
    swap: 'Swap foreground and background',
    zoom: 'Zoom',
    resetDone: 'Original About Me restored.',
    pan: 'Hold Space and drag to pan.',
    toolbox: 'Toolbox',
    colorbox: 'Color box',
    status: 'Status bar'
  },
  fr: {
    new: 'Nouveau',
    open: 'Ouvrir…',
    save: 'Enregistrer en PNG',
    reset: 'Restaurer À propos de moi',
    undo: 'Annuler',
    redo: 'Rétablir',
    fit: 'Ajuster',
    size: 'Taille du trait',
    style: 'Style de forme',
    outline: 'Contour',
    filled: 'Contour + remplissage',
    solid: 'Plein',
    font: 'Police',
    fontSize: 'Taille du texte',
    help: 'Aide de Paint',
    cancel: 'Annuler',
    discard: 'Abandonner',
    confirm: 'OK',
    attributes: 'Attributs de l’image',
    width: 'Largeur',
    height: 'Hauteur',
    clear: 'Effacer l’image',
    about: 'À propos de moi',
    loading: 'Dessin en cours…',
    ready: 'Choisissez un outil et dessinez !',
    colors: 'Clic gauche : premier plan. Clic droit : arrière-plan.',
    saveDone: 'PNG enregistré. Le dessin original reste disponible dans Fichier.',
    discardText: 'Enregistrez votre dessin pour le conserver. Abandonner les modifications ?',
    invalid: 'Choisissez une taille entre 1 et 2000 pixels.',
    imageError: 'Impossible d’ouvrir cette image. Choisissez un PNG, JPEG, WebP ou GIF de moins de 20 Mo.',
    helpText:
      'Dessinez au crayon, au pinceau ou à l’aérographe. Glissez pour tracer une forme. Une courbe utilise une ligne puis deux points de contrôle ; un polygone se ferme par double-clic ou Entrée. Sélectionnez une zone et glissez-la pour la déplacer. Suppr efface la sélection. La gomme utilise la couleur d’arrière-plan. Avec Texte, cliquez, écrivez puis cliquez ailleurs pour appliquer. Ctrl/Cmd+Z annule, Ctrl/Cmd+Y rétablit et Ctrl/Cmd+S enregistre en PNG. Espace + glisser déplace la vue ; deux doigts font défiler sur écran tactile. Enregistrez votre dessin avant de fermer la fenêtre pour le conserver.',
    type: 'Écrivez ici…',
    swap: 'Inverser les couleurs',
    zoom: 'Zoom',
    resetDone: 'Dessin original restauré.',
    pan: 'Espace + glisser pour déplacer la vue.',
    toolbox: 'Boîte à outils',
    colorbox: 'Palette',
    status: 'Barre d’état'
  }
}
const toolNames = {
  en: {
    lasso: 'Free-form select',
    select: 'Select',
    eraser: 'Eraser',
    fill: 'Fill with color',
    picker: 'Pick color',
    zoom: 'Magnifier',
    pencil: 'Pencil',
    brush: 'Brush',
    spray: 'Airbrush',
    text: 'Text',
    line: 'Line',
    curve: 'Curve',
    rectangle: 'Rectangle',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    rounded: 'Rounded rectangle'
  },
  fr: {
    lasso: 'Sélection libre',
    select: 'Sélection',
    eraser: 'Gomme',
    fill: 'Remplissage',
    picker: 'Pipette',
    zoom: 'Loupe',
    pencil: 'Crayon',
    brush: 'Pinceau',
    spray: 'Aérographe',
    text: 'Texte',
    line: 'Ligne',
    curve: 'Courbe',
    rectangle: 'Rectangle',
    polygon: 'Polygone',
    ellipse: 'Ellipse',
    rounded: 'Rectangle arrondi'
  }
}
const toolName = (name) => toolNames[locale.currentLocale === 'fr' ? 'fr' : 'en'][name]
const context = () => canvas.value.getContext('2d', { willReadFrequently: true })
const snapshot = () => context().getImageData(0, 0, canvasWidth.value, canvasHeight.value)
function dimensions() {
  canvasWidth.value = canvas.value.width
  canvasHeight.value = canvas.value.height
  fit()
}
function fit() {
  if (stage.value?.clientWidth)
    fitScale.value = Math.max(0.1, Math.min(1, (stage.value.clientWidth - 24) / canvasWidth.value, (stage.value.clientHeight - 24) / canvasHeight.value))
}
function caption() {
  emit('caption-change', `${dirty.value ? '*' : ''}${filename.value} - Paint`)
}
watch([filename, dirty], caption)
function makeHistory() {
  history = new PaintHistory(canvas.value, () => {
    dimensions()
    canUndo.value = history.undoStates.length > 1
    canRedo.value = history.redoStates.length > 0
  })
  history.commit()
}
function changed() {
  isAbout.value = false
  history.commit()
  dirty.value = true
  notice.value = ''
  dimensions()
}
function renderAbout() {
  finishPending()
  filename.value = drawAbout(canvas.value, profile, aboutData, locale.currentLocale)
  isAbout.value = true
  dirty.value = false
  selection.value = null
  zoomMode.value = 'fit'
  dimensions()
  makeHistory()
  caption()
}
function whiteCanvas(width = canvasWidth.value, height = canvasHeight.value) {
  canvas.value.width = width
  canvas.value.height = height
  context().fillStyle = background.value
  context().fillRect(0, 0, width, height)
  dimensions()
}
function newImage() {
  finishPending()
  whiteCanvas(1000, 720)
  filename.value = locale.currentLocale === 'fr' ? 'Sans titre.png' : 'Untitled.png'
  isAbout.value = false
  dirty.value = false
  selection.value = null
  zoomMode.value = 'fit'
  makeHistory()
}
function request(action) {
  finishPending()
  if (dirty.value) modal.value = { kind: 'discard', action }
  else action()
}
function confirmDiscard() {
  const action = modal.value.action
  modal.value = null
  action()
}
function chooseTool(name) {
  finishPending()
  selection.value = null
  tool.value = name
  notice.value = ''
}
function color(event, color) {
  if (event.type === 'contextmenu') background.value = color
  else foreground.value = color
}
function point(event) {
  const rect = canvas.value.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(canvasWidth.value - 1, (event.clientX - rect.left) / scale.value)),
    y: Math.max(0, Math.min(canvasHeight.value - 1, (event.clientY - rect.top) / scale.value))
  }
}
const options = (color) => ({ color, background: background.value, width: brushSize.value, fill: fillStyle.value })
function stamp(p, color) {
  const c = context()
  c.fillStyle = color
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2,
      r = Math.sqrt(Math.random()) * Math.max(5, brushSize.value * 3)
    c.fillRect(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r, 1, 1)
  }
}
function stroke(a, b, color) {
  const c = context()
  c.save()
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.lineWidth = tool.value === 'eraser' ? Math.max(8, brushSize.value * 4) : tool.value === 'pencil' ? 1 : brushSize.value
  c.strokeStyle = tool.value === 'eraser' ? background.value : color
  c.beginPath()
  c.moveTo(a.x, a.y)
  c.lineTo(b.x + 0.01, b.y + 0.01)
  c.stroke()
  c.restore()
}
const touchPoints = new Map()
let touchPan = null,
  touchGesture = false
function down(event) {
  if (loading.value || modal.value) return
  if (event.pointerType === 'touch') {
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touchPoints.size === 2) {
      cancelOperation()
      touchGesture = true
      const ps = [...touchPoints.values()]
      touchPan = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2, left: stage.value.scrollLeft, top: stage.value.scrollTop }
      canvas.value.setPointerCapture(event.pointerId)
      return
    }
    if (touchGesture) return
  }
  event.preventDefault()
  canvas.value.focus({ preventScroll: true })
  canvas.value.setPointerCapture(event.pointerId)
  const p = point(event),
    ink = event.button === 2 ? background.value : foreground.value
  if (spaceHeld.value || event.button === 1) {
    operation = { kind: 'pan', clientX: event.clientX, clientY: event.clientY, left: stage.value.scrollLeft, top: stage.value.scrollTop }
    return
  }
  if (tool.value !== 'text') commitText()
  if (tool.value === 'text') {
    commitText()
    textPoint.value = p
    textDraft.value = ''
    nextTick(() => editor.value?.focus())
    return
  }
  if (tool.value === 'zoom') {
    changeZoom(event.button === 2 ? -1 : 1)
    return
  }
  if (tool.value === 'picker') {
    const rgba = context().getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data
    const picked = '#' + [...rgba.slice(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')
    if (event.button === 2) background.value = picked
    else foreground.value = picked
    tool.value = 'pencil'
    return
  }
  if (tool.value === 'fill') {
    const image = snapshot()
    if (fillPixels(image, p.x, p.y, ink)) {
      context().putImageData(image, 0, 0)
      changed()
    }
    return
  }
  if (tool.value === 'curve' && curve) {
    operation = { kind: 'curve-control', start: p }
    return
  }
  if (tool.value === 'polygon') {
    if (!polygonDraft) polygonDraft = { points: [], base: snapshot(), options: options(ink) }
    operation = { kind: 'polygon', start: p }
    return
  }
  if (
    ['select', 'lasso'].includes(tool.value) &&
    selection.value &&
    p.x >= selection.value.x &&
    p.x <= selection.value.x + selection.value.width &&
    p.y >= selection.value.y &&
    p.y <= selection.value.y + selection.value.height
  ) {
    operation = { kind: 'move', start: p, base: snapshot(), original: selection.value }
    return
  }
  selection.value = null
  operation = { kind: ['select', 'lasso'].includes(tool.value) ? tool.value : 'draw', start: p, last: p, base: snapshot(), color: ink, points: [p] }
  if (['pencil', 'brush', 'eraser'].includes(tool.value)) stroke(p, p, ink)
  if (tool.value === 'spray') {
    stamp(p, ink)
    sprayTimer = setInterval(() => {
      if (operation) stamp(operation.last, operation.color)
    }, 40)
  }
}
function move(event) {
  if (event.pointerType === 'touch' && touchPoints.has(event.pointerId)) touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (touchGesture) {
    if (touchPoints.size >= 2 && touchPan) {
      const ps = [...touchPoints.values()]
      stage.value.scrollLeft = touchPan.left - ((ps[0].x + ps[1].x) / 2 - touchPan.x)
      stage.value.scrollTop = touchPan.top - ((ps[0].y + ps[1].y) / 2 - touchPan.y)
    }
    return
  }
  const p = point(event)
  pointerPosition.value = `${Math.round(p.x)}, ${Math.round(p.y)}`
  if (!operation) {
    if (polygonDraft) {
      context().putImageData(polygonDraft.base, 0, 0)
      polygon(context(), [...polygonDraft.points, p], polygonDraft.options, false)
    }
    return
  }
  if (operation.kind === 'pan') {
    stage.value.scrollLeft = operation.left - (event.clientX - operation.clientX)
    stage.value.scrollTop = operation.top - (event.clientY - operation.clientY)
    return
  }
  if (operation.kind === 'move') {
    const s = operation.original,
      x = Math.max(0, Math.min(canvasWidth.value - s.width, s.x + p.x - operation.start.x)),
      y = Math.max(0, Math.min(canvasHeight.value - s.height, s.y + p.y - operation.start.y))
    context().putImageData(operation.base, 0, 0)
    clearSelectionPixels(s)
    context().drawImage(s.image, x, y)
    selection.value = { ...s, x, y }
    return
  }
  if (operation.kind === 'curve-control') {
    redrawCurve([...curve.controls, p])
    return
  }
  if (operation.kind === 'polygon') return
  if (['select', 'lasso'].includes(operation.kind)) {
    operation.points.push(p)
    context().putImageData(operation.base, 0, 0)
    const c = context()
    c.save()
    c.setLineDash([3, 3])
    c.strokeStyle = '#444'
    c.lineWidth = 1
    if (operation.kind === 'lasso') {
      c.beginPath()
      c.moveTo(operation.start.x, operation.start.y)
      operation.points.slice(1).forEach((p) => c.lineTo(p.x, p.y))
      c.stroke()
    } else {
      const b = bounds(operation.start, p)
      c.strokeRect(b.x, b.y, b.width, b.height)
    }
    c.restore()
  } else if (['pencil', 'brush', 'eraser'].includes(tool.value)) stroke(operation.last, p, operation.color)
  else if (tool.value === 'spray') stamp(p, operation.color)
  else {
    context().putImageData(operation.base, 0, 0)
    shape(context(), tool.value, operation.start, p, options(operation.color))
  }
  operation.last = p
}
function up(event) {
  touchPoints.delete(event.pointerId)
  if (touchGesture) {
    if (!touchPoints.size) {
      touchGesture = false
      touchPan = null
    }
    return
  }
  if (!operation) return
  clearInterval(sprayTimer)
  const p = point(event),
    op = operation
  operation = null
  if (op.kind === 'pan') return
  if (op.kind === 'move') {
    if (selection.value.x !== op.original.x || selection.value.y !== op.original.y) changed()
    return
  }
  if (op.kind === 'curve-control') {
    curve.controls.push(p)
    redrawCurve(curve.controls)
    if (curve.controls.length === 2) finishCurve()
    return
  }
  if (op.kind === 'polygon') {
    if (!polygonDraft.points.length || Math.hypot(p.x - polygonDraft.points.at(-1).x, p.y - polygonDraft.points.at(-1).y) > 2) polygonDraft.points.push(p)
    context().putImageData(polygonDraft.base, 0, 0)
    polygon(context(), polygonDraft.points, polygonDraft.options, false)
    return
  }
  if (op.kind === 'select' || op.kind === 'lasso') {
    context().putImageData(op.base, 0, 0)
    makeSelection(op, p)
    return
  }
  if (tool.value === 'curve') {
    curve = { a: op.start, b: p, base: op.base, options: options(op.color), controls: [] }
    redrawCurve([])
    return
  }
  if (!['pencil', 'brush', 'eraser', 'spray'].includes(tool.value)) {
    context().putImageData(op.base, 0, 0)
    shape(context(), tool.value, op.start, p, options(op.color))
  }
  changed()
}
function makeSelection(op, end) {
  const points = op.kind === 'lasso' ? op.points : [op.start, end]
  const edges = points.reduce((b, p) => ({ left: Math.min(b.left, p.x), top: Math.min(b.top, p.y), right: Math.max(b.right, p.x), bottom: Math.max(b.bottom, p.y) }), {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity
  })
  const rect = op.kind === 'lasso' ? bounds({ x: edges.left, y: edges.top }, { x: edges.right, y: edges.bottom }) : bounds(op.start, end)
  rect.width = Math.min(rect.width, canvasWidth.value - rect.x)
  rect.height = Math.min(rect.height, canvasHeight.value - rect.y)
  if (rect.width < 2 || rect.height < 2) return
  const image = document.createElement('canvas')
  image.width = rect.width
  image.height = rect.height
  const c = image.getContext('2d')
  c.drawImage(canvas.value, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
  const mask = op.kind === 'lasso' ? points.map((p) => ({ x: p.x - rect.x, y: p.y - rect.y })) : null
  if (mask) {
    c.globalCompositeOperation = 'destination-in'
    c.beginPath()
    c.moveTo(mask[0].x, mask[0].y)
    mask.slice(1).forEach((p) => c.lineTo(p.x, p.y))
    c.closePath()
    c.fill()
  }
  selection.value = { ...rect, image, mask }
}
function clearSelectionPixels(s) {
  const c = context()
  c.save()
  c.fillStyle = background.value
  if (s.mask) {
    c.beginPath()
    c.moveTo(s.x + s.mask[0].x, s.y + s.mask[0].y)
    s.mask.slice(1).forEach((p) => c.lineTo(s.x + p.x, s.y + p.y))
    c.closePath()
    c.fill()
  } else c.fillRect(s.x, s.y, s.width, s.height)
  c.restore()
}
function deleteSelection() {
  if (selection.value) {
    clearSelectionPixels(selection.value)
    selection.value = null
    changed()
  }
}
function redrawCurve(controls) {
  context().putImageData(curve.base, 0, 0)
  shape(context(), 'curve', curve.a, curve.b, curve.options, controls)
}
function finishCurve() {
  if (curve) {
    redrawCurve(curve.controls)
    curve = null
    changed()
  }
}
function finishPolygon() {
  if (polygonDraft) {
    context().putImageData(polygonDraft.base, 0, 0)
    polygon(context(), polygonDraft.points, polygonDraft.options, true)
    polygonDraft = null
    changed()
  }
}
function commitText() {
  if (textPoint.value && textDraft.value) {
    const c = context()
    c.fillStyle = foreground.value
    c.font = `${textSize.value}px ${textFont.value}, cursive`
    c.textBaseline = 'top'
    textDraft.value.split('\n').forEach((line, index) => c.fillText(line, textPoint.value.x, textPoint.value.y + index * textSize.value * 1.2))
    changed()
  }
  textPoint.value = null
  textDraft.value = ''
}
function finishPending() {
  if (!canvas.value || loading.value) return
  commitText()
  finishCurve()
  finishPolygon()
  selection.value = null
}
function cancelPointer(event) {
  touchPoints.delete(event.pointerId)
  if (!touchPoints.size) {
    touchPan = null
    touchGesture = false
  }
  cancelOperation()
}
function cancelOperation() {
  clearInterval(sprayTimer)
  if (operation?.base) context().putImageData(operation.base, 0, 0)
  if (operation?.kind === 'move') selection.value = operation.original
  operation = null
}
function escape() {
  cancelOperation()
  if (curve) {
    context().putImageData(curve.base, 0, 0)
    curve = null
  }
  if (polygonDraft) {
    context().putImageData(polygonDraft.base, 0, 0)
    polygonDraft = null
  }
  selection.value = null
  textPoint.value = null
  textDraft.value = ''
  modal.value = null
}
function undo() {
  if (loading.value) return
  finishPending()
  if (history.undo()) dirty.value = true
}
function redo() {
  if (loading.value) return
  finishPending()
  if (history.redo()) dirty.value = true
}
function changeZoom(direction) {
  const levels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],
    current = scale.value
  zoomMode.value = String(direction > 0 ? levels.find((x) => x > current + 0.01) || 4 : [...levels].reverse().find((x) => x < current - 0.01) || 0.25)
}
function save() {
  finishPending()
  canvas.value.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob),
      a = document.createElement('a')
    a.href = url
    a.download = filename.value.replace(/\.[^.]+$/, '') + '.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    dirty.value = false
    notice.value = t('saveDone')
  }, 'image/png')
}
async function openImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    modal.value = { kind: 'message', text: t('imageError') }
    return
  }
  const url = URL.createObjectURL(file),
    image = new Image()
  image.onload = () => {
    if (!alive) {
      URL.revokeObjectURL(url)
      return
    }
    const factor = Math.min(1, MAX_DIMENSION / image.naturalWidth, MAX_DIMENSION / image.naturalHeight)
    whiteCanvas(Math.max(1, Math.round(image.naturalWidth * factor)), Math.max(1, Math.round(image.naturalHeight * factor)))
    context().drawImage(image, 0, 0, canvasWidth.value, canvasHeight.value)
    filename.value = file.name
    dirty.value = false
    isAbout.value = false
    selection.value = null
    zoomMode.value = 'fit'
    makeHistory()
    URL.revokeObjectURL(url)
  }
  image.onerror = () => {
    URL.revokeObjectURL(url)
    modal.value = { kind: 'message', text: t('imageError') }
  }
  image.src = url
}
function transform(kind) {
  finishPending()
  const original = document.createElement('canvas')
  original.width = canvasWidth.value
  original.height = canvasHeight.value
  original.getContext('2d').drawImage(canvas.value, 0, 0)
  const w = original.width,
    h = original.height
  whiteCanvas(kind === 'rotate' ? h : w, kind === 'rotate' ? w : h)
  const c = context()
  c.save()
  if (kind === 'horizontal') {
    c.translate(w, 0)
    c.scale(-1, 1)
  }
  if (kind === 'vertical') {
    c.translate(0, h)
    c.scale(1, -1)
  }
  if (kind === 'rotate') {
    c.translate(h, 0)
    c.rotate(Math.PI / 2)
  }
  c.drawImage(original, 0, 0)
  c.restore()
  changed()
}
function attributes() {
  finishPending()
  sizeWidth.value = canvasWidth.value
  sizeHeight.value = canvasHeight.value
  modal.value = { kind: 'size' }
}
function resizeImage() {
  const w = Math.round(Number(sizeWidth.value)),
    h = Math.round(Number(sizeHeight.value))
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > MAX_DIMENSION || h > MAX_DIMENSION) {
    notice.value = t('invalid')
    return
  }
  const image = snapshot()
  whiteCanvas(w, h)
  context().putImageData(image, 0, 0)
  modal.value = null
  selection.value = null
  changed()
}
function selectAll() {
  finishPending()
  makeSelection({ kind: 'select', start: { x: 0, y: 0 }, points: [] }, { x: canvasWidth.value, y: canvasHeight.value })
  tool.value = 'select'
}
function command(event) {
  if (activeWindow.value !== 'paint' || loading.value || modal.value) return
  const action = event.detail
  if (action === 'new') request(newImage)
  if (action === 'open') request(() => importer.value.click())
  if (action === 'save') save()
  if (action === 'reset') request(renderAbout)
  if (action === 'undo') undo()
  if (action === 'redo') redo()
  if (action === 'selectAll') selectAll()
  if (action === 'delete') deleteSelection()
  if (action === 'clear') {
    finishPending()
    whiteCanvas()
    changed()
  }
  if (action === 'flipH') transform('horizontal')
  if (action === 'flipV') transform('vertical')
  if (action === 'rotate') transform('rotate')
  if (action === 'attributes') attributes()
  if (action === 'zoomIn') changeZoom(1)
  if (action === 'zoomOut') changeZoom(-1)
  if (action === 'actual') zoomMode.value = '1'
  if (action === 'fit') zoomMode.value = 'fit'
  if (action === 'toolbox') showToolbox.value = !showToolbox.value
  if (action === 'colors') showColors.value = !showColors.value
  if (action === 'status') showStatus.value = !showStatus.value
  if (action === 'swap') {
    const a = foreground.value
    foreground.value = background.value
    background.value = a
  }
  if (action === 'help') modal.value = { kind: 'help' }
}
function keydown(event) {
  if (activeWindow.value !== 'paint' || loading.value) return
  if (modal.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      modal.value = null
    }
    if (event.key === 'Tab') {
      const nodes = [...root.value.querySelectorAll('.paint-dialog input, .paint-dialog button')]
      const index = nodes.indexOf(document.activeElement)
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === nodes.length - 1)) {
        event.preventDefault()
        nodes[event.shiftKey ? nodes.length - 1 : 0]?.focus()
      }
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    save()
    return
  }
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
  const mod = event.ctrlKey || event.metaKey,
    k = event.key.toLowerCase()
  if (mod && ['z', 'y', 's', 'n', 'o', 'a'].includes(k)) {
    event.preventDefault()
    if (k === 'z') event.shiftKey ? redo() : undo()
    if (k === 'y') redo()
    if (k === 's') save()
    if (k === 'n') request(newImage)
    if (k === 'o') request(() => importer.value.click())
    if (k === 'a') selectAll()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    escape()
  }
  if (event.key === 'Enter') {
    finishCurve()
    finishPolygon()
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selection.value) {
      event.preventDefault()
      deleteSelection()
    }
  }
  if (event.code === 'Space') {
    spaceHeld.value = true
    if (event.target === canvas.value) event.preventDefault()
  }
}
const keyup = (event) => {
  if (event.code === 'Space') spaceHeld.value = false
}
const blur = () => {
  spaceHeld.value = false
  cancelOperation()
  touchPoints.clear()
  touchPan = null
  touchGesture = false
}
watch(modal, async (value) => {
  if (value) {
    await nextTick()
    root.value?.querySelector('.paint-dialog input, .paint-dialog button')?.focus()
  }
})
watch(
  () => locale.currentLocale,
  () => {
    if (!dirty.value && isAbout.value && !loading.value) renderAbout()
  }
)
onMounted(async () => {
  observer = new ResizeObserver(fit)
  observer.observe(stage.value)
  window.addEventListener('paint-command', command)
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', blur)
  try {
    await Promise.all([document.fonts.load('500 28px PaintHand'), document.fonts.load('700 64px PaintHand')])
  } catch {}
  if (!alive) return
  loading.value = false
  renderAbout()
  await nextTick()
  fit()
})
onBeforeUnmount(() => {
  alive = false
  clearInterval(sprayTimer)
  observer?.disconnect()
  window.removeEventListener('paint-command', command)
  window.removeEventListener('keydown', keydown)
  window.removeEventListener('keyup', keyup)
  window.removeEventListener('blur', blur)
})
</script>

<template>
  <div ref="root" class="xp-paint">
    <input ref="importer" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden @change="openImage" />
    <div v-if="tool === 'text'" class="paint-text-format">
      <label
        >{{ t('font') }}
        <select v-model="textFont">
          <option value="PaintHand">{{ locale.currentLocale === 'fr' ? 'Manuscrit' : 'Handwriting' }}</option>
          <option value="Arial">Arial</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Times New Roman">Times New Roman</option>
        </select></label
      ><label
        >{{ t('fontSize') }}
        <select v-model.number="textSize">
          <option v-for="size in [14, 18, 24, 28, 36, 48, 64]" :key="size">{{ size }}</option>
        </select></label
      >
    </div>
    <div class="paint-main">
      <aside v-show="showToolbox" class="paint-toolbox" :aria-label="t('toolbox')">
        <div class="paint-tools" role="toolbar" :aria-label="t('toolbox')">
          <button
            v-for="name in tools"
            :key="name"
            @click="chooseTool(name)"
            :aria-label="toolName(name)"
            :title="toolName(name)"
            :aria-pressed="tool === name"
            :disabled="loading"
          >
            <PaintToolIcon :name="name" />
          </button>
        </div>
        <div class="paint-tool-options">
          <label :title="t('size')"
            ><span>{{ brushSize }} px</span><input type="range" min="1" max="16" v-model.number="brushSize" :aria-label="t('size')"
          /></label>
          <div v-if="['rectangle', 'ellipse', 'rounded', 'polygon'].includes(tool)" class="paint-fill-styles" :aria-label="t('style')">
            <button
              v-for="style in ['outline', 'filled', 'solid']"
              :key="style"
              :aria-label="t(style)"
              :title="t(style)"
              :aria-pressed="fillStyle === style"
              @click="fillStyle = style"
            >
              <span :class="style"></span>
            </button>
          </div>
        </div>
      </aside>
      <div ref="stage" class="paint-workspace" :class="{ panning: spaceHeld }">
        <div class="paint-surface" :style="surfaceStyle">
          <canvas
            ref="canvas"
            tabindex="0"
            :aria-label="filename + ' — ' + profile.name + '. ' + t('ready')"
            aria-describedby="paint-about-transcript"
            @pointerdown="down"
            @pointermove="move"
            @pointerup="up"
            @pointercancel="cancelPointer"
            @contextmenu.prevent
            @dblclick="finishPolygon"
          ></canvas>
          <svg v-if="selection" class="paint-selection" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" aria-hidden="true">
            <path :d="selectionPath" fill="none" stroke="black" :stroke-width="1 / scale" :stroke-dasharray="`${4 / scale} ${3 / scale}`" />
          </svg>
          <textarea
            v-if="textPoint"
            ref="editor"
            v-model="textDraft"
            class="paint-text-editor"
            :style="editorStyle"
            :aria-label="t('type')"
            :placeholder="t('type')"
            @blur="commitText"
            @keydown.ctrl.enter.prevent="commitText"
            @keydown.meta.enter.prevent="commitText"
            @keydown.esc.stop.prevent="textPoint = null"
          ></textarea>
        </div>
      </div>
    </div>
    <div class="paint-bottom">
      <div v-show="showColors" class="paint-colors" :title="t('colors')">
        <button class="paint-current-colors" @click="command({ detail: 'swap' })" :aria-label="t('swap')">
          <span :style="{ background: background }"></span><span :style="{ background: foreground }"></span>
        </button>
        <div class="paint-palette">
          <button
            v-for="colorValue in palette"
            :key="colorValue"
            :style="{ background: colorValue }"
            :aria-label="colorValue"
            :title="colorValue"
            @click="color($event, colorValue)"
            @contextmenu.prevent="color($event, colorValue)"
          ></button>
        </div>
      </div>
      <div class="paint-quick-tools">
        <button @click="undo" :disabled="!canUndo" :aria-label="t('undo')" :title="t('undo')"><PaintToolIcon name="undo" /></button
        ><button @click="redo" :disabled="!canRedo" :aria-label="t('redo')" :title="t('redo')"><PaintToolIcon name="redo" /></button
        ><button @click="save" :disabled="loading" :aria-label="t('save')" :title="t('save')"><PaintToolIcon name="save" /></button
        ><select v-model="zoomMode" :aria-label="t('zoom')">
          <option value="fit">{{ t('fit') }}</option>
          <option v-for="level in [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]" :key="level" :value="String(level)">{{ level * 100 }}%</option>
        </select>
      </div>
    </div>
    <footer v-show="showStatus" class="paint-status">
      <span role="status">{{ loading ? t('loading') : notice || toolName(tool) }}</span><span>{{ pointerPosition }}</span
      ><span>{{ canvasWidth }} × {{ canvasHeight }}</span
      ><span>{{ Math.round(scale * 100) }}%</span>
    </footer>
    <article id="paint-about-transcript" class="sr-only">
      <h1>{{ profile.name }} — {{ t('about') }}</h1>
      <p>{{ profile.title }}</p>
      <p v-for="paragraph in profile.bio" :key="paragraph">{{ paragraph }}</p>
      <p>{{ profile.location }} · {{ profile.email }}</p>
      <p v-for="entry in profile.education" :key="entry.degree">{{ entry.degree }} — {{ entry.institution }} — {{ entry.year }}</p>
      <p v-for="group in profile.skills" :key="group.category">{{ group.category }}: {{ group.items.join(', ') }}</p>
    </article>
    <div v-if="modal" class="paint-modal-shade" @keydown.esc.stop="modal = null">
      <section
        class="paint-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="modal.kind === 'size' ? t('attributes') : modal.kind === 'discard' ? 'Paint' : t('help')"
      >
        <header>{{ modal.kind === 'size' ? t('attributes') : modal.kind === 'discard' ? 'Paint' : t('help') }}</header>
        <div class="paint-dialog-body">
          <template v-if="modal.kind === 'size'"
            ><label>{{ t('width') }} <input v-model="sizeWidth" type="number" min="1" :max="MAX_DIMENSION" /></label
            ><label>{{ t('height') }} <input v-model="sizeHeight" type="number" min="1" :max="MAX_DIMENSION" /></label>
            <p>{{ notice }}</p>
            <div class="paint-dialog-actions">
              <button class="xp-button" @click="resizeImage">{{ t('confirm') }}</button><button class="xp-button" @click="modal = null">{{ t('cancel') }}</button>
            </div></template
          ><template v-else
            ><p>{{ modal.kind === 'discard' ? t('discardText') : modal.text || t('helpText') }}</p>
            <div class="paint-dialog-actions">
              <button v-if="modal.kind === 'discard'" class="xp-button" @click="confirmDiscard">{{ t('discard') }}</button><button
                class="xp-button"
                @click="modal = null"
              >
                {{ modal.kind === 'discard' ? t('cancel') : t('confirm') }}
              </button>
            </div></template
          >
        </div>
      </section>
    </div>
  </div>
</template>
