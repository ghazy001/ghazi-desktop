// PDF text fragments do not reliably preserve word or heading spacing.
// Keep original character offsets so matches can be highlighted precisely.
export function normalizePdfText(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/\s/gu, '')
}

export function indexPdfText(items) {
  let text = ''
  const positions = []
  let item = 0
  for (const entry of items) {
    if (typeof entry.str !== 'string') continue
    let offset = 0
    for (const character of entry.str) {
      const normalized = normalizePdfText(character)
      text += normalized
      for (let index = 0; index < normalized.length; index++) positions.push({ item, start: offset, end: offset + character.length })
      offset += character.length
    }
    item++
  }
  return { text, positions }
}

export function findPdfMatches(pages, query) {
  const needle = normalizePdfText(query)
  if (!needle) return []
  const matches = []
  for (const { number, index } of pages) {
    let offset = index.text.indexOf(needle)
    while (offset !== -1) {
      const segments = []
      for (const position of index.positions.slice(offset, offset + needle.length)) {
        const last = segments.at(-1)
        if (last?.item === position.item) last.end = position.end
        else segments.push({ ...position })
      }
      matches.push({ page: number, offset, segments })
      offset = index.text.indexOf(needle, offset + needle.length)
    }
  }
  return matches
}
