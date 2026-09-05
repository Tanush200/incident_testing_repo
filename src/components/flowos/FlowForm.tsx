import { flow, useFlowRecord } from '@/lib/flow'
import { useState, useEffect } from 'react'

interface FieldConfig { field: string; label: string; type: string; choices?: Array<{ value: string; label: string }>; required?: boolean }
interface Props {
  table: string; mode: 'create' | 'update'; recordId?: string; fields?: string[]
  onSuccess?: (record: Record<string, unknown>) => void; onCancel?: () => void; submitLabel?: string; title?: string
}

export function FlowForm({ table, mode, recordId, fields: fieldSubset, onSuccess, onCancel, submitLabel, title }: Props) {
  const [schema, setSchema] = useState<FieldConfig[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { record: existingRecord } = useFlowRecord(table, mode === 'update' ? recordId : null)

  useEffect(() => {
    flow.schema(table).then(defs => {
      const filtered = fieldSubset ? defs.filter(d => fieldSubset.includes(d.field)) : defs.filter(d => !['tenantId', 'workspaceId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(d.field))
      setSchema(filtered as FieldConfig[])
    })
  }, [table, fieldSubset])

  useEffect(() => { if (existingRecord && mode === 'update') setValues(existingRecord as Record<string, unknown>) }, [existingRecord, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null)
    try {
      const result = mode === 'create' ? await flow.create(table, values) : await flow.update(table, recordId!, values)
      setSuccess(true); onSuccess?.(result as Record<string, unknown>)
    } catch (err) { setError((err as Error).message) } finally { setSubmitting(false) }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-[#dcfce7] flex items-center justify-center mb-3">✓</div>
      <p className="text-sm font-medium text-[#111827]">{mode === 'create' ? 'Created' : 'Updated'} successfully</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#e8eaed] bg-white p-5 space-y-4">
      {title && <h3 className="text-sm font-semibold text-[#111827] mb-4">{title}</h3>}
      {schema.map(field => (
        <div key={field.field}>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">{field.label}{field.required && <span className="text-[#ef4444] ml-0.5">*</span>}</label>
          {field.type === 'boolean' ? (
            <input type="checkbox" checked={Boolean(values[field.field])} onChange={e => setValues(v => ({ ...v, [field.field]: e.target.checked }))} className="accent-[#2563eb]" />
          ) : field.type === 'list' && field.choices ? (
            <select value={String(values[field.field] ?? '')} onChange={e => setValues(v => ({ ...v, [field.field]: e.target.value }))} className="w-full h-9 rounded-lg border border-[#e5e7eb] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30">
              <option value="">Select…</option>
              {field.choices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          ) : (
            <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={String(values[field.field] ?? '')}
              onChange={e => setValues(v => ({ ...v, [field.field]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#e5e7eb] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30" required={field.required} />
          )}
        </div>
      ))}
      {error && <div className="rounded-lg bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#dc2626]">{error}</div>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting} className="flex-1 h-9 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1f2937] disabled:opacity-50 transition-colors">
          {submitting ? 'Saving…' : (submitLabel ?? (mode === 'create' ? 'Create' : 'Save changes'))}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 h-9 rounded-lg border border-[#e5e7eb] text-sm text-[#374151] hover:bg-[#f3f4f6] transition-colors">Cancel</button>}
      </div>
    </form>
  )
}
