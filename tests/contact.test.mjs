import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createAppServer } from '../server/index.mjs'
import { createLimiter } from '../server/contact.mjs'
import { submitContact, newSubmissionId } from '../src/lib/contact-mail.mjs'
const payload = (extra = {}) => ({
  email: 'visitor@example.com',
  subject: 'A portfolio enquiry',
  message: 'Hello Ghazi,\nI would like to discuss a project.',
  requestId: '1234567890abcdef1234567890abcdef',
  website: '',
  ...extra
})
const configured = { RESEND_API_KEY: 'test-server-secret', RESEND_FROM_EMAIL: 'Ghazi XP <onboarding@resend.dev>' }
async function fixture(t, options = {}) {
  const calls = [],
    logs = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, ...options })
    return Response.json({ id: 'test-email-id' })
  }
  const server = createAppServer({ contact: { env: configured, fetchImpl, logger: { warn: (value) => logs.push(value) }, ...options } })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => {
    server.closeAllConnections()
    return new Promise((resolve) => server.close(resolve))
  })
  const url = `http://127.0.0.1:${server.address().port}`
  return {
    server,
    url,
    calls,
    logs,
    post: (data = payload(), headers = {}) =>
      fetch(`${url}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
        body: typeof data === 'string' ? data : JSON.stringify(data)
      })
  }
}
test('delivery fixes the recipient and sender, sets Reply-To, and keeps credentials server-side', async (t) => {
  const f = await fixture(t)
  const response = await f.post(payload({ to: 'attacker@example.org', from: 'forged@example.org' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(f.calls.length, 1)
  const call = f.calls[0],
    mail = JSON.parse(call.body)
  assert.equal(call.url, 'https://api.resend.com/emails')
  assert.equal(call.headers.Authorization, `Bearer ${configured.RESEND_API_KEY}`)
  assert.equal(call.headers['Idempotency-Key'], 'portfolio-contact/' + payload().requestId)
  assert.deepEqual(mail.to, ['ghazysaoudi007@gmail.com'])
  assert.equal(mail.from, configured.RESEND_FROM_EMAIL)
  assert.equal(mail.reply_to, 'visitor@example.com')
  assert.equal(mail.subject, '[Ghazi XP] A portfolio enquiry')
  assert.ok(mail.text.includes(payload().message))
  assert.equal(mail.html, undefined)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})
test('retries carry identical provider payload and idempotency key', async (t) => {
  const f = await fixture(t)
  await f.post()
  await f.post()
  assert.equal(f.calls[0].headers['Idempotency-Key'], f.calls[1].headers['Idempotency-Key'])
  assert.equal(f.calls[0].body, f.calls[1].body)
})
test('invalid addresses, headers, message lengths and request IDs never reach Resend', async (t) => {
  const f = await fixture(t)
  for (const invalid of [
    { email: 'bad' },
    { email: 'a@example.com\r\nBcc: victim@example.com' },
    { subject: 'Hello\r\nBcc: victim@example.com' },
    { subject: ' ' },
    { subject: 'x'.repeat(201) },
    { message: ' ' },
    { message: 'x'.repeat(10001) },
    { requestId: 'bad' },
    { message: [] },
    { website: {} }
  ]) {
    const response = await f.post(payload(invalid))
    assert.equal(response.status, 400, JSON.stringify(invalid).slice(0, 70))
  }
  assert.equal(f.calls.length, 0)
})
test('cross-site requests and wrong body types are rejected', async (t) => {
  const f = await fixture(t)
  assert.equal((await f.post(payload(), { Origin: 'https://evil.example' })).status, 403)
  assert.equal((await f.post(payload(), { 'Sec-Fetch-Site': 'cross-site' })).status, 403)
  assert.equal((await f.post(payload(), { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await f.post('{broken')).status, 400)
  assert.equal((await fetch(f.url + '/api/contact')).status, 405)
  assert.equal(f.calls.length, 0)
})
test('oversized JSON is rejected before any provider call', async (t) => {
  const f = await fixture(t)
  assert.equal((await f.post(payload({ message: 'x'.repeat(70000) }))).status, 413)
  assert.equal(f.calls.length, 0)
})
test('honeypot returns a neutral success without sending', async (t) => {
  const f = await fixture(t)
  assert.deepEqual(await (await f.post(payload({ website: 'https://bot.invalid' }))).json(), { ok: true })
  assert.equal(f.calls.length, 0)
})
test('missing configuration gives an actionable error, not false success', async (t) => {
  const f = await fixture(t, { env: {} })
  const response = await f.post()
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error, 'not_configured')
  assert.equal(f.calls.length, 0)
})
test('local clients cannot rotate identity with forged proxy headers', async (t) => {
  const f = await fixture(t, { limiter: createLimiter({ perIp: 1 }) })
  assert.equal((await f.post(payload(), { 'X-Real-IP': '192.0.2.1' })).status, 200)
  const response = await f.post(payload(), { 'X-Real-IP': '192.0.2.2' })
  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('retry-after')) > 0)
  assert.equal(f.calls.length, 1)
})
test('Railway public-edge client identities get independent limits', async (t) => {
  const f = await fixture(t, { env: { ...configured, RAILWAY_ENVIRONMENT_ID: 'test' }, limiter: createLimiter({ perIp: 1 }) })
  assert.equal((await f.post(payload(), { 'X-Real-IP': '192.0.2.1' })).status, 200)
  assert.equal((await f.post(payload(), { 'X-Real-IP': '192.0.2.2' })).status, 200)
  assert.equal((await f.post(payload(), { 'X-Real-IP': '192.0.2.1' })).status, 429)
})
test('provider errors and timeouts do not leak provider details or secrets', async (t) => {
  const f = await fixture(t, { fetchImpl: async () => Response.json({ message: 'private provider details', secret: configured.RESEND_API_KEY }, { status: 403 }) })
  const response = await f.post(),
    body = await response.text()
  assert.equal(response.status, 502)
  assert.equal(JSON.parse(body).error, 'provider_error')
  assert.ok(!body.includes('private'))
  assert.ok(!JSON.stringify(f.logs).includes(configured.RESEND_API_KEY))
  const g = await fixture(t, {
    fetchImpl: async () => {
      throw new DOMException('private timeout', 'TimeoutError')
    }
  })
  assert.equal((await (await g.post()).json()).error, 'timeout')
  const h = await fixture(t, { fetchImpl: async () => Response.json({ error: 'rate limit' }, { status: 429 }) })
  const limited = await h.post()
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '60')
})
test('a successful status without a provider email ID is not accepted', async (t) => {
  const f = await fixture(t, { fetchImpl: async () => Response.json({ ok: true }) })
  assert.equal((await f.post()).status, 502)
})
test('limiter replenishes windows but retains the global hourly cap', () => {
  let time = 0
  const limit = createLimiter({ now: () => time, perIp: 1, globalLimit: 2 })
  assert.equal(limit('a'), 0)
  assert.equal(limit('a'), 900)
  time = 900001
  assert.equal(limit('a'), 0)
  assert.ok(limit('b') > 0)
  time = 3600001
  assert.equal(limit('b'), 0)
})
test('browser transport rejects static fallback HTML and preserves API error codes', async () => {
  await assert.rejects(submitContact(payload(), { fetchImpl: async () => new Response('<html>SPA</html>', { status: 200 }) }), /provider_error/)
  await assert.rejects(
    submitContact(payload(), { fetchImpl: async () => Response.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '120' } }) }),
    (error) => error.message === 'rate_limited' && error.retryAfter === 120
  )
  const ids = new Set(Array.from({ length: 50 }, () => newSubmissionId()))
  assert.equal(ids.size, 50)
  for (const id of ids) assert.match(id, /^[a-f0-9]{32}$/)
})
