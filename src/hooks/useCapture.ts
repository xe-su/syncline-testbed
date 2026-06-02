import { useSyncLine } from './useSyncLine'

export function useCapture() {
  const { engine } = useSyncLine()

  const captureInsert = (table: string, id: string, payload: Record<string, unknown>) => {
    engine?.getCapture().captureInsert(table, id, payload)
  }
  const captureUpdate = (table: string, id: string, payload: Record<string, unknown>) => {
    engine?.getCapture().captureUpdate(table, id, payload)
  }
  const captureDelete = (table: string, id: string) => {
    engine?.getCapture().captureDelete(table, id)
  }

  return { captureInsert, captureUpdate, captureDelete }
}
