/**
 * Host-side entry for dsh-usage-monitor.
 * Registers HTTP API endpoints for querying provider balances.
 */

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { PROVIDERS, type BalanceInfo, type ProviderConfig } from './providers.ts'
import { loadQueryConfig, saveQueryConfig } from './query-config.ts'
import type { QueryAuth, QueryFields, QueryMethod, QueryOverride } from './query-types.ts'

export const inject = ['credentials', 'webServer', 'sessions']

const API_BASE = '/dsh-usage-monitor-api'
const queryConfig = loadQueryConfig()
const QUERY_METHODS = new Set<QueryMethod>(['GET', 'POST'])
const QUERY_AUTHS = new Set<QueryAuth>(['bearer', 'x-api-key', 'none'])
const FIELD_NAMES = ['remaining', 'total', 'used'] as const
const FIELD_PATH = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/

function isBlockedIp(address: string): boolean {
  const version = isIP(address)
  if (version === 4) {
    const [a, b] = address.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || a >= 224
  }
  if (version === 6) {
    const normalized = address.toLowerCase()
    return normalized === '::1' || normalized === '::'
      || normalized.startsWith('fc') || normalized.startsWith('fd')
      || normalized.startsWith('fe8') || normalized.startsWith('fe9')
      || normalized.startsWith('fea') || normalized.startsWith('feb')
  }
  return false
}

async function validateQueryUrl(value: unknown): Promise<string> {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('query URL is required')
  let parsed: URL
  try { parsed = new URL(value.trim()) } catch { throw new Error('query URL is invalid') }
  if (parsed.protocol !== 'https:') throw new Error('query URL must use HTTPS')
  const hostname = parsed.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('query URL host is not allowed')
  }
  if (isBlockedIp(hostname)) throw new Error('query URL host is not allowed')
  try {
    const records = await lookup(hostname, { all: true, verbatim: true })
    if (records.some(record => isBlockedIp(record.address))) throw new Error('query URL host is not allowed')
  } catch (error) {
    if (error instanceof Error && error.message === 'query URL host is not allowed') throw error
  }
  return parsed.toString()
}

function validateFieldPath(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !FIELD_PATH.test(value)) throw new Error('field path is invalid')
  return value
}

async function normalizeQueryOverride(value: unknown): Promise<QueryOverride> {
  if (!value || typeof value !== 'object') throw new Error('query configuration is invalid')
  const item = value as Record<string, unknown>
  const method = item.method
  const auth = item.auth
  if (typeof method !== 'string' || !QUERY_METHODS.has(method as QueryMethod)) throw new Error('query method is invalid')
  if (typeof auth !== 'string' || !QUERY_AUTHS.has(auth as QueryAuth)) throw new Error('query authentication is invalid')
  if (!item.fields || typeof item.fields !== 'object') throw new Error('query fields are required')
  const fields = item.fields as Record<string, unknown>
  const normalizedFields: QueryFields = {}
  for (const name of FIELD_NAMES) {
    const path = validateFieldPath(fields[name])
    if (path) normalizedFields[name] = path
  }
  if (!normalizedFields.remaining && !(normalizedFields.total && normalizedFields.used)) {
    throw new Error('remaining field or total and used fields are required')
  }
  return {
    url: await validateQueryUrl(item.url),
    method: method as QueryMethod,
    auth: auth as QueryAuth,
    fields: normalizedFields,
  }
}

