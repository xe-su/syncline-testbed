import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { migrations } from '../lib/migrations'

interface AppliedMigration {
  version: number
  applied_at: string
  checksum: string
}

export default function MigrationLog() {
  const { db, ready } = useSyncLine()
  const [applied, setApplied] = useState<AppliedMigration[]>([])

  useEffect(() => {
    if (!db || !ready) return
    db.rawQuery<Record<string, unknown>>(`SELECT * FROM _syncline_migrations ORDER BY version ASC`)
      .then(rows => setApplied(rows as unknown as AppliedMigration[]))
      .catch(() => setApplied([]))
  }, [db, ready])

  const appliedSet = new Set(applied.map(a => a.version))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Migration Log</h1>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 font-medium">Version</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Applied At</th>
            </tr>
          </thead>
          <tbody>
            {migrations.map(m => {
              const a = applied.find(x => x.version === m.version)
              return (
                <tr key={m.version} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-700">v{m.version}</td>
                  <td className="px-4 py-3 text-gray-700">{m.description}</td>
                  <td className="px-4 py-3">
                    {appliedSet.has(m.version)
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Applied</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a ? new Date(a.applied_at).toLocaleString() : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">{applied.length}/{migrations.length} migrations applied</p>
    </div>
  )
}
