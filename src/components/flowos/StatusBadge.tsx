const STATUS_COLORS: Record<string, string> = {
  open: 'bg-[#dbeafe] text-[#1d4ed8]', new: 'bg-[#dbeafe] text-[#1d4ed8]',
  in_progress: 'bg-[#fef3c7] text-[#92400e]', pending: 'bg-[#fef3c7] text-[#92400e]',
  resolved: 'bg-[#dcfce7] text-[#15803d]', closed: 'bg-[#f3f4f6] text-[#6b7280]',
  cancelled: 'bg-[#f3f4f6] text-[#6b7280]', critical: 'bg-[#fee2e2] text-[#991b1b]',
  high: 'bg-[#ffedd5] text-[#9a3412]', medium: 'bg-[#fef3c7] text-[#92400e]',
  low: 'bg-[#f0fdf4] text-[#166534]',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_COLORS[status?.toLowerCase()] ?? 'bg-[#f3f4f6] text-[#6b7280]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls} ${className ?? ''}`}>{status?.replace(/_/g, ' ') ?? '—'}</span>
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return <StatusBadge status={priority} className={className} />
}
