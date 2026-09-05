import { useFlowTrigger } from '@/lib/flow'

interface Props { workflowId: string; params?: Record<string, unknown>; label?: string; successMessage?: string; errorMessage?: string; variant?: 'default' | 'danger' | 'success'; disabled?: boolean; className?: string }

const VARIANTS = { default: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white', danger: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white', success: 'bg-[#16a34a] hover:bg-[#15803d] text-white' }

export function ApprovalButton({ workflowId, params, label = 'Approve', successMessage = 'Done', errorMessage = 'Failed', variant = 'default', disabled, className }: Props) {
  const { triggerSync, loading, result, error, reset } = useFlowTrigger(workflowId)

  if ((result as Record<string, unknown> | undefined)?.status === 'completed') return (
    <div className="flex items-center gap-2">
      <span className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#dcfce7] text-[#16a34a] text-sm font-medium">✓ {successMessage}</span>
      <button onClick={reset} className="text-xs text-[#6b7280] hover:text-[#111827]">Reset</button>
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-2">
      <span className="h-8 flex items-center px-3 rounded-lg bg-[#fef2f2] text-[#dc2626] text-sm font-medium">✕ {errorMessage}</span>
      <button onClick={reset} className="text-xs text-[#6b7280] hover:text-[#111827]">Retry</button>
    </div>
  )

  return (
    <button onClick={() => triggerSync(params)} disabled={loading || disabled}
      className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ''}`}>
      {loading && <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {loading ? 'Processing…' : label}
    </button>
  )
}
