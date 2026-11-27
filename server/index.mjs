import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createContactHandler } from './contact.mjs'
import { createChatHandler } from './chat.mjs'
import { createStaticHandler } from './static.mjs'
export function createAppServer({ directory = fileURLToPath(new URL('../dist', import.meta.url)), contact = {}, chat = {} } = {}) {
  const chatHandler = createChatHandler(chat)
  const send = createContactHandler(contact),
    serve = createStaticHandler(directory)
  const server = createServer(async (request, response) => {
    try {
      const path = request.url?.split('?')[0]
      if (path === '/healthz') {
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        response.end('{"ok":true}')
        return
      }
      if (path === '/api/chat') return await chatHandler(request, response)
      if (path === '/api/contact') return await send(request, response)
      if (path?.startsWith('/api/')) {
        response.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        response.end('{"ok":false,"error":"not_found"}')
        return
      }
      await serve(request, response)
    } catch {
      if (!response.headersSent) {
        response.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        response.end('{"ok":false,"error":"server_error"}')
      } else response.destroy()
    }
  })
  server.requestTimeout = 30000
  server.headersTimeout = 15000
  server.keepAliveTimeout = 5000
  return server
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 35000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.')
  const server = createAppServer()
  server.listen(port, '0.0.0.0', () => console.log(`Ghazi XP is listening on port ${port}.`))
  const stop = () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}
