import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import { config } from './config'
import { setupWebSocketServer } from './ws/server'
import authRouter from './routes/auth'
import syncRouter from './routes/sync'
import healthRouter from './routes/health'

const app = express()
app.use(express.json())

// CORS for testbed dev
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Tenant-Id')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  next()
})

app.use('/auth', authRouter)
app.use('/sync', syncRouter)
app.use('/health', healthRouter)

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })
setupWebSocketServer(wss)

server.listen(config.port, () => {
  console.log(`[SyncLine Backend] Running on port ${config.port}`)
  console.log(`[SyncLine Backend] WebSocket: ws://localhost:${config.port}/ws`)
  console.log(`[SyncLine Backend] REST: http://localhost:${config.port}`)
})
