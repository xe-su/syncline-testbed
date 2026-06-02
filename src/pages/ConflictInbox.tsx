import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'

interface ConflictRecord {
  id: string
  table_name: string
  row_id: string
  local_payload: string
  remote_payload: string
  resolved: number
  created_at: string
}

export default function ConflictInbox() {
  const { db, ready } = useSyncLine()
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])

  const load = async () => {
    if (!db) return
    const rows = await db.rawQuery<Record<string, unknown>>(
      `SELECT * FROM _syncline_conflicts WHERE resolved=0 ORDER BY created_at DESC`
    ).catch(() => [])
    setConflicts(rows as unknown as ConflictRecord[])
  }

  useEffect(() => { if (ready) load() }, [ready, db])

  const resolve = async (id: string, useLocal: boolean) => {
    if (!db) return
    const conflict = conflicts.find(c => c.id === id)
    if (!conflict) return
    const payload = useLocal ? JSON.parse(conflict.local_payload) : JSON.parse(conflict.remote_payload)
    const now = new Date().toISOString()
    const fields = Object.entries(payload as Record<string, unknown>).filter(([k]) => k !== 'id')
    if (fields.length > 0) {
      const set = fields.map(([k]) => `"${k}"=?`).join(', ')
      await db.rawRun(`UPDATE "${conflict.table_name}" SET ${set} WHERE id=?`, [...fields.map(([, v]) => v), conflict.row_id])
    }
    await db.rawRun(`UPDATE _syncline_conflicts SET resolved=1 WHERE id=?`, [id])
    await load()
  }

  if (conflicts.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conflict Inbox</h1>
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No conflicts</p>
          <p className="text-sm mt-1">All changes have been resolved automatically</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conflict Inbox <span className="text-base font-normal text-red-500">({conflicts.length})</span></h1>
      <div className="space-y-4">
        {conflicts.map(c => (
          <div key={c.id} className="bg-white rounded-lg border border-red-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-gray-900">{c.table_name}</span>
                <span className="text-gray-400 text-xs ml-2">{c.row_id.slice(0, 8)}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Local</p>
                <pre className="text-xs bg-gray-50 rounded p-2 overflow-auto max-h-32 text-gray-700">{JSON.stringify(JSON.parse(c.local_payload), null, 2)}</pre>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Remote</p>
                <pre className="text-xs bg-gray-50 rounded p-2 overflow-auto max-h-32 text-gray-700">{JSON.stringify(JSON.parse(c.remote_payload), null, 2)}</pre>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => resolve(c.id, true)} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Use Local
              </button>
              <button onClick={() => resolve(c.id, false)} className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Use Remote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
