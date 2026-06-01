import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import { verifyAccessToken } from '../services/token'
import { hub } from './hub'
import { handleMessage } from './message-handler'

export function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Extract token from query string
    const url = new URL(req.url ?? '', 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Missing token')
      return
    }

    let clientId: string
    let tenantId: string

    try {
      const payload = verifyAccessToken(token)
      clientId = payload.client_id
      tenantId = payload.tenant_id
    } catch {
      ws.close(4001, 'Invalid token')
      return
    }

    hub.add({ ws, clientId, tenantId, lastSeq: 0 })

    ws.on('message', (data) => {
      handleMessage(ws, data.toString(), clientId, tenantId).catch(err => {
        console.error('[WS] Message handler error', err)
      })
    })

    ws.on('close', () => {
      hub.remove(clientId)
    })

    ws.on('error', (err) => {
      console.error(`[WS] Client error ${clientId}:`, err)
    })
  })
}
