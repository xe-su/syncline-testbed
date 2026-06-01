import { query } from '../db/pool'

export interface ChangeRecord {
  id: string
  table_name: string
  row_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: Record<string, unknown> | null
  seq: number
  hlc_ts: number
  client_id: string
  tenant_id: string
}

export async function saveChange(change: Omit<ChangeRecord, 'seq'>): Promise<ChangeRecord> {
  const rows = await query<ChangeRecord>(
    `INSERT INTO sync_changes (id, tenant_id, client_id, table_name, row_id, operation, payload, hlc_ts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id, tenant_id) DO NOTHING
     RETURNING *`,
    [change.id, change.tenant_id, change.client_id, change.table_name, change.row_id, change.operation, change.payload ? JSON.stringify(change.payload) : null, change.hlc_ts]
  )
  return rows[0] ?? { ...change, seq: 0 }
}

export async function getChangesSince(tenantId: string, sinceSeq: number, limit = 500): Promise<{ changes: ChangeRecord[]; hasMore: boolean; nextSeq: number }> {
  const rows = await query<ChangeRecord>(
    `SELECT seq, id, tenant_id, client_id, table_name, row_id, operation, payload, hlc_ts
     FROM sync_changes
     WHERE tenant_id = $1 AND seq > $2
     ORDER BY seq ASC
     LIMIT $3`,
    [tenantId, sinceSeq, limit + 1]
  )
  const hasMore = rows.length > limit
  const changes = hasMore ? rows.slice(0, limit) : rows
  const nextSeq = changes.length > 0 ? changes[changes.length - 1].seq : sinceSeq
  return { changes, hasMore, nextSeq }
}

export async function getCurrentSeq(tenantId: string): Promise<number> {
  const rows = await query<{ seq: number }>('SELECT MAX(seq) as seq FROM sync_changes WHERE tenant_id = $1', [tenantId])
  return rows[0]?.seq ?? 0
}
