import type { Context } from '@deepseek-ai/cordis'
import { NS, zh, en } from './locales.ts'
import { UsageSection } from './UsageSection.tsx'

export const inject = ['slots', 'locale']

async function usageRpc<T>(endpoint: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`/dsh-usage-monitor-api/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? `Request failed: ${res.status}`)
  return data.value as T
}

export { usageRpc }

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-usage-monitor: dictionaries')
  const t = ctx.locale.bind(NS)

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      { name: 'settings.section', id: 'usage', order: 30, label: () => t('tab'), locale: NS },
      UsageSection,
    ),
  )
}
