import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { NS, zh, en } from './locales.ts'
import { UsageSection } from './UsageSection.tsx'
import { BalanceCapsule } from './BalanceCapsule.tsx'

export const inject = ['slots', 'locale', 'modelDirectories']

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

  ctx.inject(['modelDirectories', 'sessions'], (scope) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions
    scope.slots.inject('conversation.input.left', () =>
      scope.slots.register(
        {
          name: 'conversation.input.left',
          id: 'balance-capsule',
          order: 30,
          locale: NS,
          inject: (sessionId) => {
            const directory = models.directoryFor(sessionId)
            return {
              directory: directory.store,
              available: sessions.subagentAddress(sessionId) === undefined,
            }
          },
        },
        BalanceCapsule,
      ),
    )
  })
}
