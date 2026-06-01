import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { getChangesSince, getCurrentSeq } from '../services/change-log'

const router = Router()

// GET /sync/changes?since_seq=N&limit=500
router.get('/changes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.auth!.tenant_id
    const sinceSeq = parseInt(req.query.since_seq as string ?? '0', 10)
    const limit = Math.min(parseInt(req.query.limit as string ?? '500', 10), 1000)

    const { changes, hasMore, nextSeq } = await getChangesSince(tenantId, sinceSeq, limit)
    const serverSeq = await getCurrentSeq(tenantId)

    res.json({ changes, has_more: hasMore, next_seq: nextSeq, server_seq: serverSeq })
  } catch (err) {
    console.error('[Sync] Changes error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
