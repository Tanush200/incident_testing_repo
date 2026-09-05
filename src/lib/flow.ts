/**
 * FlowOS App SDK Client — auto-injected into every app project.
 *
 * Import: import { flow, useFlowQuery, useFlowRecord, useFlowTrigger, useFlowConnector } from '@/lib/flow'
 *
 * Auth is handled automatically via APP_SDK_TOKEN (set at deploy time).
 * Base URL is relative (/api/sdk) — works in dev and prod without config.
 * Never write raw fetch() calls. Always use this client.
 */
import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowRecord {
  _id: string
  [key: string]: unknown
}

export interface QueryOptions {
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface QueryResult<T = FlowRecord> {
  records: T[]
  total: number
}

export interface FieldDef {
  field: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'reference' | 'list' | 'json'
  choices?: Array<{ value: string; label: string }>
  reference?: string
  required?: boolean
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const BASE = '/api/sdk'

function getToken(): string {
  if (typeof process !== 'undefined' && process.env?.APP_SDK_TOKEN) {
    return process.env.APP_SDK_TOKEN
  }
  if (typeof window !== 'undefined' && (window as Record<string, unknown>).__APP_SDK_TOKEN) {
    return String((window as Record<string, unknown>).__APP_SDK_TOKEN)
  }
  return ''
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: { message: res.statusText } })) as Record<string, unknown>
    const msg = ((errBody['error'] as Record<string, unknown> | undefined)?.['message'] as string | undefined) ?? res.statusText
    throw new Error(msg)
  }
  const json = await res.json() as { success: boolean; data: T; error?: { message: string } }
  if (!json.success) throw new Error(json.error?.message ?? 'Request failed')
  return json.data
}

function toQS(filters?: Record<string, unknown>, options?: QueryOptions): string {
  const p = new URLSearchParams()
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null) p.set(k, String(v))
    }
  }
  if (options?.limit !== undefined) p.set('limit', String(options.limit))
  if (options?.offset !== undefined) p.set('offset', String(options.offset))
  if (options?.sort) p.set('sort', options.sort)
  if (options?.order) p.set('order', options.order)
  const s = p.toString()
  return s ? `?${s}` : ''
}

// Maps well-known table names to their dedicated SDK routes for better performance
const NATIVE_TABLES: Record<string, string> = {
  incidents: '/incidents',
  cmdb_cis: '/cmdb/cis',
}

function tableBase(table: string): string {
  return NATIVE_TABLES[table] ?? `/db/${table}`
}

function unwrap<T>(data: { data: T } | T): T {
  if (data && typeof (data as Record<string, unknown>)['data'] !== 'undefined') {
    return (data as { data: T }).data
  }
  return data as T
}

function unwrapList<T>(data: { data: T[]; count: number } | T[]): QueryResult<T> {
  if (Array.isArray(data)) return { records: data, total: data.length }
  const d = data as { data: T[]; count: number }
  return { records: d.data ?? [], total: d.count ?? 0 }
}

// ─── flow client ─────────────────────────────────────────────────────────────

