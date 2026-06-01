import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'
import { query } from '../db/pool'

export interface JWTPayload {
  client_id: string
  tenant_id: string
  iat?: number
  exp?: number
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry })
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwtSecret) as JWTPayload
}

export async function createRefreshToken(clientId: string, tenantId: string): Promise<string> {
  const raw = uuidv4()
  const hash = await bcrypt.hash(raw, 10)
  const expiresAt = new Date(Date.now() + config.refreshTokenExpiry)
  await query(
    'INSERT INTO refresh_tokens (client_id, tenant_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [clientId, tenantId, hash, expiresAt]
  )
  return raw
}

export async function useRefreshToken(raw: string): Promise<{ clientId: string; tenantId: string } | null> {
  const tokens = await query<{ id: string; client_id: string; tenant_id: string; token_hash: string; expires_at: Date; revoked: boolean }>(
    'SELECT * FROM refresh_tokens WHERE revoked = false AND expires_at > now() ORDER BY created_at DESC'
  )
  for (const tok of tokens) {
    const match = await bcrypt.compare(raw, tok.token_hash)
    if (match) {
      await query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [tok.id])
      return { clientId: tok.client_id, tenantId: tok.tenant_id }
    }
  }
  return null
}

export function getTokenExpiresAt(): number {
  // 1h from now in ms
  return Date.now() + 60 * 60 * 1000
}
