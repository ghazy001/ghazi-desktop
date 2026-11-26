export const CERTIFICATE_WIDTH = 2000
export const CERTIFICATE_HEIGHT = 2240
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
export const characters = (text) => (segmenter ? [...segmenter.segment(text)].map((part) => part.segment) : Array.from(text))
export function normalizeName(value) {
  return String(value)
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}
export function validateName(value) {
  const name = normalizeName(value)
  return { name, error: !name ? 'required' : characters(name).length > 80 ? 'tooLong' : null }
}
export function certificateFilename(name) {
  const safe =
    normalizeName(name)
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'Visitor'
  return `Ghazi-XP-Certificate-${safe}.png`
}
export function createVisit(name, now = new Date()) {
  const checked = validateName(name)
  if (checked.error) throw new Error(checked.error)
  const randomBytes = crypto.getRandomValues(new Uint8Array(3))
  const suffix = Array.from(randomBytes, (value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return {
    name: checked.name,
    issuedAt: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    code: `GX-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${suffix}`
  }
}
export function formatVisitDate(visit, language) {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: visit.timezone }).format(
    new Date(visit.issuedAt)
  )
}
export function wrapText(text, measure, maxWidth) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    const joined = line ? `${line} ${word}` : word
    if (measure(joined) <= maxWidth) {
      line = joined
      continue
    }
    if (line) {
      lines.push(line)
      line = ''
    }
    if (measure(word) <= maxWidth) {
      line = word
      continue
    }
    for (const character of characters(word)) {
      if (line && measure(line + character) > maxWidth) {
        lines.push(line)
        line = ''
      }
      line += character
    }
  }
  if (line) lines.push(line)
  return lines
}
export function fitName(context, name, maxWidth = 780) {
  for (let size = 88; size >= 24; size -= 2) {
    context.font = `600 ${size}px GiftSignature, cursive`
    const lines = wrapText(name, (text) => context.measureText(text).width, maxWidth)
    if (lines.length <= 3 && lines.length * size * 1.15 <= 170) return { lines, size }
  }
  return { lines: wrapText(name, (text) => context.measureText(text).width, maxWidth), size: 24 }
}
export function drawCertificate(canvas, visit, copy, owner, language, giftImage) {
  canvas.width = CERTIFICATE_WIDTH
  canvas.height = CERTIFICATE_HEIGHT
  const c = canvas.getContext('2d')
  c.scale(2, 2)
  c.fillStyle = '#fffef9'
  c.fillRect(0, 0, 1000, 1120)
  const wash = c.createLinearGradient(0, 40, 0, 420)
  wash.addColorStop(0, '#eaf3ff')
  wash.addColorStop(1, '#ffffff')
  c.fillStyle = wash
  c.fillRect(44, 44, 912, 1032)
  c.strokeStyle = '#123ba7'
  c.lineWidth = 13
  c.strokeRect(37, 37, 926, 1046)
  c.strokeStyle = '#d84c43'
  c.lineWidth = 4
  c.setLineDash([18, 12])
  c.strokeRect(57, 57, 886, 1006)
  c.setLineDash([])
  c.strokeStyle = '#d5b45d'
  c.lineWidth = 1
  c.strokeRect(69, 69, 862, 982)
  const text = (value, x, y, size = 24, color = '#263655', family = 'Georgia', weight = 'normal') => {
    c.fillStyle = color
    c.font = `${weight} ${size}px ${family}`
    c.fillText(value, x, y)
  }
  function centered(value, y, size = 24, color, family, weight) {
    c.textAlign = 'center'
    text(value, 500, y, size, color, family, weight)
  }
  function star(x, y, r = 20) {
    c.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        rad = i % 2 ? r * 0.44 : r
      c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
    }
    c.closePath()
    c.fillStyle = '#f1c94e'
    c.fill()
    c.strokeStyle = '#a7852b'
    c.lineWidth = 1.7
    c.stroke()
  }
  ;[
    [96, 99],
    [904, 99],
    [96, 1025],
    [904, 1025]
  ].forEach(([x, y]) => star(x, y))
  if (giftImage) c.drawImage(giftImage, 474, 87, 52, 52)
  centered(copy.brand, 175, 20, '#173e9a', 'Tahoma')
  let titleSize = 64
  c.font = `bold ${titleSize}px Georgia`
  while (c.measureText(copy.title).width > 780) {
    titleSize--
    c.font = `bold ${titleSize}px Georgia`
  }
  c.shadowColor = '#9bafdc'
  c.shadowOffsetY = 2
  centered(copy.title, 259, titleSize, '#153ba4', 'Georgia', 'bold')
  c.shadowOffsetY = 0
  centered(copy.subtitle, 301, 15, '#806524', 'Tahoma')
  c.strokeStyle = '#244dc2'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(143, 330)
  c.lineTo(857, 330)
  c.stroke()
  centered(copy.presented, 389, 26, '#404654')
  const fitted = fitName(c, visit.name)
  const lineHeight = fitted.size * 1.15,
    total = (fitted.lines.length - 1) * lineHeight
  fitted.lines.forEach((line, index) => centered(line, 480 - total / 2 + index * lineHeight, fitted.size, '#163eac', 'GiftSignature, cursive', 600))
  c.font = '25px Georgia'
  const body = wrapText(copy.body, (value) => c.measureText(value).width, 755)
  body.forEach((line, index) => centered(line, 625 + index * 36, 25, '#363b45'))
  centered(copy.closing, 764, 22, '#5c6678', 'Georgia, serif', 'italic')
  c.textAlign = 'left'
  c.font = '22px Georgia'
  const date = wrapText(formatVisitDate(visit, language), (value) => c.measureText(value).width, 255)
  date.forEach((line, index) => text(line, 102, 871 + index * 27, 22, '#30394a'))
  c.strokeStyle = '#758199'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(102, 925)
  c.lineTo(357, 925)
  c.stroke()
  text(copy.date, 102, 951, 15, '#68748a', 'Tahoma')
  // A souvenir seal, rather than a professional accreditation.
  c.fillStyle = '#1f4eb2'
  c.beginPath()
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20,
      r = i % 2 ? 55 : 60
    c.lineTo(500 + Math.cos(a) * r, 886 + Math.sin(a) * r)
  }
  c.closePath()
  c.fill()
  c.fillStyle = '#b88a23'
  c.beginPath()
  c.moveTo(466, 915)
  c.lineTo(462, 974)
  c.lineTo(482, 958)
  c.lineTo(501, 977)
  c.lineTo(502, 915)
  c.fill()
  c.fillStyle = '#e4bf50'
  c.beginPath()
  c.moveTo(502, 915)
  c.lineTo(502, 977)
  c.lineTo(521, 958)
  c.lineTo(541, 974)
  c.lineTo(534, 915)
  c.fill()
  const seal = c.createRadialGradient(483, 866, 4, 500, 887, 54)
  seal.addColorStop(0, '#fff0ab')
  seal.addColorStop(0.7, '#ecc45c')
  seal.addColorStop(1, '#c89b32')
  c.fillStyle = seal
  c.beginPath()
  c.arc(500, 886, 51, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#94701f'
  c.lineWidth = 1
  c.beginPath()
  c.arc(500, 886, 44, 0, Math.PI * 2)
  c.stroke()
  star(500, 865, 11)
  centered(copy.sealTop, 891, 13, '#283d72', 'Tahoma', 'bold')
  centered(copy.sealBottom, 910, 13, '#283d72', 'Tahoma', 'bold')
  c.textAlign = 'center'
  text(owner.name, 752, 898, 42, '#173d94', 'GiftSignature, cursive', 600)
  c.strokeStyle = '#758199'
  c.beginPath()
  c.moveTo(632, 925)
  c.lineTo(876, 925)
  c.stroke()
  text(copy.signature, 752, 951, 15, '#68748a', 'Tahoma')
  centered(copy.footer, 1017, 18, '#7d8190', 'Georgia, serif', 'italic')
  centered(visit.code, 1043, 11, '#66758c', 'monospace')
  return canvas
}
