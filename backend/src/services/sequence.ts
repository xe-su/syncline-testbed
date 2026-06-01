import { getCurrentSeq } from './change-log'

export async function getServerSeq(tenantId: string): Promise<number> {
  return getCurrentSeq(tenantId)
}
