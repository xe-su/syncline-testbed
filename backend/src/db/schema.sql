-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Clients (connected devices)
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  label       TEXT,
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Global change log
CREATE TABLE IF NOT EXISTS sync_changes (
  seq         BIGSERIAL PRIMARY KEY,
  id          UUID NOT NULL,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL,
  table_name  TEXT NOT NULL,
  row_id      TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  payload     JSONB,
  hlc_ts      BIGINT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_changes_tenant_seq ON sync_changes(tenant_id, seq);
CREATE INDEX IF NOT EXISTS idx_sync_changes_table_row ON sync_changes(tenant_id, table_name, row_id);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL,
  tenant_id     UUID NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Accounting tables (server-side mirror for gap recovery)
CREATE TABLE IF NOT EXISTS ledgers (
  id            TEXT PRIMARY KEY,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  code          TEXT,
  parent_id     TEXT,
  opening_bal   NUMERIC(15,2) DEFAULT 0,
  is_system     BOOLEAN DEFAULT false,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  _version      INTEGER DEFAULT 1,
  _deleted      BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS parties (
  id            TEXT PRIMARY KEY,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  gstin         TEXT,
  address       TEXT,
  ledger_id     TEXT,
  credit_limit  NUMERIC(15,2) DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  _version      INTEGER DEFAULT 1,
  _deleted      BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS vouchers (
  id            TEXT PRIMARY KEY,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  number        TEXT NOT NULL,
  date          TEXT NOT NULL,
  party_id      TEXT,
  narration     TEXT,
  total_amount  NUMERIC(15,2) NOT NULL,
  status        TEXT DEFAULT 'DRAFT',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  _version      INTEGER DEFAULT 1,
  _deleted      BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS voucher_lines (
  id            TEXT PRIMARY KEY,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  voucher_id    TEXT,
  ledger_id     TEXT,
  debit         NUMERIC(15,2) DEFAULT 0,
  credit        NUMERIC(15,2) DEFAULT 0,
  line_order    INTEGER NOT NULL,
  _version      INTEGER DEFAULT 1,
  _deleted      BOOLEAN DEFAULT false
);

-- Default dev tenant
INSERT INTO tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'dev') ON CONFLICT DO NOTHING;
