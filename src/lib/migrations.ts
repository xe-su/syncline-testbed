import type { Migration } from 'syncline'

export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create accounting tables + system ledgers',
    up: async (db) => {
      await db.rawRun(`CREATE TABLE IF NOT EXISTS ledgers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        code TEXT, parent_id TEXT, opening_bal NUMERIC DEFAULT 0,
        is_system INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        _version INTEGER DEFAULT 1, _deleted INTEGER DEFAULT 0
      )`)
      await db.rawRun(`CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        phone TEXT, email TEXT, gstin TEXT, address TEXT, ledger_id TEXT,
        credit_limit NUMERIC DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        _version INTEGER DEFAULT 1, _deleted INTEGER DEFAULT 0
      )`)
      await db.rawRun(`CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY, type TEXT NOT NULL, number TEXT NOT NULL, date TEXT NOT NULL,
        party_id TEXT, narration TEXT, total_amount NUMERIC NOT NULL, status TEXT DEFAULT 'DRAFT',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        _version INTEGER DEFAULT 1, _deleted INTEGER DEFAULT 0
      )`)
      await db.rawRun(`CREATE TABLE IF NOT EXISTS voucher_lines (
        id TEXT PRIMARY KEY, voucher_id TEXT, ledger_id TEXT,
        debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, line_order INTEGER,
        _version INTEGER DEFAULT 1, _deleted INTEGER DEFAULT 0
      )`)
      const now = new Date().toISOString()
      const systemLedgers = [
        ['cash-001', 'Cash', 'ASSET', 'CASH'],
        ['bank-001', 'Bank', 'ASSET', 'BANK'],
        ['sales-001', 'Sales', 'INCOME', 'SALES'],
        ['purchases-001', 'Purchases', 'EXPENSE', 'PURCH'],
        ['capital-001', 'Capital', 'EQUITY', 'CAP']
      ]
      for (const [id, name, type, code] of systemLedgers) {
        await db.rawRun(
          `INSERT OR IGNORE INTO ledgers (id, name, type, code, is_system, opening_bal, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 0, ?, ?)`,
          [id, name, type, code, now, now]
        )
      }
    },
    down: async (db) => {
      await db.rawRun('DROP TABLE IF EXISTS voucher_lines')
      await db.rawRun('DROP TABLE IF EXISTS vouchers')
      await db.rawRun('DROP TABLE IF EXISTS parties')
      await db.rawRun('DROP TABLE IF EXISTS ledgers')
    }
  },
  {
    version: 2,
    description: 'Add indexes for sync performance',
    up: async (db) => {
      await db.rawRun('CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date)')
      await db.rawRun('CREATE INDEX IF NOT EXISTS idx_voucher_lines_voucher ON voucher_lines(voucher_id)')
      await db.rawRun('CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type)')
    },
    down: async (db) => {
      await db.rawRun('DROP INDEX IF EXISTS idx_vouchers_date')
      await db.rawRun('DROP INDEX IF EXISTS idx_voucher_lines_voucher')
      await db.rawRun('DROP INDEX IF EXISTS idx_parties_type')
    }
  },
  {
    version: 3,
    description: 'Add tags column to vouchers',
    up: 'ALTER TABLE vouchers ADD COLUMN tags TEXT',
    down: async (db) => {
      await db.rawRun(`CREATE TABLE vouchers_new AS SELECT id, type, number, date, party_id, narration, total_amount, status, created_at, updated_at, _version, _deleted FROM vouchers`)
      await db.rawRun('DROP TABLE vouchers')
      await db.rawRun('ALTER TABLE vouchers_new RENAME TO vouchers')
    }
  }
]