export const flow = {
  /**
   * Query records from any FlowOS table.
   * @example
   * const { records } = await flow.query('incidents', { status: 'open', priority: '1' })
   * const { records: users } = await flow.query('users', {}, { limit: 50, sort: 'firstName' })
   */
  async query<T = FlowRecord>(
    table: string,
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    const qs = toQS(filters, options)
    const data = await request<{ data: T[]; count: number } | T[]>('GET', `${tableBase(table)}${qs}`)
    return unwrapList(data)
  },

  /**
   * Get a single record by id.
   * @example
   * const incident = await flow.getById('incidents', incidentId)
   */
  async getById<T = FlowRecord>(table: string, id: string): Promise<T | null> {
    try {
      const data = await request<{ data: T } | T>('GET', `${tableBase(table)}/${id}`)
      return unwrap(data)
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('NOT_FOUND') || msg.includes('404')) return null
      throw err
    }
  },

  /**
   * Create a new record.
   * @example
   * const created = await flow.create('incidents', { title: 'Server down', priority: '1', status: 'new' })
   */
  async create<T = FlowRecord>(table: string, data: Record<string, unknown>): Promise<T> {
    const result = await request<{ data: T } | T>('POST', tableBase(table), data)
    return unwrap(result)
  },

  /**
   * Update an existing record.
   * @example
   * await flow.update('incidents', id, { status: 'resolved', resolvedAt: new Date().toISOString() })
   */
  async update<T = FlowRecord>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
    const result = await request<{ data: T } | T>('PATCH', `${tableBase(table)}/${id}`, data)
    return unwrap(result)
  },

  /**
   * Delete a record.
   * @example
   * await flow.delete('incidents', id)
   */
  async delete(table: string, id: string): Promise<void> {
    await request<unknown>('DELETE', `${tableBase(table)}/${id}`)
  },

  /**
   * Invoke a Flow SDK artifact by its artifact key.
   * Use list_flowos_artifacts in the agent to see available keys.
   * @example
   * const result = await flow.invoke('send-welcome-email', { userId, recipientEmail })
   * const { escalated } = await flow.invoke('auto-escalate-p1', { incidentId }) as { escalated: boolean }
   */
  async invoke(artifactKey: string, params?: Record<string, unknown>): Promise<unknown> {
    const data = await request<{ output: unknown }>('POST', `/artifacts/${encodeURIComponent(artifactKey)}/invoke`, { params })
    return (data as { output: unknown }).output
  },

  /**
   * Call an Integration Studio connector. Credentials (API key, OAuth, Basic auth) are
   * injected server-side from the connector's stored configuration — never exposed to the browser.
   *
   * Use list_flowos_connectors in the agent to find available connector IDs.
   *
   * @param connectorId  The connector's MongoDB _id from Integration Studio
   * @param params       Request body (POST/PUT) or query params (GET) merged with the connector's base config
   * @param options      Optional overrides: method (e.g. 'GET'), path (appended to base URL)
   *
   * @example
   * // Call a Salesforce connector configured in Integration Studio
   * const { ok, body: accounts } = await flow.connector('6823abc...', { type: 'Account', limit: 10 })
   *
   * // Override HTTP method and path (for REST APIs with multiple resources)
   * const { body: issue } = await flow.connector('jira-id', {}, { method: 'GET', path: '/rest/api/3/issue/PROJ-123' })
   * const { body: created } = await flow.connector('jira-id', { summary: 'Bug', issuetype: { name: 'Bug' } })
   */
  async connector(
    connectorId: string,
    params?: Record<string, unknown>,
    options?: { method?: string; path?: string },
  ): Promise<{ ok: boolean; status: number; statusText: string; body: unknown; durationMs: number }> {
    const reqBody: Record<string, unknown> = { ...(params ?? {}) }
    if (options?.method) reqBody['method'] = options.method
    if (options?.path) reqBody['path'] = options.path
    const data = await request<{ ok: boolean; status: number; statusText: string; body: unknown; durationMs: number }>(
      'POST',
      `/connectors/${encodeURIComponent(connectorId)}/call`,
      reqBody,
    )
    return data
  },

  /**
   * Make a server-side HTTP request to any URL. Handles CORS (all requests are made server-side)
   * and allows injecting secrets from app env vars — API keys NEVER touch the browser.
   *
   * Store secrets in Builder → Settings → Environment (key=value pairs).
   * Reference them by key name in the auth option — the server substitutes the value.
   *
   * @example
   * // Public API (no auth)
   * const { body: weather } = await flow.http('https://api.weather.gov/points/39.7,-104.9')
   *
   * // Bearer token from app env var (set STRIPE_SECRET_KEY in Settings → Environment)
   * const { body: customers } = await flow.http('https://api.stripe.com/v1/customers', {
   *   auth: { type: 'bearer', envKey: 'STRIPE_SECRET_KEY' },
   * })
   *
   * // API key header (set MY_API_KEY in Settings → Environment)
   * const { body } = await flow.http('https://api.example.com/data', {
   *   method: 'POST',
   *   auth: { type: 'apikey', envKey: 'MY_API_KEY', headerName: 'X-Api-Key' },
   *   body: { query: 'SELECT *' },
   * })
   *
   * // HTTP Basic auth
   * const { body } = await flow.http('https://api.example.com/', {
   *   auth: { type: 'basic', usernameEnvKey: 'API_USER', passwordEnvKey: 'API_PASS' },
   * })
   */
  async http(
    url: string,
    options?: {
      method?: string
      headers?: Record<string, string>
      body?: unknown
      auth?: (
        | { type: 'bearer'; envKey: string }
        | { type: 'apikey'; envKey: string; headerName?: string }
        | { type: 'basic'; usernameEnvKey: string; passwordEnvKey: string }
      )
      timeoutMs?: number
    },
  ): Promise<{ ok: boolean; status: number; statusText: string; body: unknown; durationMs: number }> {
    const data = await request<{ ok: boolean; status: number; statusText: string; body: unknown; durationMs: number }>(
      'POST',
      '/http',
      {
        url,
        method: options?.method ?? 'GET',
        headers: options?.headers,
        body: options?.body,
        auth: options?.auth,
        timeoutMs: options?.timeoutMs,
      },
    )
    return data
  },

  /**
   * Trigger a workflow by its id (fire-and-forget).
   * Returns executionId immediately — workflow runs in the background.
   * Use when you don't need the result (escalations, notifications, background jobs).
   * @example
   * const { runId } = await flow.trigger('6823abc...', { source: 'portal', incidentId })
   */
  async trigger(workflowId: string, payload?: Record<string, unknown>): Promise<{ runId: string }> {
    const data = await request<{ triggered: boolean; workflowId: string; executionId?: string }>('POST', `/workflows/${workflowId}/trigger`, payload ?? {})
    return { runId: String((data as Record<string, unknown>)['executionId'] ?? (data as Record<string, unknown>)['workflowId'] ?? workflowId) }
  },

  /**
   * Trigger a workflow and wait for its result (synchronous, max 120s).
   * Use for validation, data transformation, approval checks, or any workflow
   * where you need the output before continuing.
   *
   * Returns { output, status, executionId, durationMs, error }.
   * status: 'completed' | 'failed' | 'waiting' | 'timeout'
   * - 'waiting' means the workflow hit an approval/wait node — it is still running
   * - 'timeout' means it didn't finish in timeoutMs; executionId is set so you can poll later
   *
   * @example
   * const { output, status } = await flow.triggerSync('wf_abc123', { incidentId })
   * if (status === 'completed') console.log('result:', output)
   * if (status === 'failed') console.error('workflow failed')
   * if (status === 'timeout') pollLater(executionId)
   */
  async triggerSync(
    workflowId: string,
    payload?: Record<string, unknown>,
    timeoutMs = 30_000,
  ): Promise<{ output: unknown; status: string; executionId: string; durationMs: number; error: string | null }> {
    const token = getToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${BASE}/workflows/${workflowId}/trigger/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ payload: payload ?? {}, timeoutMs }),
    })
    type SyncResult = { output: unknown; status: string; executionId: string; durationMs: number; error: string | null }
    const json = await res.json() as { success: boolean; data?: SyncResult; error?: { code: string; message: string } }
    if (res.status === 408) {
      const execId = String((json as Record<string, unknown>)?.['data']?.['executionId'] ?? '')
      return { output: null, status: 'timeout', executionId: execId, durationMs: timeoutMs, error: 'Workflow timed out' }
    }
    if (res.status === 503) throw new Error('Workflow is at max concurrency. Retry later.')
    if (!json.success && res.status !== 200) throw new Error(json.error?.message ?? 'triggerSync failed')
    if (!json.data) throw new Error('triggerSync: empty response')
    return json.data
  },

  /**
   * Poll the status and output of a workflow execution.
   * Use after flow.trigger() (async) when you need the result later.
   * Also useful to check status of a timed-out triggerSync.
   * @example
   * const { runId } = await flow.trigger('wf_abc123', { incidentId })
   * // ... user does other things ...
   * const exec = await flow.getExecution('wf_abc123', runId)
   * if (exec.status === 'completed') console.log(exec.output)
   */
  async getExecution(
    workflowId: string,
    execId: string,
  ): Promise<{
    executionId: string
    status: string
    output: unknown
    error: string | null
    startedAt: string
    completedAt: string | null
    durationMs: number | null
  }> {
    const data = await request<{
      executionId: string; status: string; output: unknown; error: string | null
      startedAt: string; completedAt: string | null; durationMs: number | null
    }>('GET', `/workflows/${workflowId}/executions/${execId}`)
    return data
  },

  /**
   * Send an in-app notification to a user.
   * @example
   * await flow.notify(userId, 'Your change request has been approved')
   */
  async notify(userId: string, message: string, channel = 'in_app'): Promise<void> {
    await request<unknown>('POST', '/notifications', {
      userId,
      message,
      type: channel,
      title: 'App Notification',
    })
  },

  /**
   * Get field definitions for a table (schema introspection at runtime).
   * @example
   * const fields = await flow.schema('incidents')
   * const statusField = fields.find(f => f.field === 'status')
   * const validStatuses = statusField?.choices?.map(c => c.value)
   */
  async schema(table: string): Promise<FieldDef[]> {
    try {
      const data = await request<{ fields: FieldDef[] } | FieldDef[]>('GET', `/db/${table}/schema`)
      if (Array.isArray(data)) return data
      return (data as { fields: FieldDef[] }).fields ?? []
    } catch (_err) {
      return []
    }
  },
}

