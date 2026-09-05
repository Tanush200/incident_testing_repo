import { useState } from 'react'
import { flow } from '@/lib/flow'
import { FlowTable } from '@/components/flowos'

export default function HomePage() {
  const [showCreate, setShowCreate] = useState(false)
  const [values, setValues] = useState({ title: '', description: '', priority: 'medium', status: 'new' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await flow.create('incidents', values)
      setValues({ title: '', description: '', priority: 'medium', status: 'new' })
      setShowCreate(false)
      setRefreshKey(k => k + 1)
    } catch (err) {
      setError(err.message || 'Failed to create incident')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#0c0b12' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#f4f4f5]">Incidents</h1>
            <p className="text-sm text-[#71717a] mt-1">Live list bound to the built-in incidents table.</p>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}
          >
            {showCreate ? 'Cancel' : '+ New Incident'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-xl border border-[#26232f] p-5 mb-6 space-y-3" style={{ background: '#121019' }}>
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Title</label>
              <input
                value={values.title}
                onChange={e => setValues(v => ({ ...v, title: e.target.value }))}
                required
                className="w-full h-9 rounded-lg border border-[#26232f] bg-[#0c0b12] px-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#7c3aed]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Description</label>
              <textarea
                value={values.description}
                onChange={e => setValues(v => ({ ...v, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-[#26232f] bg-[#0c0b12] px-3 py-2 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#7c3aed]/60 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Priority</label>
                <select
                  value={values.priority}
                  onChange={e => setValues(v => ({ ...v, priority: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-[#26232f] bg-[#0c0b12] px-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#7c3aed]/60"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Status</label>
                <select
                  value={values.status}
                  onChange={e => setValues(v => ({ ...v, status: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-[#26232f] bg-[#0c0b12] px-3 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#7c3aed]/60"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}
            >
              {submitting ? 'Creating…' : 'Create incident'}
            </button>
          </form>
        )}

        <FlowTable key={refreshKey} table="incidents" title="All Incidents" searchable pageSize={10} />
      </div>
    </div>
  )
}
