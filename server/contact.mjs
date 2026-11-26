import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { readFileSync } from 'node:fs'
const profile = JSON.parse(readFileSync(new URL('../src/data/profile-data.json', import.meta.url)))
const MAX_BODY = 64 * 1024
export function validateMessage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid_request' }
  const { email, subject, message, requestId, website = '' } = body
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/u.test(email)) return { error: 'invalid_email' }
  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 200 || /[\u0000-\u001f\u007f]/u.test(subject)) return { error: 'invalid_subject' }
  if (typeof message !== 'string' || !message.trim() || message.length > 10000 || message.includes('\0')) return { error: 'invalid_message' }
  if (typeof requestId !== 'string' || !/^[a-f0-9]{32}$/i.test(requestId)) return { error: 'invalid_request' }
  if (typeof website !== 'string' || website.length > 500) return { error: 'invalid_request' }
  return { data: { email: email.trim(), subject: subject.trim(), message: message.trim(), requestId, spam: !!website.trim() } }
}
export function createLimiter({ now = Date.now, perIp = 5, globalLimit = 50, maxEntries = 10000 } = {}) {
  const clients = new Map()
  let hour = { start: now(), count: 0 }
  return (key) => {
    const time = now(),
      windowMs = 15 * 60 * 1000
    if (time - hour.start >= 60 * 60 * 1000) hour = { start: time, count: 0 }
    if (hour.count >= globalLimit) return Math.max(1, Math.ceil((hour.start + 60 * 60 * 1000 - time) / 1000))
    for (const [ip, value] of clients) if (time - value.start >= windowMs) clients.delete(ip)
    const current = clients.get(key) || { start: time, count: 0 }
    if (current.count >= perIp) return Math.max(1, Math.ceil((current.start + windowMs - time) / 1000))
    if (!clients.has(key) && clients.size >= maxEntries) return 60
    current.count++
    hour.count++
    clients.set(key, current)
    return 0
  }
}
function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers })
  response.end(JSON.stringify(body))
}
async function readJson(request) {
  let bytes = 0,
    chunks = []
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length
    if (bytes > MAX_BODY) {
      const error = new Error('too_large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
export function createContactHandler({ env = process.env, fetchImpl = globalThis.fetch, limiter = createLimiter(), logger = console } = {}) {
  // Every request goes to the owner's verified contact inbox, never a client-supplied recipient.
  const recipient = profile.email
  return async (request, response) => {
    if (request.method !== 'POST') return json(response, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' })
    const origin = request.headers.origin
    const allowed = (env.CONTACT_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (request.headers['sec-fetch-site'] === 'cross-site') return json(response, 403, { ok: false, error: 'origin_not_allowed' })
    if (origin) {
      try {
        if (new URL(origin).host !== request.headers.host && !allowed.includes(origin)) return json(response, 403, { ok: false, error: 'origin_not_allowed' })
      } catch {
        return json(response, 403, { ok: false, error: 'origin_not_allowed' })
      }
    }
    if (
      !/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '') ||
      (request.headers['content-encoding'] && request.headers['content-encoding'] !== 'identity')
    )
      return json(response, 415, { ok: false, error: 'invalid_request' })
    if (Number(request.headers['content-length']) > MAX_BODY) {
      request.resume()
      return json(response, 413, { ok: false, error: 'too_large' })
    }
    let checked
    try {
      checked = validateMessage(await readJson(request))
    } catch (error) {
      request.resume()
      return json(response, error.status || 400, { ok: false, error: error.status === 413 ? 'too_large' : 'invalid_request' })
    }
    if (checked.error) return json(response, 400, { ok: false, error: checked.error })
    const data = checked.data
    if (data.spam) return json(response, 200, { ok: true })
    const key = env.RESEND_API_KEY?.trim(),
      from = env.RESEND_FROM_EMAIL?.trim()
    if (!key || !from || /[\r\n]/.test(from)) return json(response, 503, { ok: false, error: 'not_configured' })
    // Railway's public edge supplies X-Real-IP. Ignore forwarded identities on direct/local servers.
    const forwardedIp = env.RAILWAY_ENVIRONMENT_ID ? request.headers['x-real-ip'] : undefined
    const ip = typeof forwardedIp === 'string' && isIP(forwardedIp) ? forwardedIp : request.socket.remoteAddress || 'unknown'
    const retryAfter = limiter(createHash('sha256').update(ip).digest('hex'))
    if (retryAfter) return json(response, 429, { ok: false, error: 'rate_limited' }, { 'Retry-After': String(retryAfter) })
    try {
      const result = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `portfolio-contact/${data.requestId}` },
        body: JSON.stringify({ from, to: [recipient], reply_to: data.email, subject: `[Ghazi XP] ${data.subject}`, text: `From: ${data.email}\n\n${data.message}` }),
        signal: AbortSignal.timeout(15000)
      })
      const payload = await result.json().catch(() => null)
      if (!result.ok || typeof payload?.id !== 'string' || !payload.id) {
        // Never log the key, message contents, email addresses or raw provider response.
        logger.warn(`Contact delivery rejected by provider (HTTP ${result.status}).`)
        return json(
          response,
          result.status === 429 ? 429 : 502,
          { ok: false, error: result.status === 429 ? 'rate_limited' : 'provider_error' },
          result.status === 429 ? { 'Retry-After': '60' } : {}
        )
      }
      return json(response, 200, { ok: true })
    } catch (error) {
      logger.warn('Contact delivery could not be confirmed.')
      return json(response, 502, { ok: false, error: ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'provider_error' })
    }
  }
}
export function contactDevPlugin(env) {
  return {
    name: 'portfolio-contact-api',
    configureServer(server) {
      const handle = createContactHandler({ env })
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0]
        if (path === '/api/contact') handle(request, response).catch(() => json(response, 500, { ok: false, error: 'server_error' }))
        else if (path?.startsWith('/api/')) json(response, 404, { ok: false, error: 'not_found' })
        else next()
      })
    }
  }
}
