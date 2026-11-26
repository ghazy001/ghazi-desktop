import { createReadStream } from 'node:fs'
import { stat, realpath } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
}
export function byteRange(header, size) {
  if (!header || !header.startsWith('bytes=') || header.includes(',')) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || !size || (!match[1] && !match[2])) return false
  let start, end
  if (!match[1]) {
    const length = Number(match[2])
    if (!length) return false
    start = Math.max(0, size - length)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return false
  return { start, end }
}
export function createStaticHandler(directory) {
  const root = resolve(directory)
  return async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' })
      response.end()
      return
    }
    let pathname
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    } catch {
      response.writeHead(400)
      response.end()
      return
    }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.'))) {
      response.writeHead(404)
      response.end()
      return
    }
    let file = resolve(root, `.${pathname}`)
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(404)
      response.end()
      return
    }
    let info
    try {
      info = await stat(file)
      if (info.isDirectory()) {
        file = resolve(file, 'index.html')
        info = await stat(file)
      }
    } catch {
      if (pathname === '/' || pathname === '/office' || pathname.startsWith('/office/')) {
        file = resolve(root, 'index.html')
        try {
          info = await stat(file)
        } catch {
          response.writeHead(503)
          response.end('Build the portfolio first.')
          return
        }
      } else {
        response.writeHead(404)
        response.end()
        return
      }
    }
    if (!info.isFile()) {
      response.writeHead(404)
      response.end()
      return
    }
    const canonical = await realpath(file)
    if (!canonical.startsWith((await realpath(root)) + sep)) {
      response.writeHead(404)
      response.end()
      return
    }
    const type = types[extname(file).toLowerCase()] || 'application/octet-stream',
      etag = `"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`
    const headers = {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'; font-src 'self' data:; img-src 'self' data: https:;",
      'Accept-Ranges': 'bytes',
      'Last-Modified': info.mtime.toUTCString(),
      ETag: etag,
      'Cache-Control': type.startsWith('text/html') ? 'no-cache' : pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      Vary: 'Accept-Encoding'
    }
    if (request.headers['if-none-match'] === etag) {
      response.writeHead(304, headers)
      response.end()
      return
    }
    const ifRange = request.headers['if-range']
    const range = byteRange(!ifRange || ifRange === etag || ifRange === info.mtime.toUTCString() ? request.headers.range : undefined, info.size)
    if (range === false) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` })
      response.end()
      return
    }
    const compress =
      !range &&
      info.size > 1024 &&
      /^(text\/|application\/(javascript|json|xml|manifest\+json))/.test(type) &&
      /(?:^|,)\s*gzip(?:\s*;\s*q=(?!0(?:\D|$))[^,]*)?(?:,|$)/.test(request.headers['accept-encoding'] || '')
    if (range) {
      headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`
      headers['Content-Length'] = String(range.end - range.start + 1)
    } else if (compress) headers['Content-Encoding'] = 'gzip'
    else headers['Content-Length'] = String(info.size)
    response.writeHead(range ? 206 : 200, headers)
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    const stream = createReadStream(file, range || {})
    try {
      if (compress) await pipeline(stream, createGzip(), response)
      else await pipeline(stream, response)
    } catch {
      response.destroy()
    }
  }
}
