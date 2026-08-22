/**
 * Host-side entry for dsh-usage-monitor.
 * Registers HTTP API endpoints for querying provider balances.
 */

import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { PROVIDERS, type BalanceInfo, type ProviderConfig } from './providers.ts'

export const inject = ['credentials', 'webServer', 'sessions']

const API_BASE = '/dsh-usage-monitor-api'

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
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function queryBalance(provider: ProviderConfig, apiKey: string): Promise<BalanceInfo> {
  if (!provider.balanceApi) {
    return { raw: null }
  }

  const url = typeof provider.balanceApi.url === 'function'
    ? provider.balanceApi.url(provider.baseUrl)
    : provider.balanceApi.url

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    ...provider.balanceApi.headers,
  }

  const response = await fetchWithTimeout(url, {
    method: provider.balanceApi.method,
    headers,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  return provider.balanceApi.parse(data)
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_BASE,
    handler: async (req, res) => {
      const url = req.url ?? ''
      const parts = url.split('/').filter(Boolean)
      const endpoint = parts[parts.length - 1]

      try {
        if (req.method === 'POST' && endpoint === 'providers') {
          // List only configured providers with their credential status
          const all = await Promise.all(PROVIDERS.map(async (p) => {
            const ref = credentialRef(p.apiKeyEnv)
            const info = await ctx.credentials.describe(ref)
            return {
              id: p.id,
              name: p.name,
              nameZh: p.nameZh,
              configured: info.configured,
              supportBalance: !!p.balanceApi,
              consoleUrl: p.consoleUrl,
              apiKeyEnv: p.apiKeyEnv,
              limitType: p.limitType,
            }
          }))
          ok(res, all.filter(p => p.configured))
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
            // Walk session events backwards to find the last model used
            const events = (session as { events?: Array<Record<string, unknown>> }).events
            if (Array.isArray(events)) {
              for (let i = events.length - 1; i >= 0; i--) {
                const ev = events[i]
                // assistant/message events have source.provider and source.model
                if (ev['type'] === 'assistant/message') {
                  const source = ev['source'] as Record<string, unknown> | undefined
                  if (source && typeof source['provider'] === 'string' && typeof source['model'] === 'string') {
                    ok(res, { provider: source['provider'], model: source['model'] })
                    return
                  }
                }
                // turn/start or request events may have config with provider/model
                if (ev['type'] === 'turn/start' || ev['type'] === 'request') {
                  const data = ev['data'] as Record<string, unknown> | undefined
                  const config = data?.['config'] as Record<string, unknown> | undefined
                  if (config && typeof config['provider'] === 'string' && typeof config['model'] === 'string') {
                    ok(res, { provider: config['provider'], model: config['model'] })
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
          const ref = credentialRef(body.envVar)
          const cred = await ctx.credentials.resolve(ref)
          if (!cred) {
            fail(res, 404, `No API key found for ${body.envVar}`)
            return
          }
          try {
            const response = await fetchWithTimeout(body.url, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${cred.value}` },
            })
            if (response.ok) {
              ok(res, { success: true })
            } else {
              ok(res, { success: false, status: response.status })
            }
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

          if (!provider.balanceApi) {
            ok(res, { supported: false, consoleUrl: provider.consoleUrl })
            return
          }

          const ref = credentialRef(provider.apiKeyEnv)
          const cred = await ctx.credentials.resolve(ref)
          if (!cred) {
            fail(res, 404, `No API key configured for ${provider.name} (env: ${provider.apiKeyEnv})`)
            return
          }

          try {
            const balance = await queryBalance(provider, cred.value)
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
        fail(res, 500, message)
      }
    },
  }), 'dsh-usage-monitor: api routes')
}
