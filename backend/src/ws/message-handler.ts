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
    // SDK uses `table` + `timestamp`; DB column is `table_name` + `hlc_ts`
    const tableName = (change.table_name ?? change.table) as string | undefined
    const hlcTs = (change.hlc_ts ?? change.timestamp ?? Date.now()) as number
    if (!change?.id || !tableName || !change?.operation) return

    const saved = await saveChange({
      id: change.id,
      tenant_id: tenantId,
      client_id: clientId,
      table_name: tableName,
      row_id: change.row_id as string,
      operation: change.operation as 'INSERT' | 'UPDATE' | 'DELETE',
      payload: (change.payload ?? null) as Record<string, unknown> | null,
      hlc_ts: hlcTs
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
