import { useFlowQuery } from '@/lib/flow'
import { useState } from 'react'

interface Props {
  table?: string
  filters?: Record<string, unknown>
  columns?: string[]
  title?: string
  searchable?: boolean
  pageSize?: number
  onRowClick?: (row: Record<string, unknown>) => void
  selectable?: boolean
  data?: Record<string, unknown>[]
  loading?: boolean
}

export function FlowTable({ table, filters, columns, title, searchable, pageSize = 20, onRowClick, selectable, data: externalData, loading: externalLoading }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: fetchedData, loading: fetchedLoading } = useFlowQuery(
    table ?? '',
    { ...filters, ...(search ? { $search: search } : {}) },
    { limit: pageSize, offset: page * pageSize, sort: sortField || undefined, order: sortDir },
  )

  const rows = externalData ?? fetchedData
  const loading = externalLoading ?? fetchedLoading
  const visibleColumns = columns ?? (rows[0] ? Object.keys(rows[0]).filter(k => !k.startsWith('_') && k !== 'tenantId') : [])

  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white overflow-hidden">
      {(title || searchable) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed]">
          {title && <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>}
          {searchable && (
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Search…"
              className="h-7 rounded-lg border border-[#e5e7eb] px-3 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30" />
          )}
        </div>
      )}
      {loading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded-md bg-[#f3f4f6] animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
          <p className="text-sm">No records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e8eaed]">
              <tr>
                {selectable && <th className="w-10 px-4 py-2.5" />}
                {visibleColumns.map(col => (
                  <th key={col} onClick={() => { setSortField(col); setSortDir(d => sortField === col && d === 'asc' ? 'desc' : 'asc') }}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide cursor-pointer hover:text-[#111827] select-none">
                    {col}{sortField === col && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {rows.map(row => (
                <tr key={String(row._id)} onClick={() => { setSelectedId(String(row._id)); onRowClick?.(row) }}
                  className={`hover:bg-[#f9fafb] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedId === String(row._id) ? 'bg-[#eff6ff]' : ''}`}>
                  {selectable && <td className="px-4 py-2.5"><input type="checkbox" checked={selectedId === String(row._id)} readOnly className="accent-[#2563eb]" /></td>}
                  {visibleColumns.map(col => <td key={col} className="px-4 py-2.5 text-[#374151] truncate max-w-[200px]">{String(row[col] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length >= pageSize && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e8eaed]">
          <span className="text-xs text-[#6b7280]">Page {page + 1}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded text-xs border border-[#e5e7eb] disabled:opacity-40 hover:bg-[#f3f4f6]">←</button>
            <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded text-xs border border-[#e5e7eb] hover:bg-[#f3f4f6]">→</button>
          </div>
        </div>
      )}
    </div>
  )
}
