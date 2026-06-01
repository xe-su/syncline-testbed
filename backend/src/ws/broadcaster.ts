import WebSocket from 'ws'
import { hub } from './hub'

export function broadcast(tenantId: string, message: object, excludeClientId?: string): void {
  const clients = hub.getByTenant(tenantId)
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client.clientId === excludeClientId) continue
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload)
    }
  }
}
