import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './balance-capsule.module.css'

interface DirectoryStore {
  subscribe: (fn: () => void) => () => void
  getSnapshot: () => { current?: { provider: string; model: string } | null }
}

interface Injected {
  directory: DirectoryStore
  available: boolean
}

type BalanceCapsuleProps = Injected & PropsLocale<typeof NS>

interface ProviderBalance {
  id: string
  name: string
  nameZh: string
  balance?: {
    total?: number
    remaining?: number
    currency?: string
    timeWindows?: { label: string; percent: number; resetsAt?: string }[]
  }
}

const PROVIDER_KEYWORDS: Record<string, string[]> = {
  'deepseek': ['deepseek'],
  'xiaomi': ['mimo', 'xiaomi'],
  'opencode-go': ['opencode'],
  'kimi-coding': ['kimi', 'moonshot'],
  'moonshotai': ['moonshot', 'kimi'],
  'zai': ['glm', 'zhipu', 'z.ai'],
}

function mapProvider(providerId: string): string | null {
  const pid = providerId.toLowerCase()
  for (const [balanceId, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
    if (keywords.some(k => pid.includes(k))) return balanceId
  }
  return null
}

export function BalanceCapsule({ directory, useSession, t }: BalanceCapsuleProps): JSX.Element | null {
  const [providers, setProviders] = useState<ProviderBalance[]>([])
  const modelState = useSyncExternalStore(
    (fn) => directory.subscribe(fn),
    () => directory.getSnapshot(),
  )
  const nodeCount = useSession((s: { chat: { order: number[] } }) => s.chat.order.length)

  const currentProvider = modelState?.current?.provider
  const mappedProvider = currentProvider ? mapProvider(currentProvider) : null

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch('/dsh-usage-monitor-api/providers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      const data = await res.json()
      if (!data.ok) return
      const list: ProviderBalance[] = []
      for (const p of data.value) {
        if (!p.supportBalance) continue
        const balRes = await fetch('/dsh-usage-monitor-api/balance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ providerId: p.id }),
        })
        const balData = await balRes.json()
        if (balData.ok && balData.value.supported) {
          list.push({ id: p.id, name: p.name, nameZh: p.nameZh, balance: balData.value.balance })
        }
      }
      setProviders(list)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    void fetchBalances()
    const timer = setInterval(() => void fetchBalances(), 60000)
    return () => clearInterval(timer)
  }, [fetchBalances])

  // Refresh when provider changes or new message sent
  useEffect(() => {
    if (mappedProvider) void fetchBalances()
  }, [mappedProvider, fetchBalances, nodeCount])

  const matched = mappedProvider
    ? providers.filter(p => p.id === mappedProvider)
    : []

  if (matched.length === 0) return null

  return (
    <div className={css.capsule} onClick={() => void fetchBalances()}>
      {matched.map(p => {
        if (p.balance?.timeWindows) {
          return p.balance.timeWindows.map(w => (
            <span
              key={`${p.id}-${w.label}`}
              className={css.item}
              title={`${p.nameZh} ${w.label}: ${w.percent}%`}
            >
              <span className={css.label}>{w.label === 'rolling' ? '5h' : w.label === 'weekly' ? '周' : '月'}</span>
              <span className={css.value}>{w.percent}%</span>
            </span>
          ))
        }
        const remaining = p.balance?.remaining
        const currency = p.balance?.currency
        const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : ''
        return (
          <span key={p.id} className={css.item} title={`${p.nameZh}: ${symbol}${remaining ?? '--'}`}>
            <span className={css.value}>{symbol}{remaining ?? '--'}</span>
          </span>
        )
      })}
    </div>
  )
}
