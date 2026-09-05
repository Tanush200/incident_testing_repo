import { useFlowQuery } from '@/lib/flow'

interface Props { table: string; filters?: Record<string, unknown>; aggregate?: 'count' | 'sum' | 'avg'; field?: string; label: string; sublabel?: string; color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' }

const COLORS = {
  blue:   { bg: 'bg-[#eff6ff]', value: 'text-[#1e40af]' },
  green:  { bg: 'bg-[#f0fdf4]', value: 'text-[#166534]' },
  red:    { bg: 'bg-[#fef2f2]', value: 'text-[#991b1b]' },
  amber:  { bg: 'bg-[#fffbeb]', value: 'text-[#92400e]' },
  purple: { bg: 'bg-[#faf5ff]', value: 'text-[#6d28d9]' },
}

export function FlowStat({ table, filters, aggregate = 'count', field, label, sublabel, color = 'blue' }: Props) {
  const { data, loading } = useFlowQuery(table, filters, { limit: 1000 })
  const c = COLORS[color]
  const value = loading ? '…' : aggregate === 'count' ? data.length : aggregate === 'sum' ? data.reduce((s, r) => s + Number((r as Record<string, unknown>)[field ?? ''] ?? 0), 0) : data.length > 0 ? (data.reduce((s, r) => s + Number((r as Record<string, unknown>)[field ?? ''] ?? 0), 0) / data.length).toFixed(1) : 0

  return (
    <div className={`rounded-xl p-4 ${c.bg}`}>
      <p className="text-xs font-medium text-[#6b7280] mb-1">{label}</p>
      {loading ? <div className="h-8 w-16 rounded-md bg-current opacity-10 animate-pulse" /> : <p className={`text-2xl font-bold ${c.value}`}>{String(value)}</p>}
      {sublabel && <p className="text-xs text-[#9ca3af] mt-1">{sublabel}</p>}
    </div>
  )
}
