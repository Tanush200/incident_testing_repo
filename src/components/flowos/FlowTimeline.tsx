import { useFlowQuery } from '@/lib/flow'

interface Props {
  table?: string
  filters?: Record<string, unknown>
  dateField?: string
  titleField?: string
  bodyField?: string
  limit?: number
  data?: Record<string, unknown>[]
  loading?: boolean
}

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function FlowTimeline({ table, filters, dateField = 'createdAt', titleField = 'title', bodyField, limit = 10, data: externalData, loading: externalLoading }: Props) {
  const { data: fetched, loading: fetchedLoading } = useFlowQuery(table ?? '', filters, { sort: dateField, order: 'desc', limit })
  const rows = externalData ?? fetched
  const loading = externalLoading ?? fetchedLoading

  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white overflow-hidden">
      {loading ? (
        <div className="p-4 space-y-4">{[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="h-8 w-8 rounded-full bg-[#f3f4f6] animate-pulse shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 w-1/2 rounded bg-[#f3f4f6] animate-pulse" /><div className="h-3 w-full rounded bg-[#f3f4f6] animate-pulse" /></div></div>)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#9ca3af]"><p className="text-sm">No events</p></div>
      ) : (
        <div className="divide-y divide-[#f3f4f6]">
          {rows.map((row, i) => (
            <div key={String(row._id ?? i)} className="flex gap-3 px-4 py-3">
              <div className="flex flex-col items-center shrink-0">
                <span className="h-2 w-2 rounded-full bg-[#2563eb] mt-1.5" />
                {i < rows.length - 1 && <span className="flex-1 w-px bg-[#e8eaed] mt-1" />}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[13px] font-medium text-[#111827] truncate">{String(row[titleField] ?? '—')}</p>
                {bodyField && row[bodyField] && <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-2">{String(row[bodyField])}</p>}
                {row[dateField] && <p className="text-[11px] text-[#9ca3af] mt-1">{timeAgo(row[dateField] as string)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
