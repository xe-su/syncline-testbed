# SyncLine Testbed

Reference implementation and test app for [SyncLine](https://github.com/xe-su/syncline) — the offline-first sync SDK.

Demonstrates all SyncLine features using realistic accounting data (ledgers, vouchers, parties).

---

## What's Inside

```
syncline-testbed/
├── frontend/          React + Vite + Tailwind test app
└── backend/           Node.js + Express + PostgreSQL + WebSocket sync server
```

### Frontend Pages
| Page | Tests |
|------|-------|
| Dashboard | Sync status, queue depth, conflict count |
| Ledgers | Chart of accounts CRUD, real-time sync |
| Vouchers | Journal entries, offline write queue demo |
| Parties | Customer/vendor list, conflict trigger |
| Conflict Inbox | Side-by-side diff, Accept Local/Remote/Merge |
| Migration Log | Schema version history |
| Sync Debugger | Live WebSocket frames, sequence tracker |

### Backend API
```
WS   /ws?token=<jwt>              Live sync (HELLO → CHANGES → READY → CHANGE)
GET  /sync/changes?since_seq=N   Gap recovery, paginated (500/page)
POST /auth/token                  Get access + refresh tokens
POST /auth/refresh                Refresh access token
GET  /health                      DB ping
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend
npm install

# Create DB
createdb syncline
psql syncline < src/db/schema.sql

# Configure
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET

npm run dev
# → Running on port 3001
# → WebSocket: ws://localhost:3001/ws
```

### Frontend

```bash
# Root of repo
npm install
npm run dev
# → http://localhost:5173
```

---

## Schema Migrations (Client-side)

The testbed runs 3 migrations on first load:

| Version | Description |
|---------|-------------|
| 1 | Create ledgers, parties, vouchers, voucher_lines + seed 5 system ledgers |
| 2 | Add performance indexes |
| 3 | Add `tags` column to vouchers |

System ledgers seeded: Cash, Bank, Sales, Purchases, Capital.

---

## Test Scenarios

### Offline Write Queue
1. Open app → go offline (DevTools → Network → Offline)
2. Create 3 vouchers
3. Go back online
4. Watch queue drain → vouchers appear on server

### Conflict Resolution
1. Open app in two browser tabs
2. Go offline in both
3. Edit same party's name in both tabs
4. Bring both online
5. Conflict Inbox shows both versions — pick one

### Schema Migration
1. Clear IndexedDB / OPFS storage
2. Reload app
3. Migration Log shows versions 1, 2, 3 applied in sequence

### Encryption
1. Pass `encryptionKey` in `WebAdapter.open()` config
2. Hex-dump the OPFS file — should be ciphertext, not plaintext

---

## Environment Variables (Backend)

```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/syncline
JWT_SECRET=change-me-in-production
NODE_ENV=development
```

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + `ws` + PostgreSQL (`pg`)
- **Auth:** JWT (access) + bcrypt-hashed refresh tokens
- **Sync SDK:** [syncline](https://github.com/xe-su/syncline)
