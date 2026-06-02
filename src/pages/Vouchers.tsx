import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { useCapture } from '../hooks/useCapture'

interface Voucher {
  id: string
  type: string
  number: string
  date: string
  party_id: string | null
  narration: string | null
  total_amount: number
  status: string
}

interface Party { id: string; name: string }

const V_TYPES = ['SALES', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'JOURNAL', 'CREDIT_NOTE', 'DEBIT_NOTE']
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  POSTED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600'
}

export default function Vouchers() {
  const { db, ready } = useSyncLine()
  const { captureInsert, captureUpdate, captureDelete } = useCapture()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'SALES', number: '', date: new Date().toISOString().slice(0, 10), party_id: '', narration: '', total_amount: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')

  const load = async () => {
    if (!db) return
    const [vRows, pRows] = await Promise.all([
      db.rawQuery<Record<string, unknown>>(`SELECT * FROM vouchers WHERE _deleted=0 ORDER BY date DESC, number DESC`),
      db.rawQuery<Record<string, unknown>>(`SELECT id, name FROM parties WHERE _deleted=0 ORDER BY name`)
    ])
    setVouchers(vRows as unknown as Voucher[])
    setParties(pRows as unknown as Party[])
  }

  useEffect(() => { if (ready) load() }, [ready, db])

  const save = async () => {
    if (!db || !form.number.trim()) return
    setSaving(true); setError(null)
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.rawRun(
        `INSERT INTO vouchers (id, type, number, date, party_id, narration, total_amount, status, created_at, updated_at, _version, _deleted) VALUES (?,?,?,?,?,?,?,'DRAFT',?,?,1,0)`,
        [id, form.type, form.number.trim(), form.date, form.party_id || null, form.narration || null, parseFloat(form.total_amount) || 0, now, now]
      )
      captureInsert('vouchers', id, { id, type: form.type, number: form.number.trim(), date: form.date, party_id: form.party_id || null, narration: form.narration || null, total_amount: parseFloat(form.total_amount) || 0, status: 'DRAFT' })
      setForm(f => ({ ...f, number: '', narration: '', total_amount: '0' }))
      setShowForm(false)
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!db) return
    const now = new Date().toISOString()
    await db.rawRun(`UPDATE vouchers SET _deleted=1, updated_at=? WHERE id=?`, [now, id])
    captureDelete('vouchers', id)
    await load()
  }

  const post = async (id: string) => {
    if (!db) return
    const now = new Date().toISOString()
    await db.rawRun(`UPDATE vouchers SET status='POSTED', updated_at=? WHERE id=?`, [now, id])
    captureUpdate('vouchers', id, { status: 'POSTED' })
    await load()
  }

  const filtered = vouchers.filter(v => !filterType || v.type === filterType)
  const partyMap = Object.fromEntries(parties.map(p => [p.id, p.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Voucher
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Voucher</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {V_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number *</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. INV-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Party</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.party_id} onChange={e => setForm(f => ({ ...f, party_id: e.target.value }))}>
                <option value="">— None —</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount</label>
              <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Narration</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))} placeholder="Optional note" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterType('')} className={`text-xs px-3 py-1 rounded-full border ${!filterType ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>All</button>
        {V_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t === filterType ? '' : t)}
            className={`text-xs px-3 py-1 rounded-full border ${filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{vouchers.length === 0 ? 'No vouchers yet' : 'No results'}</p>
          {vouchers.length === 0 && <p className="text-sm mt-1">Click "+ New Voucher" to create one</p>}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Party</th>
                <th className="px-4 py-2 font-medium">Narration</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.number}</td>
                  <td className="px-4 py-3 text-gray-600">{v.type}</td>
                  <td className="px-4 py-3 text-gray-600">{v.date}</td>
                  <td className="px-4 py-3 text-gray-500">{v.party_id ? (partyMap[v.party_id] ?? v.party_id.slice(0, 8)) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{v.narration ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(v.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    {v.status === 'DRAFT' && (
                      <button onClick={() => post(v.id)} className="text-xs text-green-600 hover:text-green-800">Post</button>
                    )}
                    <button onClick={() => remove(v.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
