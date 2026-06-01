import { useSyncStatus } from '../hooks/useSyncStatus'

const colors: Record<string, string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-gray-400',
  syncing: 'bg-blue-500',
  offline: 'bg-yellow-500'
}

export function SyncStatusBadge() {
  const status = useSyncStatus()
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${colors[status] ?? 'bg-gray-400'}`} />
      <span className="text-gray-600 capitalize">{status}</span>
    </div>
  )
}
