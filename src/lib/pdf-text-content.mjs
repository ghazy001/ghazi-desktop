// Safari versions can support getReader() without ReadableStream async
// iteration. Consume PDF.js text chunks through the broadly supported API.
export async function readPdfTextContent(page) {
  const reader = page.streamTextContent().getReader()
  const content = { items: [], styles: Object.create(null), lang: null }
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return content
      content.lang ??= value.lang
      Object.assign(content.styles, value.styles)
      content.items.push(...value.items)
    }
  } finally {
    reader.releaseLock()
  }
}
