export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Sync Status" value="Connected" color="green" />
        <StatCard label="Queue Depth" value="0" color="blue" />
        <StatCard label="Conflicts" value="0" color="red" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className={`text-sm font-medium text-${color}-600`}>{label}</div>
      <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
