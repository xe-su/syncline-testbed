import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { useCapture } from '../hooks/useCapture'

interface Ledger {
  id: string
  name: string
  type: string
  code: string | null
  opening_bal: number
  is_system: number
  _deleted: number
}

const TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY']

export default function Ledgers() {
  const { db, ready } = useSyncLine()
  const { captureInsert, captureDelete } = useCapture()
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'ASSET', code: '', opening_bal: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!db) return
    const rows = await db.rawQuery<Record<string, unknown>>(`SELECT * FROM ledgers WHERE _deleted=0 ORDER BY type, name`)
    setLedgers(rows as unknown as Ledger[])
  }

  useEffect(() => { if (ready) load() }, [ready, db])

  const save = async () => {
    if (!db || !form.name.trim()) return
    setSaving(true); setError(null)
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.rawRun(
        `INSERT INTO ledgers (id, name, type, code, opening_bal, is_system, created_at, updated_at, _version, _deleted) VALUES (?,?,?,?,?,0,?,?,1,0)`,
        [id, form.name.trim(), form.type, form.code.trim() || null, parseFloat(form.opening_bal) || 0, now, now]
      )
      captureInsert('ledgers', id, { id, name: form.name.trim(), type: form.type, code: form.code.trim() || null, opening_bal: parseFloat(form.opening_bal) || 0 })
      setForm({ name: '', type: 'ASSET', code: '', opening_bal: '0' })
      setShowForm(false)
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!db) return
    const now = new Date().toISOString()
    await db.rawRun(`UPDATE ledgers SET _deleted=1, updated_at=? WHERE id=?`, [now, id])
    captureDelete('ledgers', id)
    await load()
  }

  const grouped = TYPES.reduce<Record<string, Ledger[]>>((acc, t) => {
    acc[t] = ledgers.filter(l => l.type === t)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ledgers</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Ledger
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Ledger</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sundry Debtors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. SD001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opening Balance</label>
              <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.opening_bal} onChange={e => setForm(f => ({ ...f, opening_bal: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {ledgers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No ledgers yet</p>
          <p className="text-sm mt-1">Click "+ Add Ledger" to create one</p>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPES.map(type => grouped[type].length > 0 && (
            <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{type}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium text-right">Opening Balance</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[type].map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {l.name}
                        {l.is_system === 1 && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">system</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{l.code ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{Number(l.opening_bal).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {l.is_system !== 1 && (
                          <button onClick={() => remove(l.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
