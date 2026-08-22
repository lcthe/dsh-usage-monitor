import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './balance-capsule.module.css'

interface DirectoryStore {
  subscribe: (fn: () => void) => () => void
  getSnapshot: () => { current?: { provider: string; model: string } | null }
}

type BalanceCapsuleProps = { directory: DirectoryStore } & PropsLocale<typeof NS>

interface ProviderBalance {
  id: string
  name: string
  nameZh: string
  displayMode?: string | null
  balance?: {
    total?: number
    remaining?: number
    used?: number
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
  const prevProviderRef = useRef<string | null>(null)
  const prevNodeCountRef = useRef<number>(0)

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
          list.push({ id: p.id, name: p.name, nameZh: p.nameZh, displayMode: p.displayMode, balance: balData.value.balance })
        }
      }
      setProviders(list)
    } catch { /* ignore */ }
  }, [])

  // Initial load
  useEffect(() => { void fetchBalances() }, [fetchBalances])

  // Refresh on model switch
  useEffect(() => {
    if (mappedProvider && mappedProvider !== prevProviderRef.current) {
      prevProviderRef.current = mappedProvider
      void fetchBalances()
    }
  }, [mappedProvider, fetchBalances])

  // Refresh on message sent
  useEffect(() => {
    if (nodeCount !== prevNodeCountRef.current) {
      prevNodeCountRef.current = nodeCount
      if (mappedProvider) void fetchBalances()
    }
  }, [nodeCount, mappedProvider, fetchBalances])


  if (providers.length === 0) return null

  function formatCapsuleValue(p: ProviderBalance): string {
    const dm = p.displayMode
    if (dm === 'time-window' && p.balance?.timeWindows) {
      return p.balance.timeWindows.map(w => {
        const label = w.label === 'rolling' ? '5h' : w.label === 'weekly' ? '周' : '月'
        return `${label} ${w.percent}%`
      }).join('  ')
    }
    if (dm === 'usage-only') {
      const used = p.balance?.used
      if (used === undefined) return '--'
      return `$${used.toFixed(2)} used`
    }
    if (dm === 'token') {
      const remaining = p.balance?.remaining
      if (remaining === undefined) return '--'
      if (remaining >= 1000000) return `${(remaining / 1000000).toFixed(1)}M tokens`
      if (remaining >= 1000) return `${(remaining / 1000).toFixed(1)}k tokens`
      return `${Math.round(remaining)} tokens`
    }
    const remaining = p.balance?.remaining
    if (remaining === undefined) return '--'
    if (dm === 'currency-cny') return `¥${remaining.toFixed(2)}`
    if (dm === 'currency-usd') return `$${remaining.toFixed(2)}`
    return String(remaining)
  }

  const matched = mappedProvider
    ? providers.filter(p => p.id === mappedProvider)
    : []

  if (matched.length === 0) return null

  return (
    <div className={css.capsule} onClick={() => void fetchBalances()}>
      {matched.map(p => (
        <span key={p.id} className={css.item} title={`${p.nameZh}`}>
          <span className={css.value}>{formatCapsuleValue(p)}</span>
        </span>
      ))}
    </div>
  )
}
