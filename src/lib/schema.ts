import type { TableSchema } from 'syncline'

export const ledgerSchema: TableSchema = {
  name: 'ledgers',
  syncable: true,
  columns: [
    { name: 'id', type: 'TEXT', primaryKey: true },
    { name: 'name', type: 'TEXT' },
    { name: 'type', type: 'TEXT' },
    { name: 'code', type: 'TEXT', nullable: true },
    { name: 'parent_id', type: 'TEXT', nullable: true },
    { name: 'opening_bal', type: 'NUMERIC', default: '0' },
    { name: 'is_system', type: 'INTEGER', default: '0' },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: '_version', type: 'INTEGER', default: '1' },
    { name: '_deleted', type: 'INTEGER', default: '0' }
  ]
}

export const partySchema: TableSchema = {
  name: 'parties',
  syncable: true,
  columns: [
    { name: 'id', type: 'TEXT', primaryKey: true },
    { name: 'name', type: 'TEXT' },
    { name: 'type', type: 'TEXT' },
    { name: 'phone', type: 'TEXT', nullable: true },
    { name: 'email', type: 'TEXT', nullable: true },
    { name: 'gstin', type: 'TEXT', nullable: true },
    { name: 'address', type: 'TEXT', nullable: true },
    { name: 'ledger_id', type: 'TEXT', nullable: true },
    { name: 'credit_limit', type: 'NUMERIC', default: '0' },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: '_version', type: 'INTEGER', default: '1' },
    { name: '_deleted', type: 'INTEGER', default: '0' }
  ]
}

export const voucherSchema: TableSchema = {
  name: 'vouchers',
  syncable: true,
  columns: [
    { name: 'id', type: 'TEXT', primaryKey: true },
    { name: 'type', type: 'TEXT' },
    { name: 'number', type: 'TEXT' },
    { name: 'date', type: 'TEXT' },
    { name: 'party_id', type: 'TEXT', nullable: true },
    { name: 'narration', type: 'TEXT', nullable: true },
    { name: 'total_amount', type: 'NUMERIC' },
    { name: 'status', type: 'TEXT', default: "'DRAFT'" },
    { name: 'created_at', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: '_version', type: 'INTEGER', default: '1' },
    { name: '_deleted', type: 'INTEGER', default: '0' }
  ]
}

export const voucherLineSchema: TableSchema = {
  name: 'voucher_lines',
  syncable: true,
  columns: [
    { name: 'id', type: 'TEXT', primaryKey: true },
    { name: 'voucher_id', type: 'TEXT' },
    { name: 'ledger_id', type: 'TEXT' },
    { name: 'debit', type: 'NUMERIC', default: '0' },
    { name: 'credit', type: 'NUMERIC', default: '0' },
    { name: 'line_order', type: 'INTEGER' },
    { name: '_version', type: 'INTEGER', default: '1' },
    { name: '_deleted', type: 'INTEGER', default: '0' }
  ]
}

export const allSchemas = [ledgerSchema, partySchema, voucherSchema, voucherLineSchema]
