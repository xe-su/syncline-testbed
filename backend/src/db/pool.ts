import { Pool } from 'pg'
import { config } from '../config'

export const pool = new Pool({ connectionString: config.databaseUrl })

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error', err)
})

export async function query<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(sql, params)
  return result.rows as T[]
}

export async function queryOne<T extends Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}
