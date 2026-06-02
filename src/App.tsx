import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Ledgers from './pages/Ledgers'
import Vouchers from './pages/Vouchers'
import Parties from './pages/Parties'
import ConflictInbox from './pages/ConflictInbox'
import MigrationLog from './pages/MigrationLog'
import SyncDebugger from './pages/SyncDebugger'
import { SyncStatusBadge } from './components/SyncStatusBadge'
import { SyncLineProvider } from './components/SyncLineProvider'

const nav = [
  { path: '/', label: 'Dashboard' },
  { path: '/ledgers', label: 'Ledgers' },
  { path: '/vouchers', label: 'Vouchers' },
  { path: '/parties', label: 'Parties' },
  { path: '/conflicts', label: 'Conflicts' },
  { path: '/migrations', label: 'Migrations' },
  { path: '/debug', label: 'Debug' }
]

export default function App() {
  return (
    <SyncLineProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="font-bold text-lg text-gray-900">SyncLine Testbed</span>
          <SyncStatusBadge />
        </header>
        <div className="flex flex-1">
          <nav className="w-48 bg-white border-r border-gray-200 p-4 space-y-1">
            {nav.map(n => (
              <NavLink key={n.path} to={n.path} end={n.path === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ledgers" element={<Ledgers />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/parties" element={<Parties />} />
              <Route path="/conflicts" element={<ConflictInbox />} />
              <Route path="/migrations" element={<MigrationLog />} />
              <Route path="/debug" element={<SyncDebugger />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
    </SyncLineProvider>
  )
}
