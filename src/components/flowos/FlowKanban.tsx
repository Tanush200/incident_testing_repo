import { useFlowQuery, flow } from '@/lib/flow'
import { useState } from 'react'

interface Props {
  table?: string
  filters?: Record<string, unknown>
  groupByField?: string
  titleField?: string
  onCardClick?: (row: Record<string, unknown>) => void
  data?: Record<string, unknown>[]
  loading?: boolean
}

const COLUMN_COLORS: Record<string, string> = {
  new: 'border-t-[#93c5fd]', open: 'border-t-[#93c5fd]',
  in_progress: 'border-t-[#fcd34d]', pending: 'border-t-[#fcd34d]',
  resolved: 'border-t-[#6ee7b7]', closed: 'border-t-[#d1d5db]',
  critical: 'border-t-[#fca5a5]', high: 'border-t-[#fdba74]',
}

export function FlowKanban({ table, filters, groupByField = 'status', titleField = 'title', onCardClick, data: externalData, loading: externalLoading }: Props) {
  const { data: fetched, loading: fetchedLoading } = useFlowQuery(table ?? '', filters, { limit: 200 })
  const rows = externalData ?? fetched
  const loading = externalLoading ?? fetchedLoading

  const groups = rows.reduce<Record<string, Record<string, unknown>[]>>((acc, row) => {
    const key = String(row[groupByField] ?? 'Uncategorised')
    ;(acc[key] ??= []).push(row)
    return acc
  }, {})

  if (loading) return (
    <div className="flex gap-3 overflow-x-auto p-1">
      {[1, 2, 3].map(i => <div key={i} className="w-64 shrink-0 rounded-xl border border-[#e8eaed] bg-[#f9fafb] h-48 animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex gap-3 overflow-x-auto p-1">
      {Object.entries(groups).map(([status, cards]) => (
        <div key={status} className={`w-64 shrink-0 rounded-xl border-t-4 border border-[#e8eaed] bg-[#f9fafb] ${COLUMN_COLORS[status] ?? 'border-t-[#e8eaed]'}`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#e8eaed]">
            <span className="text-[12px] font-semibold text-[#374151] capitalize">{status.replace(/_/g, ' ')}</span>
            <span className="rounded-full bg-white border border-[#e8eaed] px-2 py-0.5 text-[11px] text-[#6b7280]">{cards.length}</span>
          </div>
          <div className="p-2 space-y-2 min-h-[80px]">
            {cards.map(card => (
              <div key={String(card._id)} onClick={() => onCardClick?.(card)}
                className={`rounded-lg border border-[#e8eaed] bg-white p-3 ${onCardClick ? 'cursor-pointer hover:border-[#2563eb]/40 hover:shadow-sm' : ''} transition-all`}>
                <p className="text-[13px] font-medium text-[#111827] truncate">{String(card[titleField] ?? '—')}</p>
                {card.number && <p className="text-[11px] text-[#9ca3af] mt-0.5">#{String(card.number)}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
