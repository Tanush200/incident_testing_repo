import { useFlowRecord } from '@/lib/flow'

interface Props { incidentId?: string | null; record?: Record<string, unknown>; className?: string }

function slaStatus(record: Record<string, unknown>): { label: string; cls: string } {
  const breached = record['slaBreached'] as boolean | undefined
  const dueAt = record['slaDueAt'] as string | undefined
  if (breached) return { label: 'SLA Breached', cls: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]' }
  if (!dueAt) return { label: 'No SLA', cls: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]' }
  const remaining = new Date(dueAt).getTime() - Date.now()
  const hours = remaining / 3600000
  if (hours < 0) return { label: 'SLA Breached', cls: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]' }
  if (hours < 1) return { label: `< 1h remaining`, cls: 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]' }
  if (hours < 4) return { label: `${Math.ceil(hours)}h remaining`, cls: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]' }
  return { label: 'SLA OK', cls: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]' }
}

export function SLABadge({ incidentId, record: externalRecord, className }: Props) {
  const { record: fetched } = useFlowRecord('incidents', incidentId ?? null)
  const record = externalRecord ?? fetched
  if (!record) return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#9ca3af] border border-[#e5e7eb] ${className ?? ''}`}>Loading…</span>
  const { label, cls } = slaStatus(record)
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls} ${className ?? ''}`}>{label}</span>
}
