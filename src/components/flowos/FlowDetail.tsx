import { useFlowRecord } from '@/lib/flow'

interface Props {
  table?: string
  recordId?: string | null
  fields?: string[]
  title?: string
  record?: Record<string, unknown>
  loading?: boolean
}

const SYSTEM_FIELDS = ['tenantId', 'workspaceId', '__v', 'createdBy', 'updatedBy']

export function FlowDetail({ table, recordId, fields: fieldSubset, title, record: externalRecord, loading: externalLoading }: Props) {
  const { record: fetched, loading: fetchedLoading } = useFlowRecord(table ?? '', recordId)
  const record = externalRecord ?? fetched
  const loading = externalLoading ?? fetchedLoading

  const visibleFields = fieldSubset ?? (record ? Object.keys(record).filter(k => !SYSTEM_FIELDS.includes(k) && !k.startsWith('_')) : [])

  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white overflow-hidden">
      {title && <div className="px-4 py-3 border-b border-[#e8eaed]"><h3 className="text-sm font-semibold text-[#111827]">{title}</h3></div>}
      {loading ? (
        <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="flex gap-4"><div className="h-4 w-24 rounded bg-[#f3f4f6] animate-pulse" /><div className="h-4 flex-1 rounded bg-[#f3f4f6] animate-pulse" /></div>)}</div>
      ) : !record ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#9ca3af]"><p className="text-sm">No record selected</p></div>
      ) : (
        <dl className="divide-y divide-[#f3f4f6]">
          {visibleFields.map(field => (
            <div key={field} className="flex items-start gap-4 px-4 py-2.5">
              <dt className="w-36 shrink-0 text-[12px] font-medium text-[#6b7280] capitalize pt-0.5">{field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</dt>
              <dd className="flex-1 text-[13px] text-[#111827] break-words">
                {record[field] === null || record[field] === undefined ? <span className="text-[#d1d5db]">—</span> : typeof record[field] === 'boolean' ? (record[field] ? '✓ Yes' : '✗ No') : String(record[field])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
