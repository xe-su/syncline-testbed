import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { signAccessToken, createRefreshToken, useRefreshToken, getTokenExpiresAt } from '../services/token'
import { query } from '../db/pool'

const router = Router()

// POST /auth/token — create new tokens (dev mode: no credential check)
router.post('/token', async (req, res) => {
  try {
    const { client_id, tenant_id } = req.body as { client_id?: string; tenant_id?: string }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const clientId = (client_id && uuidRegex.test(client_id)) ? client_id : uuidv4()
    const tenantId = (tenant_id && uuidRegex.test(tenant_id)) ? tenant_id : '00000000-0000-0000-0000-000000000001'

    // Upsert client
    await query(
      'INSERT INTO clients (id, tenant_id, last_seen) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET last_seen = now()',
      [clientId, tenantId]
    )

    const accessToken = signAccessToken({ client_id: clientId, tenant_id: tenantId })
    const refreshToken = await createRefreshToken(clientId, tenantId)

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: getTokenExpiresAt(),
      client_id: clientId,
      tenant_id: tenantId
    })
  } catch (err) {
    console.error('[Auth] Token error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string }
    if (!refresh_token) { res.status(400).json({ error: 'refresh_token required' }); return }

    const result = await useRefreshToken(refresh_token)
    if (!result) { res.status(401).json({ error: 'Invalid or expired refresh token' }); return }

    const accessToken = signAccessToken({ client_id: result.clientId, tenant_id: result.tenantId })
    const newRefreshToken = await createRefreshToken(result.clientId, result.tenantId)

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_at: getTokenExpiresAt()
    })
  } catch (err) {
    console.error('[Auth] Refresh error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