// ─── React hooks ──────────────────────────────────────────────────────────────

export interface UseFlowQueryResult<T = FlowRecord> {
  data: T[]
  total: number
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * React hook for reactive data queries against any FlowOS table.
 * Re-fetches whenever filters change. Provides loading/error states.
 * @example
 * const { data: incidents, loading, error, refetch } = useFlowQuery('incidents', { status: 'open' })
 * const { data: myTickets } = useFlowQuery('incidents', { assignedTo: currentUserId }, [currentUserId])
 */
export function useFlowQuery<T = FlowRecord>(
  table: string,
  filters?: Record<string, unknown>,
  deps: unknown[] = [],
): UseFlowQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    flow.query<T>(table, filters)
      .then(result => {
        if (!cancelled) { setData(result.records); setTotal(result.total); setError(null) }
      })
      .catch((err: Error) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(filters), tick, ...deps])

  return { data, total, loading, error, refetch }
}

export interface UseFlowRecordResult<T = FlowRecord> {
  record: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * React hook to fetch and reactively display a single FlowOS record by id.
 * Returns null while loading or if the record doesn't exist.
 * @example
 * const { record: incident, loading } = useFlowRecord('incidents', selectedId)
 * if (loading) return <Spinner />
 * if (!incident) return <div>Not found</div>
 */
export function useFlowRecord<T = FlowRecord>(
  table: string,
  id: string | null | undefined,
): UseFlowRecordResult<T> {
  const [record, setRecord] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(n => n + 1), [])

