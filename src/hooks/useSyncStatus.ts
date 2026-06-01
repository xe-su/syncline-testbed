import { useState, useEffect } from 'react'
import { useSyncLine } from './useSyncLine'

export type SyncStatus = 'connected' | 'disconnected' | 'syncing' | 'offline'

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('disconnected')
  const { engine } = useSyncLine()

  useEffect(() => {
    if (!engine) return
    const off1 = engine.on('connected', () => setStatus('connected'))
    const off2 = engine.on('disconnected', () => setStatus('disconnected'))
    return () => { off1(); off2() }
  }, [engine])

  return status
}
