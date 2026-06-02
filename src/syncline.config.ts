import { WebAdapter, DBWrapper, MigrationRunner, SyncEngine, TokenManager } from 'syncline'
import type { AuthToken } from 'syncline'
import { migrations } from './lib/migrations'
import { allSchemas } from './lib/schema'

const BACKEND = 'http://localhost:3001'

export interface SyncLineInstance {
  db: DBWrapper
  engine: SyncEngine
  tokenManager: TokenManager
  clientId: string
  tenantId: string
}

export async function initSyncLine(): Promise<SyncLineInstance> {
  // 1. Get auth token from backend
  const tokenResp = await fetch(`${BACKEND}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (!tokenResp.ok) throw new Error(`Auth failed: ${tokenResp.status}`)
  const tokenData = await tokenResp.json() as AuthToken

  // 2. Set up TokenManager
  const tokenManager = new TokenManager({
    refreshEndpoint: `${BACKEND}/auth/refresh`
  })
  await tokenManager.setToken(tokenData)

  // 3. Open SQLite (OPFS-backed in browser)
  const adapter = new WebAdapter()
  await adapter.open('testbed', {})

  // 4. DBWrapper + schemas
  const db = new DBWrapper(adapter)
  for (const schema of allSchemas) {
    db.registerTable(schema)
  }

  // 5. Run migrations
  const runner = new MigrationRunner(db, migrations)
  await runner.run()

  // 6. Create SyncEngine
  const engine = new SyncEngine(db, {
    wsUrl: `ws://localhost:3001/ws`,
    restUrl: `${BACKEND}`,
    tenantId: tokenData.tenant_id,
    getToken: async () => {
      const t = await tokenManager.getValidToken()
      return t.access_token
    }
  })

  // Start engine (non-blocking — it connects in background)
  engine.start().catch(console.error)

  return { db, engine, tokenManager, clientId: tokenData.client_id, tenantId: tokenData.tenant_id }
}
