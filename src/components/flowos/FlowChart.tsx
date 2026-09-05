import { useFlowQuery } from '@/lib/flow'

interface Props {
  table?: string
  filters?: Record<string, unknown>
  chartType?: 'bar' | 'line' | 'pie'
  groupByField?: string
  valueField?: string
  aggregate?: 'count' | 'sum'
  label?: string
  data?: Record<string, unknown>[]
  loading?: boolean
}

function SimpleBarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="space-y-1.5">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate text-[11px] text-[#6b7280] text-right capitalize">{label.replace(/_/g, ' ')}</span>
          <div className="flex-1 bg-[#f3f4f6] rounded-full h-5 overflow-hidden">
            <div className="h-5 rounded-full bg-[#2563eb] transition-all" style={{ width: maxVal ? `${(value / maxVal) * 100}%` : '0%' }} />
          </div>
          <span className="w-8 shrink-0 text-[11px] text-[#374151] font-medium">{value}</span>
        </div>
      ))}
    </div>
  )
}

export function FlowChart({ table, filters, chartType = 'bar', groupByField = 'status', valueField, aggregate = 'count', label, data: externalData, loading: externalLoading }: Props) {
  const { data: fetched, loading: fetchedLoading } = useFlowQuery(table ?? '', filters, { limit: 1000 })
  const rows = externalData ?? fetched
  const loading = externalLoading ?? fetchedLoading

  const groups = rows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row[groupByField] ?? 'Other')
    acc[key] = (acc[key] ?? 0) + (aggregate === 'sum' && valueField ? Number(row[valueField] ?? 0) : 1)
    return acc
  }, {})

  const chartData = Object.entries(groups).map(([l, v]) => ({ label: l, value: v })).sort((a, b) => b.value - a.value).slice(0, 10)
  const maxVal = Math.max(...chartData.map(d => d.value), 1)

  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
      {label && <h3 className="text-sm font-semibold text-[#111827] mb-4">{label}</h3>}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-5 rounded-full bg-[#f3f4f6] animate-pulse" />)}</div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-center text-[#9ca3af] py-6">No data</p>
      ) : (
        <SimpleBarChart data={chartData} maxVal={maxVal} />
      )}
    </div>
  )
}
