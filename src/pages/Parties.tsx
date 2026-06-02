import { useState, useEffect } from 'react'
import { useSyncLine } from '../hooks/useSyncLine'
import { useCapture } from '../hooks/useCapture'

interface Party {
  id: string
  name: string
  type: string
  phone: string | null
  email: string | null
  gstin: string | null
  credit_limit: number
}

const TYPES = ['CUSTOMER', 'VENDOR', 'BOTH']

export default function Parties() {
  const { db, ready } = useSyncLine()
  const { captureInsert, captureDelete } = useCapture()
  const [parties, setParties] = useState<Party[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'CUSTOMER', phone: '', email: '', gstin: '', credit_limit: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const load = async () => {
    if (!db) return
    const rows = await db.rawQuery<Record<string, unknown>>(`SELECT * FROM parties WHERE _deleted=0 ORDER BY name`)
    setParties(rows as unknown as Party[])
  }

  useEffect(() => { if (ready) load() }, [ready, db])

  const save = async () => {
    if (!db || !form.name.trim()) return
    setSaving(true); setError(null)
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.rawRun(
        `INSERT INTO parties (id, name, type, phone, email, gstin, credit_limit, created_at, updated_at, _version, _deleted) VALUES (?,?,?,?,?,?,?,?,?,1,0)`,
        [id, form.name.trim(), form.type, form.phone || null, form.email || null, form.gstin || null, parseFloat(form.credit_limit) || 0, now, now]
      )
      captureInsert('parties', id, { id, name: form.name.trim(), type: form.type, phone: form.phone || null, email: form.email || null, gstin: form.gstin || null, credit_limit: parseFloat(form.credit_limit) || 0 })
      setForm({ name: '', type: 'CUSTOMER', phone: '', email: '', gstin: '', credit_limit: '0' })
      setShowForm(false)
      await load()
    } catch (e) { setError(String(e)) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!db) return
    const now = new Date().toISOString()
    await db.rawRun(`UPDATE parties SET _deleted=1, updated_at=? WHERE id=?`, [now, id])
    captureDelete('parties', id)
    await load()
  }

  const filtered = parties.filter(p =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.type.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Party
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Party</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit Limit</label>
              <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} />
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

      <div className="mb-4">
        <input className="border border-gray-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-500"
          placeholder="Search parties…" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{parties.length === 0 ? 'No parties yet' : 'No results'}</p>
          {parties.length === 0 && <p className="text-sm mt-1">Click "+ Add Party" to create one</p>}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">GSTIN</th>
                <th className="px-4 py-2 font-medium text-right">Credit Limit</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'CUSTOMER' ? 'bg-blue-50 text-blue-700' : p.type === 'VENDOR' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.gstin ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{Number(p.credit_limit).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
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