function getPath(value: unknown, path: string | undefined): unknown {
  if (!path) return undefined
  let current = value
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function getDefaultQuery(provider: ProviderConfig): QueryOverride | null {
  if (!provider.balanceApi) return null
  return {
    url: typeof provider.balanceApi.url === 'function'
      ? provider.balanceApi.url(provider.baseUrl)
      : provider.balanceApi.url,
    method: provider.balanceApi.method,
    auth: 'bearer',
    fields: {},
  }
}

function getEffectiveQuery(provider: ProviderConfig): {
  override?: QueryOverride
  url?: string
  method?: QueryMethod
  headers?: Record<string, string>
  parse?: (data: unknown) => BalanceInfo
} {
  const override = queryConfig.providers[provider.id]
  if (override) return { override, url: override.url, method: override.method }
  if (!provider.balanceApi) return {}
  return {
    url: typeof provider.balanceApi.url === 'function' ? provider.balanceApi.url(provider.baseUrl) : provider.balanceApi.url,
    method: provider.balanceApi.method,
    headers: provider.balanceApi.headers,
    parse: provider.balanceApi.parse,
  }
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function ok(res: import('node:http').ServerResponse, value: unknown): void {
  json(res, 200, { ok: true, value })
}

function fail(res: import('node:http').ServerResponse, status: number, message: string): void {
  json(res, status, { ok: false, error: { message } })
}

async function readBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, redirect: 'error', signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function queryBalance(provider: ProviderConfig, apiKey?: string): Promise<BalanceInfo> {
  const query = getEffectiveQuery(provider)
  if (!query.url || !query.method) return { raw: null }
  await validateQueryUrl(query.url)

  const headers: Record<string, string> = { ...query.headers }
  if (query.override?.auth === 'bearer' && apiKey) headers.Authorization = `Bearer ${apiKey}`
  if (query.override?.auth === 'x-api-key' && apiKey) headers['X-API-Key'] = apiKey
  if (!query.override && apiKey) headers.Authorization = `Bearer ${apiKey}`

  const response = await fetchWithTimeout(query.url, { method: query.method, headers })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  if (query.parse) return query.parse(data)
  const override = query.override as QueryOverride
  const total = toNumber(getPath(data, override.fields.total))
  const used = toNumber(getPath(data, override.fields.used))
  const remaining = toNumber(getPath(data, override.fields.remaining))
    ?? (total !== undefined && used !== undefined ? total - used : undefined)
  if (remaining === undefined && total === undefined && used === undefined) {
    throw new Error('query response has no numeric balance fields')
  }
  return { total, used, remaining, raw: null }
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_BASE,
    handler: async (req, res) => {
      const parts = (req.url ?? '').split('/').filter(Boolean)
      const endpoint = parts[parts.length - 1]

      try {
        if (req.method === 'POST' && endpoint === 'providers') {
          const all = await Promise.all(PROVIDERS.map(async (p) => {
            const ref = credentialRef(p.apiKeyEnv)
            const info = await ctx.credentials.describe(ref)
            const override = queryConfig.providers[p.id]
            return {
              id: p.id,
              name: p.name,
              nameZh: p.nameZh,
              configured: info.configured,
              supportBalance: !!p.balanceApi || !!override,
              hasOverride: !!override,
              queryOverride: override ?? null,
              defaultQuery: getDefaultQuery(p),
              consoleUrl: p.consoleUrl,
              apiKeyEnv: p.apiKeyEnv,
              limitType: p.limitType,
              displayMode: p.displayMode ?? null,
            }
          }))
          ok(res, all.filter(p => p.configured))
          return
        }

        if (req.method === 'POST' && endpoint === 'query-config') {
          const body = await readBody(req) as { action?: string; providerId?: string; config?: unknown }
          if (!body.providerId || !PROVIDERS.some(p => p.id === body.providerId)) {
            fail(res, 400, 'Unknown provider')
            return
          }
          if (body.action === 'get') {
            ok(res, queryConfig.providers[body.providerId] ?? null)
            return
          }
          if (body.action === 'reset') {
            delete queryConfig.providers[body.providerId]
            saveQueryConfig(queryConfig)
            ok(res, null)
            return
          }
          if (body.action === 'save') {
            const normalized = await normalizeQueryOverride(body.config)
            queryConfig.providers[body.providerId] = normalized
            saveQueryConfig(queryConfig)
            ok(res, normalized)
            return
          }
          fail(res, 400, 'Invalid query configuration action')
          return
        }

        if (req.method === 'POST' && endpoint === 'current-model') {
          const body = await readBody(req) as { sessionId?: string }
          if (!body.sessionId) {
            fail(res, 400, 'Missing sessionId')
            return
          }
          try {
            const session = ctx.sessions.get(body.sessionId)
            if (!session) {
              ok(res, { provider: null, model: null })
              return
            }
            const events = (session as { events?: Array<Record<string, unknown>> }).events
            if (Array.isArray(events)) {
              for (let i = events.length - 1; i >= 0; i--) {
                const ev = events[i]
                if (ev.type === 'assistant/message') {
                  const source = ev.source as Record<string, unknown> | undefined
                  if (source && typeof source.provider === 'string' && typeof source.model === 'string') {
                    ok(res, { provider: source.provider, model: source.model })
                    return
                  }
                }
                if (ev.type === 'turn/start' || ev.type === 'request') {
                  const data = ev.data as Record<string, unknown> | undefined
                  const config = data?.config as Record<string, unknown> | undefined
                  if (config && typeof config.provider === 'string' && typeof config.model === 'string') {
                    ok(res, { provider: config.provider, model: config.model })
                    return
                  }
                }
              }
            }
            ok(res, { provider: null, model: null })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            ok(res, { provider: null, model: null, error: message })
          }
          return
        }

        if (req.method === 'POST' && endpoint === 'test-provider') {
          const body = await readBody(req) as { envVar?: string; url?: string }
          if (!body.envVar || !body.url) {
            fail(res, 400, 'Missing envVar or url')
            return
          }
          const url = await validateQueryUrl(body.url)
          const ref = credentialRef(body.envVar)
          const cred = await ctx.credentials.resolve(ref)
          if (!cred) {
            fail(res, 404, `No API key found for ${body.envVar}`)
            return
          }
          try {
            const response = await fetchWithTimeout(url, {
              method: 'GET',
              headers: { Authorization: `Bearer ${cred.value}` },
            })
            ok(res, response.ok ? { success: true } : { success: false, status: response.status })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            ok(res, { success: false, error: message })
          }
          return
        }

        if (req.method === 'POST' && endpoint === 'balance') {
          const body = await readBody(req) as { providerId?: string }
          const providerId = body.providerId
          if (!providerId) {
            fail(res, 400, 'Missing providerId')
            return
          }
          const provider = PROVIDERS.find(p => p.id === providerId)
          if (!provider) {
            fail(res, 404, `Unknown provider: ${providerId}`)
            return
          }
          const query = getEffectiveQuery(provider)
          if (!query.url || !query.method) {
            ok(res, { supported: false, consoleUrl: provider.consoleUrl })
            return
          }
          const needsCredential = !query.override || query.override.auth !== 'none'
          let apiKey: string | undefined
          if (needsCredential) {
            const ref = credentialRef(provider.apiKeyEnv)
            const cred = await ctx.credentials.resolve(ref)
            if (!cred) {
              fail(res, 404, `No API key configured for ${provider.name} (env: ${provider.apiKeyEnv})`)
              return
            }
            apiKey = cred.value
          }
          try {
            const balance = await queryBalance(provider, apiKey)
            ok(res, { supported: true, balance, consoleUrl: provider.consoleUrl })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            ok(res, { supported: true, error: message, consoleUrl: provider.consoleUrl })
          }
          return
        }

        fail(res, 404, 'Unknown endpoint')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        fail(res, 400, message)
      }
    },
  }), 'dsh-usage-monitor: api routes')
}
