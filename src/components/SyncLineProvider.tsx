import { useState, useEffect, type ReactNode } from 'react'
import { SyncLineCtx } from '../hooks/useSyncLine'
import { initSyncLine } from '../syncline.config'
import type { SyncEngine, DBWrapper } from 'syncline'

export function SyncLineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ db: DBWrapper | null; engine: SyncEngine | null; ready: boolean }>({
    db: null, engine: null, ready: false
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initSyncLine()
      .then(({ db, engine }) => setState({ db, engine, ready: true }))
      .catch(e => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Init failed</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!state.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Initializing SyncLine…</p>
        </div>
      </div>
    )
  }

  return <SyncLineCtx.Provider value={state}>{children}</SyncLineCtx.Provider>
}
