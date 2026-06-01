import { createContext, useContext } from 'react'
import type { SyncEngine, DBWrapper } from 'syncline'

export interface SyncLineContextType {
  db: DBWrapper | null
  engine: SyncEngine | null
  ready: boolean
}

export const SyncLineCtx = createContext<SyncLineContextType>({ db: null, engine: null, ready: false })
export const useSyncLine = () => useContext(SyncLineCtx)
