interface Props { number?: string | number | null; prefix?: string; className?: string }

export function TicketNumber({ number, prefix, className }: Props) {
  if (!number) return null
  const formatted = prefix ? `${prefix}-${number}` : `#${number}`
  return (
    <span className={`inline-flex items-center font-mono text-[12px] text-[#6b7280] ${className ?? ''}`}>
      {formatted}
    </span>
  )
}
