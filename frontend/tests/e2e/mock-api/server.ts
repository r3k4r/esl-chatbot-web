import { createServer, type Server } from 'node:http'
import { personaFromToken } from '../../fixtures/api'
import { match } from './routes'

export const MOCK_API_PORT = Number(process.env.E2E_API_PORT ?? 4010)
export const MOCK_API_BASE = `http://localhost:${MOCK_API_PORT}/api/v1`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept-Language',
  'Access-Control-Expose-Headers': 'Retry-After', // as the real API does
}

/**
 * Deterministic stand-in for the backend API, used by both the Nuxt server (SSR)
 * and the browser. Stateless: writes echo plausible results but never persist, so
 * parallel tests cannot interfere. Unknown routes answer 501 and are logged.
 */
export function startMockApi(port = MOCK_API_PORT): Promise<Server> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`)
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return }
    if (url.pathname === '/__health') { res.writeHead(200, CORS); res.end('ok'); return }
    // Realtime (notifications / voice) is out of scope for the mock; the app retries quietly.
    if (url.pathname.startsWith('/socket.io')) { res.writeHead(404, CORS); res.end(); return }

    let raw = ''
    for await (const chunk of req) raw += chunk
    let body: unknown = raw
    if (raw && req.headers['content-type']?.includes('application/json')) {
      try { body = JSON.parse(raw) } catch { /* leave raw */ }
    }

    const path = url.pathname.replace(/^\/api\/v1/, '')
    const method = req.method ?? 'GET'
    const found = match(method, path)
    const reply = found
      ? found.handler({ method, path, params: found.params, query: url.searchParams, body, persona: personaFromToken(req.headers.authorization) })
      : { status: 501, body: { success: false, message: `Mock API has no route for ${method} ${path}` } }
    if (!found) console.warn(`[mock-api] unhandled ${method} ${path}`)
    // E2E_LOG_API=1 prints every call; "ssr" = made by the Nuxt server, "browser" = by the page.
    if (process.env.E2E_LOG_API) {
      const from = req.headers['user-agent']?.includes('Mozilla') ? 'browser' : 'ssr'
      console.log(`[mock-api] ${from} ${method} ${path} → ${reply.status}`)
    }

    res.writeHead(reply.status, { ...CORS, 'Content-Type': 'application/json' })
    res.end(reply.body === undefined ? '' : JSON.stringify(reply.body))
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve(server))
  })
}