  useEffect(() => {
    if (!id) { setRecord(null); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    flow.getById<T>(table, id)
      .then(result => { if (!cancelled) { setRecord(result); setError(null) } })
      .catch((err: Error) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [table, id, tick])

  return { record, loading, error, refetch }
}

export interface UseFlowTriggerResult {
  trigger: (payload?: Record<string, unknown>) => Promise<{ runId: string }>
  triggerSync: (payload?: Record<string, unknown>, timeoutMs?: number) => Promise<Awaited<ReturnType<typeof flow.triggerSync>>>
  loading: boolean
  result: Awaited<ReturnType<typeof flow.triggerSync>> | null
  error: Error | null
  reset: () => void
}

/**
 * React hook for triggering workflows with automatic loading/result/error state.
 * Handles both fire-and-forget (trigger) and synchronous (triggerSync) modes.
 *
 * @example
 * // Button that triggers a workflow and shows result
 * const { triggerSync, loading, result, error } = useFlowTrigger('wf_abc123')
 *
 * return (
 *   <button onClick={() => triggerSync({ incidentId })} disabled={loading}>
 *     {loading ? 'Processing…' : 'Approve'}
 *   </button>
 *   {result?.status === 'completed' && <p>Done! {JSON.stringify(result.output)}</p>}
 *   {error && <p className="text-red-500">{error.message}</p>}
 * )
 *
 * // Fire-and-forget with loading state
 * const { trigger, loading } = useFlowTrigger('wf_escalate')
 * <button onClick={() => trigger({ incidentId })} disabled={loading}>Escalate</button>
 */
export function useFlowTrigger(workflowId: string): UseFlowTriggerResult {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Awaited<ReturnType<typeof flow.triggerSync>> | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => { setResult(null); setError(null) }, [])

  const trigger = useCallback(async (payload?: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    try {
      return await flow.trigger(workflowId, payload)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  const triggerSync = useCallback(async (payload?: Record<string, unknown>, timeoutMs?: number) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await flow.triggerSync(workflowId, payload, timeoutMs)
      setResult(res)
      return res
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  return { trigger, triggerSync, loading, result, error, reset }
}

export interface UseFlowConnectorResult<T = unknown> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
  status: number | null
}

/**
 * React hook for calling an Integration Studio connector with reactive loading/error state.
 * Credentials are injected server-side — API keys never reach the browser.
 *
 * Re-fetches whenever params change (uses JSON.stringify comparison).
 *
 * @example
 * // Fetch Salesforce accounts
 * const { data: accounts, loading } = useFlowConnector('salesforce-connector-id', { type: 'Account' })
 *
 * // Fetch Jira projects (GET override)
 * const { data: projects } = useFlowConnector('jira-id', {}, { method: 'GET', path: '/rest/api/3/project' })
 */
export function useFlowConnector<T = unknown>(
  connectorId: string,
  params?: Record<string, unknown>,
  options?: { method?: string; path?: string },
  deps: unknown[] = [],
): UseFlowConnectorResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(n => n + 1), [])

  useEffect(() => {
    if (!connectorId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    flow.connector(connectorId, params, options)
      .then(res => {
        if (!cancelled) {
          setData(res.body as T)
          setStatus(res.status)
          setError(res.ok ? null : new Error(`Connector returned ${res.status} ${res.statusText}`))
        }
      })
      .catch((err: Error) => { if (!cancelled) { setError(err); setStatus(null) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectorId, JSON.stringify(params), JSON.stringify(options), tick, ...deps])

  return { data, loading, error, status, refetch }
}
