import { useState, useEffect, useCallback } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsRuntime, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'
import { usageRpc } from './index.ts'
import { ProviderCard, type ProviderInfo, type BalanceData } from './ProviderCard.tsx'
import css from './usage-section.module.css'

type UsageSectionProps = PropsRuntime<'settings.section'> & PropsLocale<typeof NS>

type BalanceState = Record<string, { data: BalanceData | null; loading: boolean }>

export function UsageSection({ t }: UsageSectionProps): JSX.Element | null {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<BalanceState>({})
  const [filter, setFilter] = useState<'all' | 'configured' | 'supported'>('all')

  const loadProviders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await usageRpc<ProviderInfo[]>('providers')
      setProviders(result)
    } catch {
      // silent fail on load
    } finally {
      setLoading(false)
    }
  }, [])

  const queryBalance = useCallback(async (providerId: string) => {
    setBalances(prev => ({
      ...prev,
      [providerId]: { data: prev[providerId]?.data ?? null, loading: true },
    }))
    try {
      const result = await usageRpc<BalanceData>('balance', { providerId })
      setBalances(prev => ({ ...prev, [providerId]: { data: result, loading: false } }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setBalances(prev => ({
        ...prev,
        [providerId]: { data: { supported: true, error: message }, loading: false },
      }))
    }
  }, [])

  // Load providers on mount
  useEffect(() => { void loadProviders() }, [loadProviders])

  // Auto-query balances for configured providers that support it
  useEffect(() => {
    for (const p of providers) {
      if (p.configured && p.supportBalance && !balances[p.id]) {
        void queryBalance(p.id)
      }
    }
  }, [providers, balances, queryBalance])

  const refreshAll = useCallback(() => {
    setBalances({})
    void loadProviders()
  }, [loadProviders])

  const filtered = providers.filter(p => {
    if (filter === 'configured') return p.configured
    if (filter === 'supported') return p.configured && p.supportBalance
    return true
  })

  const configuredCount = providers.filter(p => p.configured).length

  if (loading) {
    return (
      <div className={css.root}>
        <div className={css.loadingState}>{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <div className={css.header}>
        <div className={css.titleGroup}>
          <h2 className={css.title}>{t('title')}</h2>
          <p className={css.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={css.actions}>
          <button className={css.refreshAllBtn} onClick={refreshAll}>{t('refreshAll')}</button>
        </div>
      </div>

      <div className={css.toolbar}>
        <div className={css.filters}>
          <button
            className={`${css.filterBtn} ${filter === 'all' ? css.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('allProviders')} ({providers.length})
          </button>
          <button
            className={`${css.filterBtn} ${filter === 'configured' ? css.filterActive : ''}`}
            onClick={() => setFilter('configured')}
          >
            {t('configured')} ({configuredCount})
          </button>
          <button
            className={`${css.filterBtn} ${filter === 'supported' ? css.filterActive : ''}`}
            onClick={() => setFilter('supported')}
          >
            {t('withBalance')} ({providers.filter(p => p.configured && p.supportBalance).length})
          </button>
        </div>
      </div>

      <div className={css.grid}>
        {filtered.map(p => (
          <ProviderCard
            key={p.id}
            provider={p}
            balance={balances[p.id]?.data ?? null}
            loading={balances[p.id]?.loading ?? false}
            onRefresh={() => void queryBalance(p.id)}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}
