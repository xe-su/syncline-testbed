import { WebAdapter, DBWrapper, MigrationRunner } from 'syncline'
import { migrations } from './lib/migrations'
import { allSchemas } from './lib/schema'

export async function initSyncLine() {
  const adapter = new WebAdapter()
  await adapter.open('testbed', {})

  const db = new DBWrapper(adapter)
  for (const schema of allSchemas) {
    db.registerTable(schema)
  }

  const runner = new MigrationRunner(db, migrations)
  await runner.run()

  return { db }
}
