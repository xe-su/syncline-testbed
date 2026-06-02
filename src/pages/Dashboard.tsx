import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { useSyncStatus } from '../hooks/useSyncStatus'

export default function Dashboard() {
  const { db, ready } = useSyncLine()
  const status = useSyncStatus()
  const [stats, setStats] = useState({ ledgers: 0, vouchers: 0, parties: 0, queueDepth: 0 })

  useEffect(() => {
    if (!db || !ready) return
    const load = async () => {
      const [ledgersR, vouchersR, partiesR, queueR] = await Promise.all([
        db.rawQuery<{ c: number }>(`SELECT COUNT(*) as c FROM ledgers WHERE _deleted=0`),
        db.rawQuery<{ c: number }>(`SELECT COUNT(*) as c FROM vouchers WHERE _deleted=0`),
        db.rawQuery<{ c: number }>(`SELECT COUNT(*) as c FROM parties WHERE _deleted=0`),
        db.rawQuery<{ c: number }>(`SELECT COUNT(*) as c FROM _syncline_queue WHERE synced=0`).catch(() => [{ c: 0 }])
      ])
      setStats({
        ledgers: ledgersR[0]?.c ?? 0,
        vouchers: vouchersR[0]?.c ?? 0,
        parties: partiesR[0]?.c ?? 0,
        queueDepth: queueR[0]?.c ?? 0
      })
    }
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [db, ready])

  const statusColor = status === 'connected' ? 'text-green-600' : status === 'syncing' ? 'text-blue-600' : 'text-gray-500'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sync Status" value={<span className={statusColor}>{status}</span>} />
        <StatCard label="Offline Queue" value={stats.queueDepth} />
        <StatCard label="Ledgers" value={stats.ledgers} />
        <StatCard label="Vouchers" value={stats.vouchers} />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Info</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex gap-2"><span className="font-medium">Parties:</span>{stats.parties}</div>
          <div className="flex gap-2"><span className="font-medium">Backend:</span>http://localhost:3001</div>
          <div className="flex gap-2"><span className="font-medium">WebSocket:</span>ws://localhost:3001/ws</div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1 capitalize">{value}</div>
    </div>
  )
}
