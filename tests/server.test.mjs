import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request } from 'node:http'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAppServer } from '../server/index.mjs'
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'xp-server-'))
  await mkdir(join(dir, 'assets'))
  await writeFile(join(dir, 'index.html'), '<html>Ghazi XP</html>')
  await writeFile(join(dir, 'assets', 'worker.mjs'), 'export const ready = true;\n'.repeat(150))
  await writeFile(join(dir, 'song.mp3'), Buffer.from('0123456789'))
  await writeFile(join(dir, 'game.wasm'), Buffer.from([0, 97, 115, 109]))
  await writeFile(join(dir, '.env'), 'RESEND_API_KEY=must-never-be-served')
  const external = join(dir, '..', `secret-${Date.now()}-${Math.random()}.txt`)
  await writeFile(external, 'private')
  await symlink(external, join(dir, 'escape.txt'))
  const server = createAppServer({ directory: dir, contact: { env: {} } })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await rm(dir, { recursive: true, force: true })
    await rm(external, { force: true })
  })
  const url = `http://127.0.0.1:${server.address().port}`
  return { url, server }
}
test('production serves SPA routes, health, modules, WASM and compressed text', async (t) => {
  const { url } = await fixture(t)
  for (const path of ['/', '/office', '/office/any-window']) {
    const res = await fetch(url + path)
    assert.equal(res.status, 200)
    assert.ok((await res.text()).includes('Ghazi XP'))
    assert.equal(res.headers.get('cache-control'), 'no-cache')
  }
  assert.deepEqual(await (await fetch(url + '/healthz')).json(), { ok: true })
  const module = await fetch(url + '/assets/worker.mjs')
  assert.match(module.headers.get('content-type'), /javascript/)
  assert.equal(module.headers.get('content-encoding'), 'gzip')
  assert.ok((await module.text()).startsWith('export'))
  assert.match((await fetch(url + '/game.wasm')).headers.get('content-type'), /application\/wasm/)
})
test('media and PDF-style byte ranges support seeking, suffixes, HEAD and cache revalidation', async (t) => {
  const { url } = await fixture(t)
  for (const [range, expected, contentRange] of [
    ['bytes=2-5', '2345', 'bytes 2-5/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10']
  ]) {
    const res = await fetch(url + '/song.mp3', { headers: { Range: range } })
    assert.equal(res.status, 206)
    assert.equal(await res.text(), expected)
    assert.equal(res.headers.get('content-range'), contentRange)
  }
  assert.equal((await fetch(url + '/song.mp3', { headers: { Range: 'bytes=99-100' } })).status, 416)
  const head = await fetch(url + '/song.mp3', { method: 'HEAD' })
  assert.equal(head.headers.get('content-length'), '10')
  assert.equal(await head.text(), '')
  const cached = await fetch(url + '/song.mp3', { headers: { 'If-None-Match': head.headers.get('etag') } })
  assert.equal(cached.status, 304)
  assert.equal(await (await fetch(url + '/song.mp3', { headers: { Range: 'bytes=2-3', 'If-Range': 'old-etag' } })).text(), '0123456789')
})
test('unknown API routes, secret files, encoded traversal and escaping symlinks are not served', async (t) => {
  const { url } = await fixture(t)
  for (const path of ['/.env', '/%2eenv', '/%2e%2e/.env', '/escape.txt', '/missing.js']) assert.equal((await fetch(url + path)).status, 404, path)
  const res = await fetch(url + '/api/unknown')
  assert.equal(res.status, 404)
  assert.match(res.headers.get('content-type'), /json/)
  assert.equal((await fetch(url + '/song.mp3', { method: 'POST' })).status, 405)
})
test('oversized chunked requests get a 413 response without terminating the response socket', async (t) => {
  const { url } = await fixture(t)
  const status = await new Promise((resolve, reject) => {
    const req = request(url + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      res.resume()
      res.on('end', () => resolve(res.statusCode))
    })
    req.on('error', reject)
    req.write('{"message":"')
    for (let i = 0; i < 10; i++) req.write('x'.repeat(8000))
    req.end('"}')
  })
  assert.equal(status, 413)
})
