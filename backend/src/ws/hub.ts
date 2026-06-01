import type WebSocket from 'ws'

export interface ConnectedClient {
  ws: WebSocket
  clientId: string
  tenantId: string
  lastSeq: number
}

class ConnectionHub {
  private clients = new Map<string, ConnectedClient>()

  add(client: ConnectedClient): void {
    this.clients.set(client.clientId, client)
    console.log(`[Hub] Client connected: ${client.clientId} (tenant: ${client.tenantId}) — ${this.clients.size} total`)
  }

  remove(clientId: string): void {
    this.clients.delete(clientId)
    console.log(`[Hub] Client disconnected: ${clientId} — ${this.clients.size} total`)
  }

  getByTenant(tenantId: string): ConnectedClient[] {
    return [...this.clients.values()].filter(c => c.tenantId === tenantId)
  }

  get(clientId: string): ConnectedClient | undefined {
    return this.clients.get(clientId)
  }

  updateSeq(clientId: string, seq: number): void {
    const client = this.clients.get(clientId)
    if (client) client.lastSeq = seq
  }

  count(): number { return this.clients.size }
}

export const hub = new ConnectionHub()
