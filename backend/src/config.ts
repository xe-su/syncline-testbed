import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://syncline:syncline@localhost:5432/syncline',
  jwtSecret: process.env.JWT_SECRET ?? 'syncline-dev-secret-change-in-prod',
  jwtExpiry: '1h',
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  nodeEnv: process.env.NODE_ENV ?? 'development'
}
