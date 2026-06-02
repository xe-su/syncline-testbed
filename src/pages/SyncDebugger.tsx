import { useState, useEffect, useRef } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { useSyncStatus } from '../hooks/useSyncStatus'
import type { SyncEngine } from 'syncline'

interface LogEntry {
  ts: string
  event: string
  data: string
}

export default function SyncDebugger() {
  const { engine } = useSyncLine()
  const status = useSyncStatus()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!engine) return
    const e = engine as SyncEngine & { on: (evt: string, cb: (d: unknown) => void) => () => void }

    const log = (event: string, data?: unknown) => {
      const entry: LogEntry = {
        ts: new Date().toLocaleTimeString(),
        event,
        data: data !== undefined ? JSON.stringify(data, null, 0).slice(0, 200) : ''
      }
      setLogs(prev => [...prev.slice(-99), entry])
    }

    const offs = [
      e.on('connected', () => log('connected')),
      e.on('disconnected', () => log('disconnected')),
      e.on('change', (d) => log('change', d)),
      e.on('synced', (d) => log('synced', d)),
      e.on('error', (d) => log('error', d))
    ]
    return () => offs.forEach(off => off())
  }, [engine])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const EVENT_COLORS: Record<string, string> = {
    connected: 'text-green-600',
    disconnected: 'text-gray-500',
    change: 'text-blue-600',
    synced: 'text-indigo-600',
    error: 'text-red-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sync Debugger</h1>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium capitalize ${status === 'connected' ? 'text-green-600' : 'text-gray-500'}`}>
            ● {status}
          </span>
          <button onClick={() => setLogs([])} className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">
            Clear
          </button>
        </div>
      </div>
      <div className="bg-gray-950 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-500">Waiting for events…</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="flex gap-3 py-0.5">
              <span className="text-gray-500 shrink-0">{entry.ts}</span>
              <span className={`font-semibold shrink-0 w-20 ${EVENT_COLORS[entry.event] ?? 'text-white'}`}>{entry.event}</span>
              <span className="text-gray-300 break-all">{entry.data}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
