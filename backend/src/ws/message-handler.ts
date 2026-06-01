import type WebSocket from 'ws'
import { hub } from './hub'
import { broadcast } from './broadcaster'
import { saveChange, getChangesSince, getCurrentSeq } from '../services/change-log'
import type { ChangeRecord } from '../services/change-log'

export async function handleMessage(ws: WebSocket, raw: string, clientId: string, tenantId: string): Promise<void> {
  let msg: { type: string; [key: string]: unknown }
  try {
    msg = JSON.parse(raw) as { type: string; [key: string]: unknown }
  } catch {
    return
  }

  if (msg.type === 'HELLO') {
    const lastSeq = typeof msg.last_seq === 'number' ? msg.last_seq : 0
    hub.updateSeq(clientId, lastSeq)

    // Send catch-up changes
    const { changes, hasMore } = await getChangesSince(tenantId, lastSeq, 500)
    if (changes.length > 0) {
      ws.send(JSON.stringify({ type: 'CHANGES', changes, has_more: hasMore }))
    }

    const serverSeq = await getCurrentSeq(tenantId)
    ws.send(JSON.stringify({ type: 'READY', server_seq: serverSeq }))
    return
  }

  if (msg.type === 'CHANGE') {
    const change = msg.change as ChangeRecord
    if (!change?.id || !change?.table_name || !change?.operation) return

    const saved = await saveChange({
      id: change.id,
      tenant_id: tenantId,
      client_id: clientId,
      table_name: change.table_name,
      row_id: change.row_id,
      operation: change.operation,
      payload: change.payload ?? null,
      hlc_ts: change.hlc_ts ?? Date.now()
    })

    if (saved.seq > 0) {
      ws.send(JSON.stringify({ type: 'ACK', id: change.id, seq: saved.seq }))
      hub.updateSeq(clientId, saved.seq)
      broadcast(tenantId, { type: 'CHANGE', change: { ...change, seq: saved.seq } }, clientId)
    }
    return
  }

  if (msg.type === 'PING') {
    ws.send(JSON.stringify({ type: 'PONG' }))
    return
  }
}
